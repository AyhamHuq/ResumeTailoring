type Message = { role: "system" | "user"; content: string };

export type LlmConfig = {
  apiKey?: string;
  baseUrl: string;
  model: string;
};

export function getLlmConfig(env = process.env): LlmConfig {
  return {
    apiKey: env.LLM_API_KEY,
    baseUrl: env.LLM_BASE_URL ?? "https://api.openai.com/v1",
    model: env.LLM_MODEL ?? "gpt-4o-mini"
  };
}

export async function callOpenAiCompatibleJson(messages: Message[], config = getLlmConfig()): Promise<unknown> {
  if (!config.apiKey) {
    throw new Error("LLM_API_KEY is not set.");
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM provider returned ${response.status}: ${errorText.slice(0, 500)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("LLM provider returned an empty response.");
  }
  return JSON.parse(content);
}
