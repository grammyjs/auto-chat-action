import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.176.0/testing/bdd.ts";
import {
  assertSpyCallArgs,
  assertSpyCalls,
  Spy,
  spy,
} from "https://deno.land/std@0.176.0/testing/mock.ts";
import { Bot, InputFile } from "https://lib.deno.dev/x/grammy@1.x/mod.ts";
import { autoChatAction } from "../src/mod.ts";

const botInfo = {
  id: 1,
  first_name: "Dummy",
  is_bot: true as const,
  username: "dummy",
  can_join_groups: true as const,
  can_read_all_group_messages: true as const,
  supports_inline_queries: true as const,
};

const chat_id = 1;

describe("autoChatAction transformer", () => {
  let signal: AbortSignal;
  let bot: Bot;
  let api: Spy;

  beforeEach(() => {
    const controller = new AbortController();
    signal = controller.signal;

    bot = new Bot("dummy", { botInfo });
    api = spy((
      _prev,
      _method: string,
      _payload: Record<string, unknown>,
    ) => Promise.resolve({ ok: true as const, result: true }));

    bot.api.config.use(api);
    bot.api.config.use(autoChatAction());
  });

  //#region sendPhoto

  it("should send chat action if photo is uploaded", () => {
    const photo = new InputFile("");

    bot.use((ctx) => ctx.api.sendPhoto(chat_id, photo, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_photo",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendPhoto",
      {
        photo,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should not send chat action if photo is not uploaded", () => {
    const photo = "file_id";

    bot.use((ctx) => ctx.api.sendPhoto(chat_id, photo, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendPhoto",
      {
        photo,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 1);
  });

  //#endregion

  //#region sendAudio

  it("should send chat action if audio is uploaded", () => {
    const audio = new InputFile("");

    bot.use((ctx) => ctx.api.sendAudio(chat_id, audio, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_document",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendAudio",
      {
        audio,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should send chat action if audio thumb is uploaded", () => {
    const audio = "file_id";
    const thumb = new InputFile("");

    bot.use((ctx) =>
      ctx.api.sendAudio(chat_id, audio, {
        thumb,
      }, signal)
    );

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_document",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendAudio",
      {
        audio,
        thumb,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should not send chat action if audio is not uploaded", () => {
    const audio = "file_id";

    bot.use((ctx) => ctx.api.sendAudio(chat_id, audio, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendAudio",
      {
        audio,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 1);
  });

  //#endregion

  //#region sendDocument

  it("should send chat action if document is uploaded", () => {
    const document = new InputFile("");

    bot.use((ctx) => ctx.api.sendDocument(chat_id, document, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_document",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendDocument",
      {
        document,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should send chat action if document thumb is uploaded", () => {
    const document = "file_id";
    const thumb = new InputFile("");

    bot.use((ctx) =>
      ctx.api.sendDocument(chat_id, document, {
        thumb,
      }, signal)
    );

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_document",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendDocument",
      {
        document,
        thumb,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should not send chat action if document is not uploaded", () => {
    const document = "file_id";

    bot.use((ctx) => ctx.api.sendDocument(chat_id, document, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendDocument",
      {
        document,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 1);
  });

  //#endregion

  //#region sendVideo

  it("should send chat action if video is uploaded", () => {
    const video = new InputFile("");

    bot.use((ctx) => ctx.api.sendVideo(chat_id, video, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_video",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendVideo",
      {
        video,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should send chat action if video thumb is uploaded", () => {
    const video = "file_id";
    const thumb = new InputFile("");

    bot.use((ctx) =>
      ctx.api.sendVideo(chat_id, video, {
        thumb,
      }, signal)
    );

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_video",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendVideo",
      {
        video,
        thumb,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should not send chat action if video is not uploaded", () => {
    const video = "file_id";

    bot.use((ctx) => ctx.api.sendVideo(chat_id, video, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendVideo",
      {
        video,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 1);
  });

  //#endregion

  //#region sendAnimation

  it("should send chat action if animation is uploaded", () => {
    const animation = new InputFile("");

    bot.use((ctx) => ctx.api.sendAnimation(chat_id, animation, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_video",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendAnimation",
      {
        animation,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should send chat action if animation thumb is uploaded", () => {
    const animation = "file_id";
    const thumb = new InputFile("");

    bot.use((ctx) =>
      ctx.api.sendAnimation(chat_id, animation, {
        thumb,
      }, signal)
    );

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_video",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendAnimation",
      {
        animation,
        thumb,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should not send chat action if animation is not uploaded", () => {
    const animation = "file_id";

    bot.use((ctx) => ctx.api.sendAnimation(chat_id, animation, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendAnimation",
      {
        animation,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 1);
  });

  //#endregion

  //#region sendVoice

  it("should send chat action if voice is uploaded", () => {
    const voice = new InputFile("");

    bot.use((ctx) => ctx.api.sendVoice(chat_id, voice, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_voice",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendVoice",
      {
        voice,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should not send chat action if voice is not uploaded", () => {
    const voice = "file_id";

    bot.use((ctx) => ctx.api.sendVoice(chat_id, voice, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendVoice",
      {
        voice,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 1);
  });

  //#endregion

  //#region sendVideoNote

  it("should send chat action if video note is uploaded", () => {
    const video_note = new InputFile("");

    bot.use((ctx) => ctx.api.sendVideoNote(chat_id, video_note, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_video_note",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendVideoNote",
      {
        video_note,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should send chat action if video note thumb is uploaded", () => {
    const video_note = "file_id";
    const thumb = new InputFile("");

    bot.use((ctx) =>
      ctx.api.sendVideoNote(chat_id, video_note, {
        thumb,
      }, signal)
    );

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_video_note",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendVideoNote",
      {
        video_note,
        thumb,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should not send chat action if video note is not uploaded", () => {
    const video_note = "file_id";

    bot.use((ctx) => ctx.api.sendVideoNote(chat_id, video_note, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendVideoNote",
      {
        video_note,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 1);
  });

  //#endregion

  //#region sendSticker

  it("should send chat action if sticker is uploaded", () => {
    const sticker = new InputFile("");

    bot.use((ctx) => ctx.api.sendSticker(chat_id, sticker, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "choose_sticker",
        chat_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendSticker",
      {
        sticker,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  it("should not send chat action if sticker is not uploaded", () => {
    const sticker = "file_id";

    bot.use((ctx) => ctx.api.sendSticker(chat_id, sticker, {}, signal));

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendSticker",
      {
        sticker,
        chat_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 1);
  });

  //#endregion

  //#region message thread

  it("should fill message_thread_id if it is present in payload", () => {
    const photo = new InputFile("");
    const message_thread_id = 1337;

    bot.use((ctx) =>
      ctx.api.sendPhoto(chat_id, photo, {
        message_thread_id,
      }, signal)
    );

    bot.handleUpdate({
      update_id: 0,
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "upload_photo",
        chat_id,
        message_thread_id,
      },
      signal,
    ]);
    assertSpyCallArgs(api, 1, 1, [
      "sendPhoto",
      {
        photo,
        chat_id,
        message_thread_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 2);
  });

  //#endregion
});
