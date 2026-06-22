import { NextRequest } from 'next/server';
import type { UIMessage } from 'ai';
import { isProviderKeyRequired } from '@/lib/ai/providers';
import { streamLLM } from '@/lib/ai/llm';
import { apiError } from '@/lib/server/api-response';
import { resolveModel } from '@/lib/server/resolve-model';
import { createLogger } from '@/lib/logger';
import type { ThinkingConfig } from '@/lib/types/provider';

const log = createLogger('AI Chat API');

export const maxDuration = 60;

interface AIChatRequest {
  messages: UIMessage[];
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  providerType?: string;
  thinkingConfig?: ThinkingConfig;
}

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .map((part) => {
      if (part.type === 'text') return part.text;
      return '';
    })
    .join('')
    .trim();
}

function toModelMessages(messages: UIMessage[]) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role as 'user' | 'assistant',
      content: getTextFromMessage(message),
    }))
    .filter((message) => message.content.length > 0);
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body: AIChatRequest = await req.json();

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return apiError('MISSING_REQUIRED_FIELD', 400, 'Missing required field: messages');
    }

    const modelMessages = toModelMessages(body.messages);
    if (modelMessages.length === 0) {
      return apiError('MISSING_REQUIRED_FIELD', 400, 'At least one text message is required');
    }

    const {
      model: languageModel,
      apiKey: resolvedApiKey,
      providerId,
    } = await resolveModel({
      modelString: body.model,
      apiKey: body.apiKey,
      baseUrl: body.baseUrl,
      providerType: body.providerType,
    });

    if (isProviderKeyRequired(providerId) && !resolvedApiKey) {
      return apiError('MISSING_API_KEY', 401, 'API key is required for this provider');
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    (async () => {
      try {
        const stream = streamLLM(
          {
            model: languageModel,
            system:
              'You are a helpful AI tutor in AI-Guru. Give clear, practical answers and ask follow-up questions only when they are needed.',
            messages: modelMessages,
          },
          'ai-chat',
          body.thinkingConfig,
        );

        for await (const delta of stream.textStream) {
          if (req.signal.aborted) break;
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ type: 'delta', delta })}\n\n`),
          );
        }

        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        await writer.close();
      } catch (error) {
        log.error('Stream failed:', error);
        try {
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to stream response',
              })}\n\n`,
            ),
          );
          await writer.close();
        } catch {
          // Writer may already be closed.
        }
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    log.error('Request failed:', error);
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Failed to process chat request',
    );
  }
}
