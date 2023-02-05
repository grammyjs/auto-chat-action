import type { Action, Method } from "./types.ts";
import { InputFile } from "./deps.ts";

const actionByMethod = new Map([
  ["sendPhoto", "upload_photo"],
  ["sendAudio", "upload_document"],
  ["sendDocument", "upload_document"],
  ["sendVideo", "upload_video"],
  ["sendAnimation", "upload_video"],
  ["sendVoice", "upload_voice"],
  ["sendVideoNote", "upload_video_note"],
  ["sendSticker", "choose_sticker"],
]);

export function getChatAction(method: Method): Action {
  return actionByMethod.get(method) as Action;
}

export function isChatActionRequired(method: string): method is Method {
  return actionByMethod.has(method);
}

export function isContentUpload(payload: Record<string, unknown>) {
  if (
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

export function isThumbnailUpload(payload: Record<string, unknown>) {
  if (!("thumb" in payload)) {
    return false;
  }

  if (payload.thumb instanceof InputFile) {
    return true;
  }

  return false;
}

export function isFileUpload(payload: Record<string, unknown>) {
  return isContentUpload(payload) || isThumbnailUpload(payload);
}
