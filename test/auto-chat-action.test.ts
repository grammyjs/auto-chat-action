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
import { FakeTime } from "https://deno.land/std@0.176.0/testing/time.ts";
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
  });

  //#region repeat chat action

  it("should repeat chat action if request takes longer than 5 seconds", async () => {
    const time = new FakeTime();
    const photo = new InputFile("");

    try {
      bot.api.config.use((prev, method, payload, signal) => {
        if (method === "sendPhoto") {
          time.tick(5100);
        }

        return prev(method, payload, signal);
      });
      bot.api.config.use(autoChatAction());
      bot.use((ctx) => ctx.api.sendPhoto(chat_id, photo, {}, signal));

      await bot.handleUpdate({
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
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 2, 1, [
        "sendPhoto",
        {
          photo,
          chat_id,
        },
        signal,
      ]);
      assertSpyCalls(api, 3);
    } finally {
      time.restore();
    }
  });

  //#endregion

  //#region sendPhoto

  it("should send chat action if photo is uploaded", async () => {
    const photo = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendPhoto(chat_id, photo, {}, signal));

    await bot.handleUpdate({
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

  it("should not send chat action if photo is not uploaded", async () => {
    const photo = "file_id";

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendPhoto(chat_id, photo, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if audio is uploaded", async () => {
    const audio = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendAudio(chat_id, audio, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if audio thumb is uploaded", async () => {
    const audio = "file_id";
    const thumb = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) =>
      ctx.api.sendAudio(chat_id, audio, {
        thumb,
      }, signal)
    );

    await bot.handleUpdate({
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

  it("should not send chat action if audio is not uploaded", async () => {
    const audio = "file_id";

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendAudio(chat_id, audio, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if document is uploaded", async () => {
    const document = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendDocument(chat_id, document, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if document thumb is uploaded", async () => {
    const document = "file_id";
    const thumb = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) =>
      ctx.api.sendDocument(chat_id, document, {
        thumb,
      }, signal)
    );

    await bot.handleUpdate({
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

  it("should not send chat action if document is not uploaded", async () => {
    const document = "file_id";

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendDocument(chat_id, document, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if video is uploaded", async () => {
    const video = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendVideo(chat_id, video, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if video thumb is uploaded", async () => {
    const video = "file_id";
    const thumb = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) =>
      ctx.api.sendVideo(chat_id, video, {
        thumb,
      }, signal)
    );

    await bot.handleUpdate({
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

  it("should not send chat action if video is not uploaded", async () => {
    const video = "file_id";

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendVideo(chat_id, video, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if animation is uploaded", async () => {
    const animation = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendAnimation(chat_id, animation, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if animation thumb is uploaded", async () => {
    const animation = "file_id";
    const thumb = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) =>
      ctx.api.sendAnimation(chat_id, animation, {
        thumb,
      }, signal)
    );

    await bot.handleUpdate({
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

  it("should not send chat action if animation is not uploaded", async () => {
    const animation = "file_id";

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendAnimation(chat_id, animation, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if voice is uploaded", async () => {
    const voice = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendVoice(chat_id, voice, {}, signal));

    await bot.handleUpdate({
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

  it("should not send chat action if voice is not uploaded", async () => {
    const voice = "file_id";

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendVoice(chat_id, voice, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if video note is uploaded", async () => {
    const video_note = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendVideoNote(chat_id, video_note, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if video note thumb is uploaded", async () => {
    const video_note = "file_id";
    const thumb = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) =>
      ctx.api.sendVideoNote(chat_id, video_note, {
        thumb,
      }, signal)
    );

    await bot.handleUpdate({
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

  it("should not send chat action if video note is not uploaded", async () => {
    const video_note = "file_id";

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendVideoNote(chat_id, video_note, {}, signal));

    await bot.handleUpdate({
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

  it("should send chat action if sticker is uploaded", async () => {
    const sticker = new InputFile("");

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendSticker(chat_id, sticker, {}, signal));

    await bot.handleUpdate({
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

  it("should not send chat action if sticker is not uploaded", async () => {
    const sticker = "file_id";

    bot.api.config.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendSticker(chat_id, sticker, {}, signal));

    await bot.handleUpdate({
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

  it("should fill message_thread_id if it is present in payload", async () => {
    const photo = new InputFile("");
    const message_thread_id = 1337;

    bot.api.config.use(autoChatAction());
    bot.use((ctx) =>
      ctx.api.sendPhoto(chat_id, photo, {
        message_thread_id,
      }, signal)
    );

    await bot.handleUpdate({
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

  //#region media group

  it("should send chat action for each media in group", async () => {
    const time = new FakeTime();
    const media = new InputFile("");

    try {
      bot.api.config.use((prev, method, payload, signal) => {
        if (method === "sendMediaGroup") {
          time.tick(21000);
        }

        return prev(method, payload, signal);
      });
      bot.api.config.use(autoChatAction());
      bot.use((ctx) =>
        ctx.api.sendMediaGroup(
          chat_id,
          [
            {
              type: "audio",
              media: media,
            },
            {
              type: "video",
              media: media,
            },
            {
              type: "document",
              media: media,
            },
            {
              type: "photo",
              media: media,
            },
          ],
          {},
          signal,
        )
      );

      await bot.handleUpdate({
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
        "sendChatAction",
        {
          action: "upload_video",
          chat_id,
        },
        signal,
      ]);

      assertSpyCallArgs(api, 2, 1, [
        "sendChatAction",
        {
          action: "upload_document",
          chat_id,
        },
        signal,
      ]);

      assertSpyCallArgs(api, 3, 1, [
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id,
        },
        signal,
      ]);

      // repeat chat actions
      assertSpyCallArgs(api, 4, 1, [
        "sendChatAction",
        {
          action: "upload_document",
          chat_id,
        },
        signal,
      ]);

      assertSpyCallArgs(api, 5, 1, [
        "sendMediaGroup",
        {
          media: [
            {
              type: "audio",
              media: media,
            },
            {
              type: "video",
              media: media,
            },
            {
              type: "document",
              media: media,
            },
            {
              type: "photo",
              media: media,
            },
          ],
          chat_id,
        },
        signal,
      ]);

      assertSpyCalls(api, 6);
    } finally {
      time.restore();
    }
  });

  //#endregion
});
