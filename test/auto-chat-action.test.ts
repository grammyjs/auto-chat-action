import { assertEquals } from "https://deno.land/std@0.176.0/testing/asserts.ts";
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
import { Bot } from "https://lib.deno.dev/x/grammy@1.x/mod.ts";
import { InputFile } from "../src/deps.ts";
import { autoChatAction } from "../src/mod.ts";
import {
  AutoChatActionContext,
  createBot,
  createMessage,
  createMessageInThread,
} from "./utils.ts";

const actionSendingInterval = 5_000;
const chat_id = 1;

describe("autoChatAction plugin", () => {
  it("should allow for install more than once", async () => {
    const bot = createBot();

    bot.use(autoChatAction());
    bot.use(autoChatAction());

    await bot.handleUpdate({
      update_id: 0,
    });
  });

  it("should skip updates without chat ID", async () => {
    const bot = createBot();
    const api: Spy = spy((
      _prev,
      _method: string,
      _payload: Record<string, unknown>,
    ) => Promise.resolve({ ok: true as const, result: true }));

    bot.api.config.use(api);
    bot.use(autoChatAction());
    bot.use((ctx) => {
      ctx.chatAction = "typing";
      return ctx.api.answerInlineQuery("", []);
    });

    await bot.handleUpdate({
      update_id: 0,
    });
  });
});

describe("autoChatAction transformer", () => {
  let signal: AbortSignal;
  let bot: Bot<AutoChatActionContext>;
  let api: Spy;

  beforeEach(() => {
    const controller = new AbortController();
    signal = controller.signal;

    bot = createBot();
    api = spy((
      _prev,
      _method: string,
      _payload: Record<string, unknown>,
    ) => Promise.resolve({ ok: true as const, result: true }));

    bot.api.config.use(api);
  });

  //#region sending

  it("should stop sending chat action if sendChatAction returns error", async () => {
    const time = new FakeTime();
    const photo = new InputFile("");

    try {
      bot.api.config.use((prev, method, payload, signal) => {
        if (method === "sendChatAction") {
          throw new Error();
        }

        return prev(method, payload, signal);
      });
      bot.use(autoChatAction());
      bot.use((ctx) => ctx.api.sendPhoto(chat_id, photo, {}, signal));

      await bot.handleUpdate({
        update_id: 0,
        message: createMessage({ chat_id }),
      });
      await time.tickAsync(actionSendingInterval * 2);

      assertSpyCallArgs(api, 0, 1, [
        "sendPhoto",
        {
          photo,
          chat_id,
        },
        signal,
      ]);
      assertSpyCalls(api, 1);
    } finally {
      time.restore();
    }
  });

  it("should repeat chat action until request is complete", async () => {
    const time = new FakeTime();
    const photo = new InputFile("");

    try {
      bot.api.config.use(async (prev, method, payload, signal) => {
        if (method === "sendPhoto") {
          await time.tickAsync(actionSendingInterval * 2);
        }

        return prev(method, payload, signal);
      });
      bot.use(autoChatAction());
      bot.use((ctx) => ctx.api.sendPhoto(chat_id, photo, {}, signal));

      await bot.handleUpdate({
        update_id: 0,
        message: createMessage({ chat_id }),
      });
      await time.tickAsync(actionSendingInterval * 2);

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
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 3, 1, [
        "sendPhoto",
        {
          photo,
          chat_id,
        },
        signal,
      ]);
      assertSpyCalls(api, 4);
    } finally {
      time.restore();
    }
  });

  it("should stop sending chat action when request is complete", async () => {
    const time = new FakeTime();
    const photo = new InputFile("");

    try {
      bot.use(autoChatAction());
      bot.use(async (ctx) => {
        await ctx.api.sendPhoto(chat_id, photo, {}, signal);
        await time.tickAsync(actionSendingInterval * 2);
      });

      await bot.handleUpdate({
        update_id: 0,
        message: createMessage({ chat_id }),
      });
      await time.tickAsync(actionSendingInterval * 2);

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
    } finally {
      time.restore();
    }
  });

  it("should send chat actions to different chats independent", async () => {
    const time = new FakeTime();
    const photo = new InputFile("");
    const another_chat_id = chat_id + 1;

    try {
      bot.api.config.use(async (prev, method, payload, signal) => {
        if (
          method === "sendPhoto" &&
          "chat_id" in payload &&
          payload.chat_id === another_chat_id
        ) {
          await time.tickAsync(actionSendingInterval * 3);
        }

        return prev(method, payload, signal);
      });
      bot.use(autoChatAction());
      bot.use((ctx) =>
        Promise.all([
          ctx.api.sendPhoto(chat_id, photo, {}, signal),
          ctx.api.sendPhoto(another_chat_id, photo, {}, signal),
        ])
      );

      await bot.handleUpdate({
        update_id: 0,
        message: createMessage({ chat_id }),
      });
      await time.tickAsync(actionSendingInterval * 2);

      // first photo
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

      // second photo
      assertSpyCallArgs(api, 2, 1, [
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id: another_chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 3, 1, [
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id: another_chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 4, 1, [
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id: another_chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 5, 1, [
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id: another_chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 6, 1, [
        "sendPhoto",
        {
          photo,
          chat_id: another_chat_id,
        },
        signal,
      ]);

      assertSpyCalls(api, 7);
    } finally {
      time.restore();
    }
  });

  //#endregion

  //#region sendPhoto

  it("should send chat action if sendPhoto contains files to upload", async () => {
    const photo = new InputFile("");

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendPhoto(chat_id, photo, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should not send chat action if sendPhoto does not contain files to upload", async () => {
    const photo = "file_id";

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendPhoto(chat_id, photo, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should send chat action if sendAudio contains files to upload", async () => {
    const audioFile = new InputFile("");
    const audioFileId = "";
    const thumb = new InputFile("");

    bot.use(autoChatAction());
    bot.use((ctx) =>
      Promise.all([
        ctx.api.sendAudio(chat_id, audioFile, {}, signal),
        ctx.api.sendAudio(chat_id, audioFileId, { thumb }, signal),
      ])
    );

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
    });

    // audio
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
        audio: audioFile,
        chat_id,
      },
      signal,
    ]);

    // thumb
    assertSpyCallArgs(api, 2, 1, [
      "sendChatAction",
      {
        action: "upload_document",
        chat_id,
      },
      signal,
    ]);

    assertSpyCallArgs(api, 3, 1, [
      "sendAudio",
      {
        audio: audioFileId,
        thumb,
        chat_id,
      },
      signal,
    ]);

    assertSpyCalls(api, 4);
  });

  it("should not send chat action if sendAudio does not contain files to upload", async () => {
    const audio = "file_id";

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendAudio(chat_id, audio, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should send chat action if sendDocument contains files to upload", async () => {
    const documentFile = new InputFile("");
    const documentFileId = "";
    const thumb = new InputFile("");

    bot.use(autoChatAction());
    bot.use((ctx) =>
      Promise.all([
        ctx.api.sendDocument(chat_id, documentFile, {}, signal),
        ctx.api.sendDocument(chat_id, documentFileId, { thumb }, signal),
      ])
    );

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
    });

    // document
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
        document: documentFile,
        chat_id,
      },
      signal,
    ]);

    // thumb
    assertSpyCallArgs(api, 2, 1, [
      "sendChatAction",
      {
        action: "upload_document",
        chat_id,
      },
      signal,
    ]);

    assertSpyCallArgs(api, 3, 1, [
      "sendDocument",
      {
        document: documentFileId,
        thumb,
        chat_id,
      },
      signal,
    ]);

    assertSpyCalls(api, 4);
  });

  it("should not send chat action if sendDocument does not contain files to upload", async () => {
    const document = "file_id";

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendDocument(chat_id, document, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should send chat action if sendVideo contains files to upload", async () => {
    const videoFile = new InputFile("");
    const videoFileId = "";
    const thumb = new InputFile("");

    bot.use(autoChatAction());
    bot.use((ctx) =>
      Promise.all([
        ctx.api.sendVideo(chat_id, videoFile, {}, signal),
        ctx.api.sendVideo(chat_id, videoFileId, { thumb }, signal),
      ])
    );

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
    });

    // video
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
        video: videoFile,
        chat_id,
      },
      signal,
    ]);

    // thumb
    assertSpyCallArgs(api, 2, 1, [
      "sendChatAction",
      {
        action: "upload_video",
        chat_id,
      },
      signal,
    ]);

    assertSpyCallArgs(api, 3, 1, [
      "sendVideo",
      {
        video: videoFileId,
        thumb,
        chat_id,
      },
      signal,
    ]);

    assertSpyCalls(api, 4);
  });

  it("should not send chat action if sendVideo does not contain files to upload", async () => {
    const video = "file_id";

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendVideo(chat_id, video, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should send chat action if sendAnimation contains files to upload", async () => {
    const animationFile = new InputFile("");
    const animationFileId = "";
    const thumb = new InputFile("");

    bot.use(autoChatAction());
    bot.use((ctx) =>
      Promise.all([
        ctx.api.sendAnimation(chat_id, animationFile, {}, signal),
        ctx.api.sendAnimation(chat_id, animationFileId, { thumb }, signal),
      ])
    );

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
    });

    // animation
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
        animation: animationFile,
        chat_id,
      },
      signal,
    ]);

    // thumb
    assertSpyCallArgs(api, 2, 1, [
      "sendChatAction",
      {
        action: "upload_video",
        chat_id,
      },
      signal,
    ]);

    assertSpyCallArgs(api, 3, 1, [
      "sendAnimation",
      {
        animation: animationFileId,
        thumb,
        chat_id,
      },
      signal,
    ]);

    assertSpyCalls(api, 4);
  });

  it("should not send chat action if sendAnimation does not contain files to upload", async () => {
    const animation = "file_id";

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendAnimation(chat_id, animation, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should send chat action if sendVoice contains files to upload", async () => {
    const voice = new InputFile("");

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendVoice(chat_id, voice, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should not send chat action if sendVoice does not contain files to upload", async () => {
    const voice = "file_id";

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendVoice(chat_id, voice, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should send chat action if sendVideoNote contains files to upload", async () => {
    const videoNoteFile = new InputFile("");
    const videoNoteFileId = "";
    const thumb = new InputFile("");

    bot.use(autoChatAction());
    bot.use((ctx) =>
      Promise.all([
        ctx.api.sendVideoNote(chat_id, videoNoteFile, {}, signal),
        ctx.api.sendVideoNote(chat_id, videoNoteFileId, { thumb }, signal),
      ])
    );

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
    });

    // videoNote
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
        video_note: videoNoteFile,
        chat_id,
      },
      signal,
    ]);

    // thumb
    assertSpyCallArgs(api, 2, 1, [
      "sendChatAction",
      {
        action: "upload_video_note",
        chat_id,
      },
      signal,
    ]);

    assertSpyCallArgs(api, 3, 1, [
      "sendVideoNote",
      {
        video_note: videoNoteFileId,
        thumb,
        chat_id,
      },
      signal,
    ]);

    assertSpyCalls(api, 4);
  });

  it("should not send chat action if sendVideoNote does not contain files to upload", async () => {
    const video_note = "file_id";

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendVideoNote(chat_id, video_note, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should send chat action if sendSticker contains files to upload", async () => {
    const sticker = new InputFile("");

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendSticker(chat_id, sticker, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should not send chat action if sendSticker does not contain files to upload", async () => {
    const sticker = "file_id";

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.api.sendSticker(chat_id, sticker, {}, signal));

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  //#region message threads

  it("should fill message_thread_id if it is present in payload", async () => {
    const photo = new InputFile("");
    const message_thread_id = 1337;

    bot.use(autoChatAction());
    bot.use((ctx) =>
      ctx.api.sendPhoto(chat_id, photo, {
        message_thread_id,
      }, signal)
    );

    await bot.handleUpdate({
      update_id: 0,
      message: createMessage({ chat_id }),
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

  it("should send chat actions to different chat threads independent", async () => {
    const time = new FakeTime();
    const photo = new InputFile("");
    const message_thread_id = 1337;
    const another_thread_id = message_thread_id + 1;

    try {
      bot.api.config.use(async (prev, method, payload, signal) => {
        if (
          method === "sendPhoto" &&
          "message_thread_id" in payload &&
          payload.message_thread_id === another_thread_id
        ) {
          await time.tickAsync(actionSendingInterval * 3);
        }

        return prev(method, payload, signal);
      });
      bot.use(autoChatAction());
      bot.use((ctx) =>
        Promise.all([
          ctx.api.sendPhoto(chat_id, photo, {
            message_thread_id,
          }, signal),
          ctx.api.sendPhoto(chat_id, photo, {
            message_thread_id: another_thread_id,
          }, signal),
        ])
      );

      await bot.handleUpdate({
        update_id: 0,
        message: createMessageInThread({
          chat_id,
          message_thread_id,
        }),
      });
      await time.tickAsync(actionSendingInterval * 2);

      // first photo
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

      // second photo
      assertSpyCallArgs(api, 2, 1, [
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id,
          message_thread_id: another_thread_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 3, 1, [
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id,
          message_thread_id: another_thread_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 4, 1, [
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id,
          message_thread_id: another_thread_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 5, 1, [
        "sendChatAction",
        {
          action: "upload_photo",
          chat_id,
          message_thread_id: another_thread_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 6, 1, [
        "sendPhoto",
        {
          photo,
          chat_id,
          message_thread_id: another_thread_id,
        },
        signal,
      ]);

      assertSpyCalls(api, 7);
    } finally {
      time.restore();
    }
  });

  //#endregion

  //#region media group

  it("should send chat action for each media in group", async () => {
    const time = new FakeTime();
    const media = new InputFile("");

    try {
      bot.api.config.use(async (prev, method, payload, signal) => {
        if (method === "sendMediaGroup") {
          await time.tickAsync(actionSendingInterval * 4);
        }

        return prev(method, payload, signal);
      });
      bot.use(autoChatAction());
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
        message: createMessage({ chat_id }),
      });
      await time.tickAsync(actionSendingInterval * 2);

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

describe("autoChatAction middleware", () => {
  const signal = undefined;
  let bot: Bot<AutoChatActionContext>;
  let api: Spy;

  beforeEach(() => {
    bot = createBot();
    api = spy((
      _prev,
      _method: string,
      _payload: Record<string, unknown>,
    ) => Promise.resolve({ ok: true as const, result: true }));

    bot.api.config.use(api);
  });

  it("should repeat chat action until processing of update is complete", async () => {
    const time = new FakeTime();

    try {
      bot.use(autoChatAction());
      bot.use(async (ctx) => {
        ctx.chatAction = "typing";
        await time.tickAsync(actionSendingInterval * 2);
      });

      await bot.handleUpdate({
        update_id: 0,
        message: createMessage({ chat_id }),
      });
      await time.tickAsync(actionSendingInterval * 2);

      assertSpyCallArgs(api, 0, 1, [
        "sendChatAction",
        {
          action: "typing",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 1, 1, [
        "sendChatAction",
        {
          action: "typing",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 2, 1, [
        "sendChatAction",
        {
          action: "typing",
          chat_id,
        },
        signal,
      ]);
      assertSpyCalls(api, 3);
    } finally {
      time.restore();
    }
  });

  it("should repeat chat action until next network call happens", async () => {
    const time = new FakeTime();
    const photo = new InputFile("");

    try {
      bot.use(autoChatAction());
      bot.use(async (ctx) => {
        ctx.chatAction = "typing";
        await time.tickAsync(actionSendingInterval * 2);

        await ctx.api.sendPhoto(chat_id, photo, {}, signal);

        assertEquals(ctx.chatAction, null);
      });

      await bot.handleUpdate({
        update_id: 0,
        message: createMessage({ chat_id }),
      });
      await time.tickAsync(actionSendingInterval * 2);

      assertSpyCallArgs(api, 0, 1, [
        "sendChatAction",
        {
          action: "typing",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 1, 1, [
        "sendChatAction",
        {
          action: "typing",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 2, 1, [
        "sendChatAction",
        {
          action: "typing",
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
      assertSpyCallArgs(api, 4, 1, [
        "sendPhoto",
        {
          photo,
          chat_id,
        },
        signal,
      ]);
      assertSpyCalls(api, 5);
    } finally {
      time.restore();
    }
  });

  it("should stop sending chat action if processing of update is failed", async () => {
    const time = new FakeTime();

    try {
      bot.use(async (_, next) => {
        try {
          await next();
        } catch {
          // expected error
        }
      });
      bot.use(autoChatAction());
      bot.use((ctx, next) => {
        ctx.chatAction = "typing";
        return next();
      });
      bot.use(async (_) => {
        await time.tickAsync(actionSendingInterval * 2);
        throw new Error();
      });

      await bot.handleUpdate({
        update_id: 0,
        message: createMessage({ chat_id }),
      });

      await time.tickAsync(actionSendingInterval * 2);

      assertSpyCallArgs(api, 0, 1, [
        "sendChatAction",
        {
          action: "typing",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 1, 1, [
        "sendChatAction",
        {
          action: "typing",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 2, 1, [
        "sendChatAction",
        {
          action: "typing",
          chat_id,
        },
        signal,
      ]);
      assertSpyCalls(api, 3);
    } finally {
      time.restore();
    }
  });

  it("should react to changes in ctx.chatAction", async () => {
    const time = new FakeTime();

    try {
      bot.use(autoChatAction());
      bot.use(async (ctx) => {
        ctx.chatAction = "typing";
        ctx.chatAction = "choose_sticker";
        await time.tickAsync(actionSendingInterval);
        ctx.chatAction = null;
        await time.tickAsync(actionSendingInterval * 2);
        ctx.chatAction = "find_location";

        assertEquals(ctx.chatAction, "find_location");
      });

      await bot.handleUpdate({
        update_id: 0,
        message: createMessage({ chat_id }),
      });
      await time.tickAsync(actionSendingInterval * 2);

      assertSpyCallArgs(api, 0, 1, [
        "sendChatAction",
        {
          action: "typing",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 1, 1, [
        "sendChatAction",
        {
          action: "choose_sticker",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 2, 1, [
        "sendChatAction",
        {
          action: "choose_sticker",
          chat_id,
        },
        signal,
      ]);
      assertSpyCallArgs(api, 3, 1, [
        "sendChatAction",
        {
          action: "find_location",
          chat_id,
        },
        signal,
      ]);
      assertSpyCalls(api, 4);
    } finally {
      time.restore();
    }
  });

  //#region message thread

  it("should fill message_thread_id if it is present in update", async () => {
    const message_thread_id = 1337;

    bot.use(autoChatAction());
    bot.use((ctx) => ctx.chatAction = "typing");

    await bot.handleUpdate({
      update_id: 0,
      message: createMessageInThread({ chat_id, message_thread_id }),
    });

    assertSpyCallArgs(api, 0, 1, [
      "sendChatAction",
      {
        action: "typing",
        chat_id,
        message_thread_id,
      },
      signal,
    ]);
    assertSpyCalls(api, 1);
  });

  //#endregion
});
