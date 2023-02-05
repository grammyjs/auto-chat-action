import type { Transformer } from "./deps.ts";

type Method =
  | "sendMessage"
  | "sendPhoto"
  | "sendVideo"
  | "sendVoice"
  | "sendDocument"
  | "sendSticker"
  | "sendLocation"
  | "sendVideoNote";

type Action =
  | "typing"
  | "upload_photo"
  | "upload_video"
  | "upload_voice"
  | "upload_document"
  | "choose_sticker"
  | "find_location"
  | "upload_video_note";

const actionByMethod = new Map([
  ["sendMessage", "typing"],
  ["sendPhoto", "upload_photo"],
  ["sendVideo", "upload_video"],
  ["sendVoice", "upload_voice"],
  ["sendDocument", "upload_document"],
  ["sendSticker", "choose_sticker"],
  ["sendLocation", "find_location"],
  ["sendVideoNote", "upload_video_note"],
]);

const isChatActionRequired = (method: string): method is Method =>
  actionByMethod.has(method);

const getChatAction = (method: Method): Action =>
  actionByMethod.get(method) as Action;

/**
 * Creates an
 * [API transformer function](https://grammy.dev/advanced/transformers.html)
 * that sends an appropriate chat action automatically.
 *
 * @returns The created API transformer function
 */
export function autoChatAction(): Transformer {
  return async (prev, method, payload, signal) => {
    let handle: ReturnType<typeof setTimeout> | undefined;

    if (isChatActionRequired(method) && "chat_id" in payload) {
      const sendAction = async () => {
        try {
          await prev(
            "sendChatAction",
            {
              chat_id: payload.chat_id as string | number,
              action: getChatAction(method),
            },
            signal,
          );
        } catch {
          clearInterval(handle);
        }
      };

      sendAction();
      handle ??= setInterval(() => sendAction, 5000);
    }

    try {
      return await prev(method, payload, signal);
    } finally {
      clearInterval(handle);
    }
  };
}
