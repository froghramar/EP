import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { chatApi } from '../services/api';
import { Spinner } from './Spinner';

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to format AI messages with basic markdown-like formatting
function formatAIMessage(content: string): string {
  let formatted = escapeHtml(content);
  
  // Code blocks with ```
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900/80 rounded p-2 my-2 overflow-x-auto text-xs border border-gray-700/50"><code>$1</code></pre>');
  
  // Inline code with `
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-900/60 px-1.5 py-0.5 rounded text-xs font-mono text-blue-400">$1</code>');
  
  // Bold with **
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
  
  // Italic with *
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  
  // Links
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Bullet points
  formatted = formatted.replace(/^- (.+)$/gm, '<span class="block">• $1</span>');
  
  return formatted;
}

export function ChatPanel() {
  const chatMessages = useEditorStore((state) => state.chatMessages);
  const conversationId = useEditorStore((state) => state.conversationId);
  const conversations = useEditorStore((state) => state.conversations);
  const isLoadingConversations = useEditorStore((state) => state.isLoadingConversations);
  const addChatMessage = useEditorStore((state) => state.addChatMessage);
  const setConversationId = useEditorStore((state) => state.setConversationId);
  const loadConversations = useEditorStore((state) => state.loadConversations);
  const loadConversation = useEditorStore((state) => state.loadConversation);
  const createNewConversation = useEditorStore((state) => state.createNewConversation);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [executingTool, setExecutingTool] = useState<string | null>(null);
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
        (toolName) => {
          setExecutingTool(toolName);
        },
        (toolName, result) => {
          setExecutingTool(null);
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
          setIsLoading(false);
        },
        (error) => {
          // Error
          addChatMessage('assistant', `Error: ${error}`);
          setStreamingMessage('');
          setToolsUsed([]);
          setExecutingTool(null);
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
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1e1e1e] to-[#252526] text-gray-300">
      <div className="flex items-center justify-between border-b border-gray-700 bg-[#2d2d30] shadow-lg" style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px'}}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg style={{width: '16px', height: '16px'}} className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-200">AI Assistant</span>
            {isLoading && (
              <span className="text-xs text-blue-400 flex items-center" style={{gap: '4px'}}>
                <Spinner size="sm" className="text-blue-400" />
                Processing...
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThreads(!showThreads)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              showThreads 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
            }`}
            title="View conversation threads"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <span className="font-medium">{conversations.length}</span>
            </span>
          </button>
          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
            title="Start new conversation"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </span>
          </button>
        </div>
      </div>

      {/* Threads sidebar */}
      {showThreads && (
        <div className="border-b border-gray-700 bg-[#1e1e1e] max-h-72 overflow-y-auto shadow-inner">
          {isLoadingConversations ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              <Spinner size="sm" className="mx-auto mb-2 text-blue-400" />
              <div>Loading conversations...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <svg style={{width: '40px', height: '40px'}} className="mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="text-sm">No conversations yet</div>
              <div className="text-xs mt-1">Start chatting to create your first thread</div>
            </div>
          ) : (
            <div className="py-3">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSwitchThread(conv.id)}
                  className={`w-full text-left text-sm hover:bg-gray-700/70 transition-all group relative ${
                    conv.id === conversationId 
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-l-2 border-blue-500' 
                      : 'hover:border-l-2 hover:border-gray-600'
                  }`}
                  style={{paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px'}}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 ${conv.id === conversationId ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                      <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`truncate font-medium ${conv.id === conversationId ? 'text-blue-300' : 'text-gray-300'}`}>
                        {conv.preview || `Conversation ${conv.id.slice(0, 8)}`}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="flex items-center" style={{gap: '4px'}}>
                          <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          {conv.messageCount}
                        </span>
                        <span>•</span>
                        <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto" style={{padding: '16px 0'}}>
        {chatMessages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4">
              <svg style={{width: '28px', height: '28px'}} className="text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-300 mb-2">👋 Welcome to AI Assistant</p>
            <p className="text-sm text-gray-500 max-w-xs">
              I'm here to help with your code! Ask me anything about:
            </p>
            <div className="mt-4 text-xs text-gray-500 space-y-2">
              <div className="flex items-center gap-2">
                <svg style={{width: '16px', height: '16px'}} className="text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Code explanations and debugging
              </div>
              <div className="flex items-center gap-2">
                <svg style={{width: '16px', height: '16px'}} className="text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                File operations and refactoring
              </div>
              <div className="flex items-center gap-2">
                <svg style={{width: '16px', height: '16px'}} className="text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Best practices and optimization
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                style={{marginBottom: '16px'}}
              >
                <div
                  className={`max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-[#094771] text-white shadow-lg shadow-blue-900/50'
                      : 'bg-gray-800/60 text-gray-100 shadow-lg shadow-black/30'
                  }`}
                  style={{
                    paddingLeft: '14px', 
                    paddingRight: '14px', 
                    paddingTop: '10px', 
                    paddingBottom: '10px',
                    borderRadius: message.role === 'user' ? '16px' : '12px'
                  }}
                >
                  <div 
                    className="text-sm leading-relaxed break-words"
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: message.role === 'assistant' 
                        ? formatAIMessage(message.content)
                        : escapeHtml(message.content)
                    }}
                  />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start" style={{marginBottom: '16px'}}>
                <div className="max-w-[85%] bg-gray-800/60 text-gray-100 shadow-lg shadow-black/30" style={{paddingLeft: '14px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '12px'}}>
                  {streamingMessage ? (
                    <div 
                      className="text-sm leading-relaxed break-words"
                      style={{ 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        padding: '4px 6px'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: formatAIMessage(streamingMessage) + '<span class="inline-block w-1.5 h-3.5 ml-1 bg-blue-500 animate-pulse rounded"></span>'
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-3 text-sm">
                      {executingTool ? (
                        <>
                          <Spinner size="sm" className="text-yellow-400" />
                          <div>
                            <div className="text-yellow-400 font-medium">Executing tool...</div>
                            <div className="text-xs text-gray-400 mt-0.5">{executingTool}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Spinner size="sm" className="text-blue-400" />
                          <span className="text-blue-400">AI is thinking...</span>
                        </>
                      )}
                    </div>
                  )}
                  {toolsUsed.length > 0 && (
                    <div className="flex flex-wrap mt-2 pt-2 border-t border-gray-600" style={{gap: '4px'}}>
                      {toolsUsed.map((tool, index) => (
                        <span key={index} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-700 bg-[#2d2d30] shadow-lg" style={{padding: '8px'}}>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "AI is working, please wait..." : "Type your message... (Enter to send, Shift+Enter for new line)"}
              disabled={isLoading}
              className="w-full bg-[#3c3c3c] text-gray-200 rounded-xl px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 placeholder-gray-500 transition-all"
              rows={3}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              {input.length > 0 && (
                <span className={input.length > 500 ? 'text-yellow-500' : ''}>
                  {input.length}
                </span>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 flex items-center gap-2 shadow-lg hover:shadow-xl self-end"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
          <span className="flex items-center" style={{gap: '4px'}}>
            <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Enter to send
          </span>
          <span className="flex items-center" style={{gap: '4px'}}>
            <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Shift+Enter for new line
          </span>
        </div>
      </form>
    </div>
  );
}
