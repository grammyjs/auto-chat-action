# Auto Chat Action plugin for grammY

This plugin provides a middleware to automatically send an appropriate
[chat action](https://core.telegram.org/bots/api#sendchataction).\
For example sends the "sending video" chat action when `sendVideo` is called.

## Installation

### Node

```sh
npm i @grammyjs/auto-chat-action
```

### Deno

```ts
import { autoChatAction } from "https://deno.land/x/grammy_auto_chat_action/mod.ts";
```

### Install plugin

```ts
import {
  autoChatAction,
  AutoChatActionFlavor,
} from "@grammyjs/auto-chat-action";

// Extend the context
const bot = new Bot<Context & AutoChatActionFlavor>("");

// Install the plugin
bot.use(autoChatAction());
```

## Usage

```ts
import { Bot, Context } from "grammy";
import {
  autoChatAction,
  AutoChatActionFlavor,
} from "@grammyjs/auto-chat-action";

type MyContext = Context & AutoChatActionFlavor;

// Create a bot.
const bot = new Bot<MyContext>("token");

// Install the plugin
bot.use(autoChatAction());

bot.command("start", async (ctx) => {
  // Send the media and sending the "sending photo" chat action
  // will start automatically until the media is uploaded
  await ctx.replyWithPhoto(
    new InputFile("/tmp/picture.jpg"),
  );
});

bot.start();
```

### Automatic Sending

Automatic sending of a chat action starts under the following conditions:

<!-- deno-fmt-ignore -->
1. Request payload contains a chat ID.
2. Request method from the list:
   - sendPhoto
   - sendAudio
   - sendDocument
   - sendVideo
   - sendAnimation
   - sendVoice
   - sendVideoNote
   - sendSticker
   - sendMediaGroup
3. Request payload contains [InputFile](https://grammy.dev/guide/files.html#uploading-your-own-files)

Sending of a chat action stops under one of the following conditions:

1. Update processing is complete.
2. Request which requires the chat action is complete.
3. `sendChatAction` request caused an error.

### Manual Sending

```ts
bot.command("start", async (ctx) => {
  // Set the action to be sent until the update is processed
  ctx.chatAction = "typing";

  // To stop sending, simply set the chat action to null
  ctx.chatAction = null;

  // You can change the chat action during update processing
  ctx.chatAction = "choose_sticker";
});
```

Sending other requests that require sending a chat action will interrupt the
sending of the current chat action.

```ts
ctx.chatAction = "typing";

await ctx.reply("Hi!");

// Sends "upload_photo" while file is uploading
await ctx.replyWithPhoto(
  new InputFile("/tmp/kitten.png"),
);

// Now there is no sending chat action
// ctx.chatAction is null
```
