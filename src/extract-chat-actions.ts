import type { Action } from "./types.ts";
import { InputFile, RawApi } from "./deps.ts";

type ApiMethods = keyof RawApi;

type Extractor<M extends ApiMethods> = (
  payload: Parameters<RawApi[M]>[0],
) => Action[];

type Extractors<
  M extends ApiMethods,
> = {
  [P in M]: Extractor<P>;
};

const extractors: Extractors<
  | "sendPhoto"
  | "sendAudio"
  | "sendDocument"
  | "sendVideo"
  | "sendAnimation"
  | "sendVoice"
  | "sendVideoNote"
  | "sendSticker"
  | "sendMediaGroup"
> = {
  sendPhoto(payload) {
    return (
        payload.photo instanceof InputFile
      )
      ? ["upload_photo"]
      : [];
  },

  sendAudio(payload) {
    return (
        payload.audio instanceof InputFile ||
        payload.thumbnail instanceof InputFile
      )
      ? ["upload_document"]
      : [];
  },

  sendDocument(payload) {
    return (
        payload.document instanceof InputFile ||
        payload.thumbnail instanceof InputFile
      )
      ? ["upload_document"]
      : [];
  },

  sendVideo(payload) {
    return (
        payload.video instanceof InputFile ||
        payload.thumbnail instanceof InputFile
      )
      ? ["upload_video"]
      : [];
  },

  sendAnimation(payload) {
    return (
        payload.animation instanceof InputFile ||
        payload.thumbnail instanceof InputFile
      )
      ? ["upload_video"]
      : [];
  },

  sendVoice(payload) {
    return (
        payload.voice instanceof InputFile
      )
      ? ["upload_voice"]
      : [];
  },

  sendVideoNote(payload) {
    return (
        payload.video_note instanceof InputFile ||
        payload.thumbnail instanceof InputFile
      )
      ? ["upload_video_note"]
      : [];
  },

  sendSticker(payload) {
    return (
        payload.sticker instanceof InputFile
      )
      ? ["choose_sticker"]
      : [];
  },

  sendMediaGroup(payload) {
    return payload.media.map((media) => {
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
    }).filter((item) => item) as Action[];
  },
};

export function getChatActionsForRequest(
  method: ApiMethods,
  payload: Record<string, unknown>,
): [boolean, Action[]] {
  if (!(method in extractors)) {
    return [false, []];
  }

  // @ts-expect-error existence of method has been checked
  const chatActions = extractors[method](payload);

  return [chatActions.length > 0, chatActions];
}
