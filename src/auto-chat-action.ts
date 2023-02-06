import type { Transformer } from "./deps.ts";
import { Action } from "./types.ts";
import { getChatActionsForRequest } from "./chat-actions.ts";
import { createCycleGenerator } from "./utils.ts";

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

    const sendAction = async (
      chat_id: number | string,
      action: Action,
      message_thread_id?: number,
    ) => {
      try {
        await prev(
          "sendChatAction",
          {
            chat_id,
            action,
            ...(
              typeof message_thread_id !== "undefined"
                ? { message_thread_id }
                : {}
            ),
          },
          signal,
        );
      } catch {
        clearInterval(handle);
      }
    };

    const [hasChatActions, chatActions] = getChatActionsForRequest(
      method,
      payload,
    );

    if (
      hasChatActions &&
      "chat_id" in payload &&
      typeof payload.chat_id !== "undefined"
    ) {
      const { chat_id } = payload;

      const chatActionsGenerator = createCycleGenerator(chatActions);
      const threadId = "message_thread_id" in payload
        ? payload.message_thread_id
        : undefined;

      handle ??= setInterval(
        () => sendAction(chat_id, chatActionsGenerator.next().value, threadId),
        5_000,
      );
      sendAction(chat_id, chatActionsGenerator.next().value, threadId);
    }

    try {
      return await prev(method, payload, signal);
    } finally {
      clearInterval(handle);
    }
  };
}
