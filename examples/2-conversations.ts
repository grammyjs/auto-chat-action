import {
  Bot,
  Context,
  session,
} from "https://lib.deno.dev/x/grammy@1.x/mod.ts";
import {
  ConversationFlavor,
  conversations,
  createConversation,
} from "https://lib.deno.dev/x/grammy_conversations@1.x/mod.ts";
import { autoChatAction, AutoChatActionFlavor } from "../src/mod.ts";

type MyContext = Context & AutoChatActionFlavor & ConversationFlavor;

// Create a bot
const bot = new Bot<MyContext>(Deno.env.get("BOT_TOKEN") as string);

// Install the plugin
bot.use(autoChatAction(bot.api));
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());
bot.use(
  createConversation(async (conversation, ctx) => {
    await ctx.reply("Hi, please send me your name");

    while (true) {
      ctx = await conversation.wait();

      ctx.chatAction = "typing";
      await conversation.sleep(1000);

      if (ctx.has("message:text")) {
        await ctx.reply(`Hello, ${ctx.message.text}!`);
      } else {
        await ctx.reply("Please send me your name");
      }
    }
  }, "greeting"),
);

bot.command("start", (ctx) =>
  ctx.conversation.enter("greeting", {
    overwrite: true,
  }));
bot.use((ctx) => ctx.reply("What a nice update."));

bot.start({
  onStart: (botInfo) => {
    console.log(`@${botInfo.username} is listening...`);
    console.log(`Open: https://t.me/${botInfo.username}?start=1`);
  },
});
