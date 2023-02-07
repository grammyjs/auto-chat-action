import { Action } from "./types.ts";
import { Context, type MiddlewareFn } from "./deps.ts";
import { createChatActionsController } from "./chat-actions-controller.ts";
import { getChatActionsForRequest } from "./media-chat-actions.ts";

export type AutoChatActionFlavor = {
  chatAction: Action | null;
};

export function autoChatAction<C extends Context>(): MiddlewareFn<
  C & AutoChatActionFlavor
> {
  return async (ctx, next) => {
    const isPluginInstalled = Object.hasOwn(ctx, "chatAction");
    if (isPluginInstalled) {
      return next();
    }

    const chatActionsController = createChatActionsController(ctx.api);

    ctx.api.config.use(
      async (prev, method, payload, signal) => {
        if (
          !("chat_id" in payload) ||
          typeof payload.chat_id === "undefined"
        ) {
          return prev(method, payload, signal);
        }

        const [hasActions, actions] = getChatActionsForRequest(
          method,
          payload,
        );

        if (!hasActions) {
          return prev(method, payload, signal);
        }

        const messageThreadId = "message_thread_id" in payload
          ? payload.message_thread_id
          : undefined;

        chatActionsController.startSending(
          payload.chat_id,
          actions,
          messageThreadId,
          signal,
        );

        try {
          return await prev(method, payload, signal);
        } finally {
          chatActionsController.stopSending(
            payload.chat_id,
            messageThreadId,
          );
          currentAction = null;
        }
      },
    );

    let currentAction: Action | null = null;
    Object.defineProperty(ctx, "chatAction", {
      get() {
        return currentAction;
      },
      set(newAction) {
        if (typeof ctx.chat?.id === "undefined") {
          return;
        }

        currentAction = newAction;

        if (typeof currentAction !== "string") {
          chatActionsController.stopSending(
            ctx.chat.id,
            ctx.msg?.message_thread_id,
          );
        } else {
          chatActionsController.startSending(
            ctx.chat.id,
            [currentAction],
            ctx.msg?.message_thread_id,
          );
        }
      },
    });

    try {
      await next();
    } finally {
      if (typeof ctx.chat?.id === "number") {
        chatActionsController.stopSending(
          ctx.chat.id,
          ctx.msg?.message_thread_id,
        );
      }
    }
  };
}

export function chatAction<C extends Context>(action: Action): MiddlewareFn<
  C & AutoChatActionFlavor
> {
  return (ctx, next) => {
    const isPluginNotInstalled = Object.hasOwn(ctx, "chatAction") === false;
    if (isPluginNotInstalled) {
      throw new Error(
        "Please first install the auto-chat-action plugin to set a chat action.",
      );
    }

    ctx.chatAction = action;

    return next();
  };
}
