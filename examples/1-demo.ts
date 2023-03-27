import { Bot, Context } from "https://lib.deno.dev/x/grammy@1.x/mod.ts";
import {
  ConversationFlavor,
} from "https://lib.deno.dev/x/grammy_conversations@1.x/mod.ts";
import { autoChatAction, AutoChatActionFlavor } from "../src/mod.ts";

type MyContext = Context & AutoChatActionFlavor & ConversationFlavor;

// Create a bot
const bot = new Bot<MyContext>(Deno.env.get("BOT_TOKEN") as string);

const sleep = (milliseconds: number) =>
  new Promise((r) => setTimeout(r, milliseconds));

// Install the plugin
bot.use(autoChatAction());

bot.command("start", (ctx) => ctx.reply("Hi, send me a text"));
bot.on(":text", async (ctx) => {
  ctx.chatAction = "upload_photo";
  await sleep(1500);
  ctx.chatAction = "upload_video";
  await sleep(1500);
  ctx.chatAction = "choose_sticker";
  await sleep(1500);
  ctx.chatAction = "typing";
  await sleep(1500);

  await ctx.reply(ctx.msg.text);
});
bot.use((ctx) => ctx.reply("What a nice update."));

bot.start({
  onStart: (botInfo) => {
    console.log(`@${botInfo.username} is listening...`);
    console.log(`Open: https://t.me/${botInfo.username}?start=1`);
  },
});
