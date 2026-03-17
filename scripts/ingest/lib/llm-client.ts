/**
 * Deep Maps — LLM Client for Content Pipeline
 *
 * Wraps the Anthropic Claude API for structured content generation.
 * Handles retries, rate limiting, and JSON parsing.
 */

import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing ANTHROPIC_API_KEY environment variable.\n' +
      'Set it: export ANTHROPIC_API_KEY=sk-ant-...\n' +
      'Get one: https://console.anthropic.com/settings/keys'
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

interface LLMOptions {
  /** System prompt */
  system: string;
  /** User prompt */
  prompt: string;
  /** Model to use */
  model?: string;
  /** Max tokens for response */
  maxTokens?: number;
  /** Temperature (0-1) */
  temperature?: number;
}

/**
 * Send a prompt to Claude and get a text response.
 */
export async function generateText(options: LLMOptions): Promise<string> {
  const client = getClient();
  const {
    system,
    prompt,
    model = 'claude-sonnet-4-6',
    maxTokens = 8192,
    temperature = 0.3,
  } = options;

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [{ role: 'user', content: prompt }],
  });

  // Extract text from response
  const textBlock = message.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in LLM response');
  }
  return textBlock.text;
}

/**
 * Send a prompt to Claude and parse the response as JSON.
 * Handles common JSON extraction issues (markdown code fences, etc.)
 */
export async function generateJSON<T>(options: LLMOptions): Promise<T> {
  const text = await generateText(options);

  // Try to extract JSON from the response
  let jsonStr = text;

  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1];
  }

  // Try to find JSON object/array
  const jsonMatch = jsonStr.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('Failed to parse LLM JSON response:');
    console.error('Raw text (first 500 chars):', text.slice(0, 500));
    throw new Error(`JSON parse error: ${err}`);
  }
}

/**
 * Generate content for multiple items with rate limiting.
 * Processes items sequentially with a delay between each.
 */
export async function generateBatch<TInput, TOutput>(
  items: TInput[],
  options: {
    system: string;
    buildPrompt: (item: TInput) => string;
    model?: string;
    delayMs?: number;
    onProgress?: (completed: number, total: number, item: TInput) => void;
  },
): Promise<Array<{ input: TInput; output: TOutput | null; error?: string }>> {
  const results: Array<{ input: TInput; output: TOutput | null; error?: string }> = [];
  const delayMs = options.delayMs ?? 1000;  // 1 second between requests

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    options.onProgress?.(i + 1, items.length, item);

    try {
      const output = await generateJSON<TOutput>({
        system: options.system,
        prompt: options.buildPrompt(item),
        model: options.model,
      });
      results.push({ input: item, output });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Error processing item ${i + 1}:`, errorMsg);
      results.push({ input: item, output: null, error: errorMsg });
    }

    // Rate limit delay (skip after last item)
    if (i < items.length - 1 && delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}
