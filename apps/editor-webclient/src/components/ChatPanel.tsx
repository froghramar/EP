import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { chatApi } from '../services/api';
import { Spinner } from './Spinner';

export function ChatPanel() {
  const chatMessages = useEditorStore((state) => state.chatMessages);
  const conversationId = useEditorStore((state) => state.conversationId);
  const conversations = useEditorStore((state) => state.conversations);
  const isLoadingConversations = useEditorStore((state) => state.isLoadingConversations);
  const addChatMessage = useEditorStore((state) => state.addChatMessage);
  const setConversationId = useEditorStore((state) => state.setConversationId);
  const clearChat = useEditorStore((state) => state.clearChat);
  const loadConversations = useEditorStore((state) => state.loadConversations);
  const loadConversation = useEditorStore((state) => state.loadConversation);
  const createNewConversation = useEditorStore((state) => state.createNewConversation);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<'thinking' | 'executing' | 'done'>('thinking');
  const [showThreads, setShowThreads] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Load conversations on mount
    loadConversations();
    
    // Try to load last conversation from localStorage
    const lastConversationId = localStorage.getItem('lastConversationId');
    if (lastConversationId) {
      loadConversation(lastConversationId).catch(() => {
        // If loading fails, clear it
        localStorage.removeItem('lastConversationId');
      });
    }
  }, [loadConversations, loadConversation]);

  useEffect(() => {
    // Save current conversation ID to localStorage
    if (conversationId) {
      localStorage.setItem('lastConversationId', conversationId);
    }
  }, [conversationId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    addChatMessage('user', userMessage);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');
    setToolsUsed([]);
    setExecutingTool(null);
    setAgentStatus('thinking');

    try {
      let responseText = '';
      const usedTools: string[] = [];

      const newConversationId = await chatApi.streamMessage(
        userMessage,
        conversationId,
        (chunk) => {
          responseText += chunk;
          setStreamingMessage(responseText);
          setAgentStatus('thinking');
        },
        (toolName) => {
          usedTools.push(toolName);
          setToolsUsed([...usedTools]);
        },
        (toolName) => {
          setExecutingTool(toolName);
          setAgentStatus('executing');
        },
        (toolName, result) => {
          setExecutingTool(null);
          setAgentStatus('thinking');
          // Log tool result for debugging
          try {
            const resultObj = JSON.parse(result);
            if (resultObj.error) {
              console.error(`Tool ${toolName} error:`, resultObj.error);
            } else {
              console.log(`Tool ${toolName} completed successfully`);
            }
          } catch {
            // Result is not JSON, that's okay
          }
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
          setExecutingTool(null);
          setAgentStatus('done');
          setIsLoading(false);
        },
        (error) => {
          // Error
          addChatMessage('assistant', `Error: ${error}`);
          setStreamingMessage('');
          setToolsUsed([]);
          setExecutingTool(null);
          setAgentStatus('done');
          setIsLoading(false);
        }
      );

      // Update conversation ID and reload conversations list
      if (newConversationId) {
        setConversationId(newConversationId);
        await loadConversations();
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

  const handleNewChat = async () => {
    await createNewConversation();
    setShowThreads(false);
  };

  const handleSwitchThread = async (id: string) => {
    await loadConversation(id);
    setShowThreads(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#252526] text-gray-300">
      <div className="px-3 py-2 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span>Chat</span>
          {isLoading && <Spinner size="sm" className="text-blue-400" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThreads(!showThreads)}
            className="text-xs text-gray-400 hover:text-gray-300 normal-case px-2 py-1 rounded hover:bg-gray-700"
            title="Threads"
          >
            💬 Threads ({conversations.length})
          </button>
          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className="text-xs text-blue-400 hover:text-blue-300 normal-case disabled:opacity-50"
            title="Start new conversation"
          >
            + New
          </button>
        </div>
      </div>

      {/* Threads sidebar */}
      {showThreads && (
        <div className="border-b border-gray-700 bg-[#1e1e1e] max-h-64 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              <Spinner size="sm" className="mx-auto mb-2" />
              Loading threads...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No conversations yet
            </div>
          ) : (
            <div className="py-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSwitchThread(conv.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                    conv.id === conversationId ? 'bg-gray-700/50 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <div className="truncate text-gray-300">
                    {conv.preview || `Conversation ${conv.id.slice(0, 8)}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {conv.messageCount} messages • {new Date(conv.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
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
                  <div 
                    className="text-sm break-words"
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-3 py-2 bg-gray-700 text-gray-200">
                  {streamingMessage ? (
                    <div 
                      className="text-sm break-words"
                      style={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {streamingMessage}
                      <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse"></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      {executingTool ? (
                        <>
                          <Spinner size="sm" className="text-yellow-400" />
                          <span className="text-yellow-400">Executing {executingTool}...</span>
                        </>
                      ) : (
                        <>
                          <Spinner size="sm" className="text-blue-400" />
                          <span>AI is thinking</span>
                        </>
                      )}
                    </div>
                  )}
                  {toolsUsed.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1 italic">
                      Tools used: {toolsUsed.join(', ')}
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
            placeholder={isLoading ? "AI is working, please wait..." : "Type a message... (Enter to send, Shift+Enter for new line)"}
            disabled={isLoading}
            className="flex-1 bg-[#3c3c3c] text-gray-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Spinner size="sm" />}
            {isLoading ? 'Working...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
