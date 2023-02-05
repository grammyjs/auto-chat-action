import type { Transformer } from "./deps.ts";
import { getChatAction, isChatActionRequired, isFileUpload } from "./utils.ts";

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

    if (
      isChatActionRequired(method) &&
      isFileUpload(payload) &&
      "chat_id" in payload
    ) {
      const sendAction = async () => {
        try {
          await prev(
            "sendChatAction",
            {
              chat_id: payload.chat_id as string | number,
              action: getChatAction(method),
              ...("message_thread_id" in payload
                ? {
                  message_thread_id: payload.message_thread_id,
                }
                : {}),
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
