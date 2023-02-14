import { Api } from "./deps.ts";
import { Action, ChatId, Signal } from "./types.ts";
import { createCycleGenerator } from "./utils.ts";

export function createChatActionsController(api: Api) {
  const sendings = new Map<string, ReturnType<typeof setTimeout>>();

  const getSendingId = (chatId: ChatId, threadId?: number) =>
    typeof threadId === "undefined"
      ? chatId.toString()
      : `${chatId}:${threadId}`;

  return {
    startSending(
      chatId: ChatId,
      actions: Action[],
      messageThreadId?: number,
      signal?: Signal,
    ) {
      const chatActions = createCycleGenerator(actions);

      const sendChatAction = async () => {
        const action = chatActions.next().value;

        try {
          await api.sendChatAction(
            chatId,
            action,
            {
              ...(
                typeof messageThreadId !== "undefined"
                  ? { message_thread_id: messageThreadId }
                  : {}
              ),
            },
            signal,
          );
        } catch {
          this.stopSending(chatId);
        }
      };

      const sendingId = getSendingId(chatId, messageThreadId);

      if (sendings.has(sendingId)) {
        this.stopSending(chatId, messageThreadId);
      }

      sendings.set(
        sendingId,
        setInterval(
          sendChatAction,
          5_000,
        ),
      );
      sendChatAction();
    },

    stopSending(chatId: ChatId, messageThreadId?: number) {
      const sendingId = getSendingId(chatId, messageThreadId);

      clearInterval(sendings.get(sendingId));
      sendings.delete(sendingId);
    },
  };
}

export type ChatActionsController = ReturnType<
  typeof createChatActionsController
>;
