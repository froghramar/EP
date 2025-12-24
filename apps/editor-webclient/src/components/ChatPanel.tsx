import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { chatApi } from '../services/api';

export function ChatPanel() {
  const chatMessages = useEditorStore((state) => state.chatMessages);
  const conversationId = useEditorStore((state) => state.conversationId);
  const addChatMessage = useEditorStore((state) => state.addChatMessage);
  const setConversationId = useEditorStore((state) => state.setConversationId);
  const clearChat = useEditorStore((state) => state.clearChat);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    addChatMessage('user', userMessage);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');
    setToolsUsed([]);

    try {
      let responseText = '';
      const usedTools: string[] = [];

      const newConversationId = await chatApi.streamMessage(
        userMessage,
        conversationId,
        (chunk) => {
          responseText += chunk;
          setStreamingMessage(responseText);
        },
        (toolName) => {
          usedTools.push(toolName);
          setToolsUsed([...usedTools]);
        },
        () => {
          // Done
          let finalMessage = responseText;
          if (usedTools.length > 0) {
            finalMessage += `\n\n_Tools used: ${usedTools.join(', ')}_`;
          }
          addChatMessage('assistant', finalMessage);
          setStreamingMessage('');
          setToolsUsed([]);
          setIsLoading(false);
        },
        (error) => {
          // Error
          addChatMessage('assistant', `Error: ${error}`);
          setStreamingMessage('');
          setToolsUsed([]);
          setIsLoading(false);
        }
      );

      // Update conversation ID
      if (newConversationId) {
        setConversationId(newConversationId);
      }
    } catch (error) {
      addChatMessage(
        'assistant',
        `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`
      );
      setStreamingMessage('');
      setToolsUsed([]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        // Trigger form submit
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#252526] text-gray-300">
      <div className="px-3 py-2 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700">
        <span>Chat</span>
        {chatMessages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-blue-400 hover:text-blue-300 normal-case"
            title="Start new conversation"
          >
            New Chat
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && !isLoading ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            <p className="mb-2">👋 I'm your AI coding assistant</p>
            <p className="text-xs">Ask me anything about your code!</p>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-3 py-2 bg-gray-700 text-gray-200">
                  {streamingMessage ? (
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {streamingMessage}
                      <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse"></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <span>AI is thinking</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  )}
                  {toolsUsed.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1 italic">
                      Using: {toolsUsed.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-700 p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
            className="flex-1 bg-[#3c3c3c] text-gray-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            rows={3}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
