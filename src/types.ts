export type Method =
  | "sendMessage"
  | "sendPhoto"
  | "sendVideo"
  | "sendVoice"
  | "sendDocument"
  | "sendSticker"
  | "sendLocation"
  | "sendVideoNote";

export type Action =
  | "typing"
  | "upload_photo"
  | "upload_video"
  | "upload_voice"
  | "upload_document"
  | "choose_sticker"
  | "find_location"
  | "upload_video_note";
