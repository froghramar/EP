import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';

export function ChatPanel() {
  const chatMessages = useEditorStore((state) => state.chatMessages);
  const addChatMessage = useEditorStore((state) => state.addChatMessage);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    addChatMessage('user', userMessage);
    setInput('');

    // Simulate assistant response (replace with actual API call)
    setTimeout(() => {
      addChatMessage('assistant', `You said: "${userMessage}". This is a placeholder response.`);
    }, 500);
  };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        addChatMessage('user', input);
        setInput('');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#252526] text-gray-300">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700">
        Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            Start a conversation...
          </div>
        ) : (
          chatMessages.map((message) => (
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
          ))
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
            className="flex-1 bg-[#3c3c3c] text-gray-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
