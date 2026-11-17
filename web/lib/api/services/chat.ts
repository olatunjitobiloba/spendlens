import type { ChatReply, ChatRequest, Transcription } from "@/types/api";
import { http } from "../client";
import { TIMEOUTS } from "../config";

function audioExt(type: string) {
  if (type.includes("mp4")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}

/** POST /v1/chat and POST /v1/chat/transcriptions. */
export const chatService = {
  send: (req: ChatRequest, signal?: AbortSignal) =>
    http.post<ChatReply>("/chat", req, { timeout: TIMEOUTS.chat, signal }).then((r) => r.data),

  /** A recorded voice note in, its text out. The text is then sent through `send`. */
  transcribe: (audio: Blob, signal?: AbortSignal) => {
    const form = new FormData();
    form.set("file", audio, `voice-note.${audioExt(audio.type)}`);
    return http
      .post<Transcription>("/chat/transcriptions", form, { timeout: TIMEOUTS.chat, signal })
      .then((r) => r.data);
  },
};
