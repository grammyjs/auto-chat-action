import type { Action } from "./types.ts";
import { Api, InputFile } from "./deps.ts";
import {
  InputMediaAudio,
  InputMediaDocument,
  InputMediaPhoto,
  InputMediaVideo,
} from "./deps.ts";

const methods = new Set([
  "sendPhoto",
  "sendAudio",
  "sendDocument",
  "sendVideo",
  "sendAnimation",
  "sendVoice",
  "sendVideoNote",
  "sendSticker",
  "sendMediaGroup",
]);

function hasMediaUpload(payload: Record<string, unknown>) {
  if (
    "media" in payload ||
    "photo" in payload ||
    "audio" in payload ||
    "document" in payload ||
    "video" in payload ||
    "animation" in payload ||
    "voice" in payload ||
    "video_note" in payload ||
    "sticker" in payload
  ) {
    return (
      payload.media ??
        payload.photo ??
        payload.audio ??
        payload.document ??
        payload.video ??
        payload.animation ??
        payload.voice ??
        payload.video_note ??
        payload.sticker
    ) instanceof InputFile;
  }

  return false;
}

function hasMediaThumbnailUpload(payload: Record<string, unknown>) {
  if (!("thumb" in payload)) {
    return false;
  }

  if (payload.thumb instanceof InputFile) {
    return true;
  }

  return false;
}

function hasUploads(payload: Record<string, unknown>) {
  return hasMediaUpload(payload) || hasMediaThumbnailUpload(payload);
}

function getChatActionsFromSingleMediaPayload(
  payload: Record<string, unknown>,
): Action[] {
  let chatAction: Action | undefined;

  if ("photo" in payload && hasUploads(payload)) {
    chatAction = "upload_photo";
  }

  if ("audio" in payload && hasUploads(payload)) {
    chatAction = "upload_document";
  }

  if ("document" in payload && hasUploads(payload)) {
    chatAction = "upload_document";
  }

  if ("video" in payload && hasUploads(payload)) {
    chatAction = "upload_video";
  }

  if ("animation" in payload && hasUploads(payload)) {
    chatAction = "upload_video";
  }

  if ("voice" in payload && hasUploads(payload)) {
    chatAction = "upload_voice";
  }

  if ("video_note" in payload && hasUploads(payload)) {
    chatAction = "upload_video_note";
  }

  if ("sticker" in payload && hasUploads(payload)) {
    chatAction = "choose_sticker";
  }

  if (typeof chatAction === "undefined") {
    return [];
  }

  return [chatAction];
}

function getChatActionsFromMediaGroupPayload(
  payload: Record<string, unknown>,
): Action[] {
  let chatActions: Action[] = [];

  if ("media" in payload && Array.isArray(payload.media)) {
    chatActions = payload.media.map((
      media:
        | InputMediaAudio
        | InputMediaDocument
        | InputMediaPhoto
        | InputMediaVideo,
    ) => {
      if ("type" in media && hasUploads(media)) {
        if (media.type === "audio") {
          return "upload_document";
        }

        if (media.type === "document") {
          return "upload_document";
        }

        if (media.type === "photo") {
          return "upload_photo";
        }

        if (media.type === "video") {
          return "upload_video";
        }
      }
    }).filter((item) => item) as Action[];
  }

  return chatActions;
}

export function getChatActionsForRequest(
  method: keyof Api,
  payload: Record<string, unknown>,
): [boolean, Action[]] {
  if (!methods.has(method)) {
    return [false, []];
  }

  const chatActions = method === "sendMediaGroup"
    ? getChatActionsFromMediaGroupPayload(payload)
    : getChatActionsFromSingleMediaPayload(payload);

  return [chatActions.length > 0, chatActions];
}
