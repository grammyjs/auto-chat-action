import { Bot, Context } from "https://lib.deno.dev/x/grammy@1.x/mod.ts";
import { Message, Update } from "https://lib.deno.dev/x/grammy@1.x/types.ts";
import { AutoChatActionFlavor } from "../src/mod.ts";

export type AutoChatActionContext = Context & AutoChatActionFlavor;

export function createBot(): Bot<AutoChatActionContext> {
  const botInfo = {
    id: 1,
    first_name: "Dummy",
    is_bot: true as const,
    username: "dummy",
    can_join_groups: true as const,
    can_read_all_group_messages: true as const,
    supports_inline_queries: true as const,
  };

  return new Bot<AutoChatActionContext>("dummy", { botInfo });
}

export function createMessage(
  { chat_id }: { chat_id: number },
): Message & Update.NonChannel {
  return ({
    message_id: 1,
    from: {
      id: chat_id,
      is_bot: false,
      first_name: "Test",
    },
    chat: {
      id: chat_id,
      type: "private",
      first_name: "Test",
    },
    date: 1,
  });
}
export function createMessageInThread(
  { chat_id, message_thread_id }: {
    chat_id: number;
    message_thread_id: number;
  },
): Message & Update.NonChannel {
  return ({
    ...createMessage({ chat_id }),
    message_thread_id,
  });
}
