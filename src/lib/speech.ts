type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous?: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
};

type RecognitionCtor = new () => RecognitionLike;

export function getRecognition(): RecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as typeof window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = "ar-JO";
  recognition.interimResults = false;
  return recognition;
}

/** Plays spoken Arabic audio for `text`. Must be started from a user gesture. */
export class VoicePlayer {
  private ctx: AudioContext | null = null;
  private controller: AbortController | null = null;
  private playhead = 0;
  private pending = new Uint8Array(0);

  stop() {
    this.controller?.abort();
    this.controller = null;
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.playhead = 0;
    this.pending = new Uint8Array(0);
  }

  async speak(text: string): Promise<void> {
    this.stop();
    const controller = new AbortController();
    this.controller = controller;
    const ctx = new AudioContext({ sampleRate: 24000 });
    this.ctx = ctx;
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) throw new Error("تعذر تشغيل الرد الصوتي");

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload) as { type?: string; audio?: string };
          if (event.type !== "speech.audio.delta" || !event.audio) continue;
          const binary = atob(event.audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          this.play(ctx, bytes);
        } catch {
          // ignore partial frames
        }
      }
    }
  }

  private play(ctx: AudioContext, incoming: Uint8Array) {
    const bytes = new Uint8Array(this.pending.length + incoming.length);
    bytes.set(this.pending);
    bytes.set(incoming, this.pending.length);
    const usable = bytes.length - (bytes.length % 2);
    this.pending = bytes.slice(usable);
    if (usable === 0) return;
    const samples = new Int16Array(bytes.buffer, 0, usable / 2);
    const floats = Float32Array.from(samples, (s) => s / 32768);
    const buffer = ctx.createBuffer(1, floats.length, 24000);
    buffer.copyToChannel(floats, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    this.playhead = this.playhead === 0 ? ctx.currentTime + 0.05 : Math.max(this.playhead, ctx.currentTime);
    source.start(this.playhead);
    this.playhead += buffer.duration;
  }
}
