type Part =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

/**
 * Calls Lovable AI (gateway Responses API) and returns the final text.
 * Streaming is required for reasoning models; we consume the SSE server-side.
 */
export async function askAI(opts: {
  instructions: string;
  parts: Part[];
  effort?: "low" | "medium" | "high";
}): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("خدمة الذكاء الاصطناعي غير مهيأة حالياً.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      instructions: opts.instructions,
      reasoning: { effort: opts.effort ?? "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      input: [{ role: "user", content: opts.parts }],
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("الخدمة مشغولة حالياً، حاول بعد لحظات.");
    if (res.status === 402 || res.status === 403)
      throw new Error("رصيد الذكاء الاصطناعي غير كافٍ. يرجى مراجعة إعدادات المشروع.");
    throw new Error(`تعذر تحليل الطلب (${res.status}). ${detail.slice(0, 180)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
        } else if (event.type === "response.completed" && !text) {
          text = event.response?.output_text ?? "";
        }
      } catch {
        // ignore keep-alive / partial frames
      }
    }
  }

  return text.trim();
}

export function parseJsonBlock<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
