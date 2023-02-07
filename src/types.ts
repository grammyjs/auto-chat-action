import { Api } from "./deps.ts";

export type ChatId = number | string;

export type Action = Parameters<Api["sendChatAction"]>[1];

export type Signal = Parameters<Api["sendChatAction"]>[3];
