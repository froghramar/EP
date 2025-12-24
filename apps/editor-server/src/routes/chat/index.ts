import Router from '@koa/router';
import { processAgentMessage, type Message } from '../../services/claudeAgent';

const router = new Router();

interface ChatRequest {
  message: string;
  history?: Message[];
}

// Send a message to the agent
router.post('/api/chat/message', async (ctx) => {
  try {
    const { message, history = [] } = ctx.request.body as ChatRequest;

    if (!message || !message.trim()) {
      ctx.status = 400;
      ctx.body = { error: 'Message is required' };
      return;
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      ctx.status = 500;
      ctx.body = { error: 'ANTHROPIC_API_KEY not configured' };
      return;
    }

    const response = await processAgentMessage(message, history);

    ctx.body = {
      message: response.message,
      toolsUsed: response.toolsUsed,
    };
  } catch (error) {
    console.error('Chat error:', error);
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to process message',
    };
  }
});

export default router;

