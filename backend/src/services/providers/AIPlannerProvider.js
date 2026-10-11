import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * AI trip planner provider. Supports:
 *   - anthropic  (Claude, Messages API)
 *   - groq       (OpenAI-compatible)   e.g. llama-3.3-70b-versatile
 *   - gemini     (OpenAI-compatible)   e.g. gemini-2.5-pro
 *   - openai     (OpenAI-compatible)   or any other compatible API via AI_BASE_URL
 * The provider is auto-detected from the key prefix, or forced with AI_PROVIDER
 * (see config/env.js). To add another provider, add an entry to PROVIDERS.
 */

const SYSTEM_PROMPT = `You are a travel planning assistant for Aerlume, a travel booking platform.
Generate a realistic, specific day-by-day trip itinerary based on the traveler's request.

Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "title": "string, a short evocative trip title",
  "summary": "string, 1-2 sentences summarizing the trip",
  "estimatedBudgetNote": "string, brief note on how the plan fits the stated budget",
  "days": [
    {
      "day": 1,
      "title": "string, short day title",
      "description": "string, 1-2 sentences overview of the day",
      "activities": ["string", "string"]
    }
  ]
}

Keep activities specific and realistic for the destination (real neighborhoods, real types of
experiences), not generic placeholders. Match the number of days to what was requested.`;

const PROVIDERS = {
  anthropic: { label: "Anthropic", type: "anthropic", maxTokens: 4096 },
  groq: {
    label: "Groq",
    type: "openai",
    baseUrl: "https://api.groq.com/openai/v1",
    maxTokens: 4096,
    jsonMode: true,
  },
  gemini: {
    label: "Google Gemini",
    type: "openai",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    maxTokens: 8192, // Gemini 2.5 "thinking" tokens count toward the limit
  },
  openai: {
    label: "OpenAI-compatible",
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    maxTokens: 4096,
  },
};

/**
 * Turns an upstream HTTP failure into an actionable error. Uses 502 rather
 * than passing the provider's status through: a provider 401 means OUR
 * server's key is bad, not that the user's session is invalid — and the web
 * client clears the session on any 401. Outside production the provider's own
 * message is appended; in production it stays in the server logs only.
 */
function upstreamError(label, status, providerMessage) {
  let message;
  if (status === 401 || status === 403) {
    message = `${label} rejected the server's API key. Check AI_API_KEY in the backend .env (and AI_PROVIDER if the key prefix isn't recognised).`;
  } else if (status === 404) {
    message = `${label} could not find the model "${env.ai.model}". Set AI_MODEL in the backend .env to a model ID your account can use.`;
  } else if (status === 429) {
    message = `${label} is rate-limiting requests right now. Please try again in a minute.`;
  } else if (status === 400 && /credit|billing|quota/i.test(providerMessage)) {
    message = `${label} reports no available credit/quota on this account.`;
  } else if (status === 400) {
    message = `${label} rejected the request.`;
  } else {
    message =
      "The AI trip planning service returned an error. Please try again shortly.";
  }
  if (!env.isProd && providerMessage) {
    message += ` (Provider said: ${providerMessage})`;
  }
  return new ApiError(502, message);
}

async function extractProviderMessage(response) {
  const bodyText = await response.text().catch(() => "");
  let message = "";
  try {
    const parsed = JSON.parse(bodyText);
    // Anthropic/OpenAI/Groq: { error: { message } }; Gemini may return an array: [{ error: { message } }]
    message = parsed?.error?.message || parsed?.[0]?.error?.message || "";
  } catch {
    message = bodyText.slice(0, 300);
  }
  return { bodyText, message };
}

class AIPlannerProvider {
  constructor() {
    this.config = PROVIDERS[env.ai.provider] || PROVIDERS.anthropic;
    this.configured = env.ai.configured;
  }

  isConfigured() {
    return this.configured;
  }

  buildUserPrompt({
    destination,
    budget,
    durationDays,
    travelers,
    interests,
    travelStyle,
  }) {
    return [
      `Create a ${durationDays}-day trip plan to ${destination}.`,
      budget ? `Budget: approximately ${budget}.` : null,
      travelers ? `Travelers: ${travelers}.` : null,
      interests?.length ? `Interests: ${interests.join(", ")}.` : null,
      travelStyle ? `Travel style: ${travelStyle}.` : null,
    ]
      .filter(Boolean)
      .join(" ");
  }

  async request(userPrompt) {
    const { type, label, maxTokens, jsonMode } = this.config;
    const baseUrl = env.ai.baseUrl || this.config.baseUrl;

    let response;
    try {
      if (type === "anthropic") {
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ai.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: env.ai.model,
            max_tokens: maxTokens,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });
      } else {
        response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.ai.apiKey}`,
          },
          body: JSON.stringify({
            model: env.ai.model,
            max_tokens: maxTokens,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
          }),
        });
      }
    } catch (err) {
      logger.error(`[AIPlanner] Request to ${label} failed: ${err.message}`);
      throw new ApiError(
        502,
        "Could not reach the AI trip planning service. Please try again shortly.",
      );
    }

    if (!response.ok) {
      const { bodyText, message } = await extractProviderMessage(response);
      logger.error(
        `[AIPlanner] ${label} responded ${response.status} (model: ${env.ai.model}): ${bodyText}`,
      );
      throw upstreamError(label, response.status, message);
    }

    const data = await response.json();
    const rawText =
      type === "anthropic"
        ? data.content?.find((block) => block.type === "text")?.text
        : data.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new ApiError(
        502,
        "The AI trip planning service returned an empty response. Please try again.",
      );
    }
    return rawText;
  }

  async generatePlan(params) {
    if (!this.configured) {
      throw ApiError.internal(
        "The AI trip planner is not configured on this server. Set AI_API_KEY to enable it.",
      );
    }

    const rawText = await this.request(this.buildUserPrompt(params));

    let plan;
    try {
      // Be forgiving: models sometimes wrap JSON in fences or add a sentence around it.
      const start = rawText.indexOf("{");
      const end = rawText.lastIndexOf("}");
      plan = JSON.parse(rawText.slice(start, end + 1));
    } catch (err) {
      logger.error(
        `[AIPlanner] Could not parse model output as JSON: ${err.message}. Output began: ${rawText.slice(0, 200)}`,
      );
      throw new ApiError(
        502,
        "The AI trip planner returned a response we could not parse. Please try again.",
      );
    }

    if (!plan.title || !Array.isArray(plan.days) || plan.days.length === 0) {
      throw new ApiError(
        502,
        "The AI trip planner returned an incomplete plan. Please try again.",
      );
    }
    return plan;
  }
}

export const aiPlannerProvider = new AIPlannerProvider();

if (aiPlannerProvider.isConfigured()) {
  logger.info(
    `[AIPlanner] Using ${aiPlannerProvider.config.label} with model "${env.ai.model}"`,
  );
  if (env.ai.provider === "anthropic" && !env.ai.apiKey.startsWith("sk-ant-")) {
    logger.warn(
      '[AIPlanner] Provider is "anthropic" but AI_API_KEY does not start with "sk-ant-". ' +
        "If this is a Groq/Gemini/OpenAI key, set AI_PROVIDER=groq|gemini|openai.",
    );
  }
} else {
  logger.warn(
    '[AIPlanner] AI_API_KEY is not set — the AI trip planner will return a clear "not configured" message until it is.',
  );
}
