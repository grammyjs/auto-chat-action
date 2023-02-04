# Auto Chat Action plugin for grammY

This plugin provides a transformer to automatically send an appropriate
[chat action](https://core.telegram.org/bots/api#sendchataction).

## Installation

### Node

```sh
npm i grammy-auto-chat-action
```

### Deno

```ts
import { autoChatAction } from "https://deno.land/x/grammy_auto_chat_action/mod.ts";
```

## Usage

```ts
import { autoChatAction } from "grammy-auto-chat-action";

// Install the plugin
bot.api.config.use(autoChatAction());
```
