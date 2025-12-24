import Router from '@koa/router';
import { PassThrough } from 'stream';
import { processAgentMessage, type Message } from '../../services/claudeAgent';
import { processAgentMessageStream } from '../../services/claudeAgentStreaming';
import { conversationStore } from '../../services/conversationStore';

const router = new Router();

// Get conversation store statistics (for monitoring)
router.get('/api/chat/stats', async (ctx) => {
  try {
    const stats = conversationStore.getStats();
    ctx.body = stats;
  } catch (error) {
    console.error('Error getting stats:', error);
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
  }
});

interface ChatRequest {
  message: string;
  conversationId?: string;
}

// Create a new conversation
router.post('/api/chat/conversations', async (ctx) => {
  try {
    const conversation = conversationStore.create();
    ctx.body = { conversationId: conversation.id };
  } catch (error) {
    console.error('Error creating conversation:', error);
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to create conversation',
    };
  }
});

// Send a message with streaming (SSE)
router.post('/api/chat/stream', async (ctx) => {
  try {
    const { message, conversationId } = ctx.request.body as ChatRequest;

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

    // Get or create conversation
    let conversation = conversationId ? conversationStore.get(conversationId) : null;
    if (!conversation) {
      conversation = conversationStore.create();
    }

    // Add user message to conversation
    conversationStore.addMessage(conversation.id, {
      role: 'user',
      content: message,
    });

    // Set up SSE
    ctx.request.socket.setTimeout(0);
    ctx.req.socket.setNoDelay(true);
    ctx.req.socket.setKeepAlive(true);

    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const stream = new PassThrough();
    ctx.status = 200;
    ctx.body = stream;

    // Send conversation ID first
    stream.write(`data: ${JSON.stringify({ type: 'conversation_id', conversationId: conversation.id })}\n\n`);

    let fullResponse = '';

    // Stream the response
    for await (const event of processAgentMessageStream(message, conversation.messages.slice(0, -1))) {
      if (event.type === 'content' && event.content) {
        fullResponse += event.content;
        stream.write(`data: ${JSON.stringify(event)}\n\n`);
      } else if (event.type === 'tool_use') {
        stream.write(`data: ${JSON.stringify(event)}\n\n`);
      } else if (event.type === 'done') {
        // Add assistant message to conversation
        conversationStore.addMessage(conversation.id, {
          role: 'assistant',
          content: fullResponse,
        });
        stream.write(`data: ${JSON.stringify(event)}\n\n`);
        break;
      } else if (event.type === 'error') {
        stream.write(`data: ${JSON.stringify(event)}\n\n`);
        break;
      }
    }

    stream.end();
  } catch (error) {
    console.error('Chat stream error:', error);
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : 'Failed to process message',
    };
  }
});

// Send a message (non-streaming, legacy)
router.post('/api/chat/message', async (ctx) => {
  try {
    const { message, conversationId } = ctx.request.body as ChatRequest;

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

    // Get or create conversation
    let conversation = conversationId ? conversationStore.get(conversationId) : null;
    if (!conversation) {
      conversation = conversationStore.create();
    }

    // Add user message
    conversationStore.addMessage(conversation.id, {
      role: 'user',
      content: message,
    });

    const response = await processAgentMessage(message, conversation.messages.slice(0, -1));

    // Add assistant message
    conversationStore.addMessage(conversation.id, {
      role: 'assistant',
      content: response.message,
    });

    ctx.body = {
      conversationId: conversation.id,
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

