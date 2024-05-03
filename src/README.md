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
const bot = new Bot<MyContext>("");

// Install the plugin
bot.use(autoChatAction());

bot.command("start", (ctx) => {
  // Starts sending "typing" chat action in a loop
  ctx.chatAction = "typing";

  // Some long-running operations...

  return ctx.reply("42!");
});

bot.command("photo", (ctx) => {
  // Sending the "upload_photo" chat action until the media is uploaded
  return ctx.replyWithPhoto(
    new InputFile("/tmp/picture.jpg"),
  );
});

bot.start();
```

Check out [examples](../examples/).

### Automatic Action Sending

Automatic sending of a chat action starts under the following conditions:

<!-- deno-fmt-ignore -->
1. Request method from the list:
   - sendPhoto
   - sendAudio
   - sendDocument
   - sendVideo
   - sendAnimation
   - sendVoice
   - sendVideoNote
   - sendSticker
   - sendMediaGroup
2. Request payload contains [InputFile](https://grammy.dev/guide/files.html#uploading-your-own-files)
3. Request payload contains a chat ID.

Sending of a chat action stops under one of the following conditions:

1. Update processing has been completed.
2. Request which requires the chat action has been completed.
3. An error occurs during
   [sendChatAction](https://core.telegram.org/bots/api#sendchataction) request.

This also applies to manually set chat actions. Please note that "stops" only
refers to stopping sending new requests to set the chat action. The chat action
may still be displayed for some time (until a timeout occurs or a new message is
received, depending on the client).

### Manual Action Sending

#### Sending Chat Action with Context

The plugin adds `chatAction` property to the context that allows you to set chat
actions for the current update.

```ts
// Set the action to be sent until the update is processed
ctx.chatAction = "typing";

// To stop sending the chat action, simply set it to null
ctx.chatAction = null;

// You can change the chat action during update processing
ctx.chatAction = "choose_sticker";
```

When you send requests that also require sending a chat action, it interrupts
the current chat action.

```ts
// Set the chat action to "typing"
ctx.chatAction = "typing";

// Send a message
await ctx.reply("Hi!");

// Send a photo (the "upload_photo" action is sent while the file is uploading)
await ctx.replyWithPhoto(
  new InputFile("/tmp/kitten.png"),
);

// There is no ongoing chat action now
// ctx.chatAction is null
```

#### Sending Chat Action with Middleware

The plugin also provides the ability to set chat actions using middleware.

```ts
import { chatAction } from "@grammyjs/auto-chat-action";

bot.command("start", chatAction("typing"), (ctx) => {
  // Some long-running operations...

  return ctx.reply("42!");
});
```

#### Using with [Conversations](https://grammy.dev/plugins/conversations)

To use the plugin with conversations, you need to pass `bot.api` explicitly.

```ts
// Pass the API instance to the plugin
bot.use(autoChatAction(bot.api));
```
