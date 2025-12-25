import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '../config';
import { tools, executeTool, getSystemPrompt } from './agentTools';
import { Message } from './claudeAgent';

const anthropic = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface StreamEvent {
  type: 'content' | 'tool_use' | 'tool_executing' | 'tool_result' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolResult?: string;
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
    let maxToolIterations = 10; // Prevent infinite loops
    let iterationCount = 0;

    while (iterationCount < maxToolIterations) {
      iterationCount++;
      
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

      // Handle tool use - continue loop if tools were used
      if (finalMessage.stop_reason === 'tool_use') {
        const toolUseBlocks = finalMessage.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        // Emit tool execution events
        for (const toolUse of toolUseBlocks) {
          yield {
            type: 'tool_executing',
            toolName: toolUse.name,
          };
        }

        // Execute tools sequentially to properly yield events
        const toolResultContents: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          try {
            console.log(`Executing tool: ${toolUse.name} with input:`, JSON.stringify(toolUse.input));
            const result = await executeTool(toolUse.name, toolUse.input, { notifyFileWatcher: true });
            
            // Emit tool result event
            yield {
              type: 'tool_result',
              toolName: toolUse.name,
              toolResult: result,
            };
            
            toolResultContents.push({
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: result,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error executing tool ${toolUse.name}:`, errorMessage, error);
            
            yield {
              type: 'tool_result',
              toolName: toolUse.name,
              toolResult: JSON.stringify({ error: errorMessage }),
            };
            
            toolResultContents.push({
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: JSON.stringify({ error: errorMessage }),
            });
          }
        }

        const toolResults: Anthropic.MessageParam = {
          role: 'user',
          content: toolResultContents,
        };

        messages.push(
          { role: 'assistant', content: finalMessage.content },
          toolResults
        );

        // Continue loop to process tool results
        continue;
      } else {
        // No more tool use, we're done
        break;
      }
    }

    if (iterationCount >= maxToolIterations) {
      yield {
        type: 'error',
        error: 'Maximum tool iterations reached. The agent may be stuck in a loop.',
      };
    } else {
      yield {
        type: 'done',
        done: true,
      };
    }
  } catch (error) {
    console.error('Error in processAgentMessageStream:', error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

