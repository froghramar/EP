import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '../config';
import { tools, executeTool, getSystemPrompt } from './agentTools';
import { Message } from './claudeAgent';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface StreamEvent {
  type: 'content' | 'tool_use' | 'done' | 'error';
  content?: string;
  toolName?: string;
  done?: boolean;
  error?: string;
}

/**
 * Process a chat message with streaming
 */
export async function* processAgentMessageStream(
  userMessage: string,
  conversationHistory: Message[] = []
): AsyncGenerator<StreamEvent> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  const systemPrompt = getSystemPrompt();

  try {
    let fullResponse = '';
    const toolsUsed: string[] = [];

    const stream = await anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullResponse += chunk.delta.text;
        yield {
          type: 'content',
          content: chunk.delta.text,
        };
      } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
        const toolName = chunk.content_block.name;
        toolsUsed.push(toolName);
        yield {
          type: 'tool_use',
          toolName,
        };
      }
    }

    const finalMessage = await stream.finalMessage();

    // Handle tool use
    if (finalMessage.stop_reason === 'tool_use') {
      const toolUseBlocks = finalMessage.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.MessageParam = {
        role: 'user',
        content: await Promise.all(
          toolUseBlocks.map(async (toolUse) => {
            const result = await executeTool(toolUse.name, toolUse.input, { notifyFileWatcher: true });
            
            return {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: result,
            };
          })
        ),
      };

      messages.push(
        { role: 'assistant', content: finalMessage.content },
        toolResults
      );

      // Continue with tool results
      const followupStream = await anthropic.messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      });

      for await (const chunk of followupStream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullResponse += chunk.delta.text;
          yield {
            type: 'content',
            content: chunk.delta.text,
          };
        }
      }
    }

    yield {
      type: 'done',
      done: true,
    };
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

