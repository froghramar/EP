import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL } from '../config';
import { tools, executeTool, getSystemPrompt } from './agentTools';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  message: string;
  toolsUsed?: string[];
}

/**
 * Process a chat message with the Claude agent
 */
export async function processAgentMessage(
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<AgentResponse> {
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

  let response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    tools,
    messages,
  });

  const toolsUsed: string[] = [];

  // Handle tool use loop
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    const toolResults: Anthropic.MessageParam = {
      role: 'user',
      content: await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          toolsUsed.push(toolUse.name);
          const result = await executeTool(toolUse.name, toolUse.input, { notifyFileWatcher: false });
          
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: result,
          };
        })
      ),
    };

    messages.push(
      { role: 'assistant', content: response.content },
      toolResults
    );

    response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });
  }

  // Extract text response
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );
  const message = textBlocks.map(block => block.text).join('\n');

  return {
    message,
    toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
  };
}

