import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Sparkles, RefreshCw, Bot, User, ArrowLeft } from 'lucide-react';
import { ChatScenario, ChatMessage } from '../types';
import { api } from '../services/api';
import { speakKannada } from '../utils/speech';

interface PracticeChatPageProps {
  initialScenarioId?: string;
  onBackToHome?: () => void;
  onVoiceMissing?: () => void;
}

export const PracticeChatPage: React.FC<PracticeChatPageProps> = ({
  initialScenarioId = 'market-chat',
  onBackToHome,
  onVoiceMissing
}) => {
  const [scenarios, setScenarios] = useState<ChatScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(initialScenarioId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load scenarios
  useEffect(() => {
    async function load() {
      const data = await api.getChatScenarios();
      setScenarios(data);
      const chosenId = initialScenarioId || (data[0] ? data[0].id : 'market-chat');
      setActiveScenarioId(chosenId);

      const target = data.find((s) => s.id === chosenId) || data[0];
      if (target) {
        setMessages([
          {
            id: 'm-init',
            sender: 'bot',
            kannada: target.initialMessage.kannada,
            roman: target.initialMessage.roman,
            english: target.initialMessage.english,
            timestamp: target.initialMessage.timestamp
          }
        ]);
      }
    }
    load();
  }, [initialScenarioId]);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    const target = scenarios.find((s) => s.id === id);
    if (target) {
      setMessages([
        {
          id: `m-init-${Date.now()}`,
          sender: 'bot',
          kannada: target.initialMessage.kannada,
          roman: target.initialMessage.roman,
          english: target.initialMessage.english,
          timestamp: target.initialMessage.timestamp
        }
      ]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      kannada: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Call API /api/chat
    const botReply = await api.sendChatMessage(text, activeScenarioId);
    setIsLoading(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        sender: 'bot',
        kannada: botReply.kannada,
        roman: botReply.roman,
        english: botReply.english,
        timestamp: botReply.timestamp
      }
    ]);
  };

  const handleResetChat = () => {
    if (activeScenario) {
      setMessages([
        {
          id: `m-init-${Date.now()}`,
          sender: 'bot',
          kannada: activeScenario.initialMessage.kannada,
          roman: activeScenario.initialMessage.roman,
          english: activeScenario.initialMessage.english,
          timestamp: activeScenario.initialMessage.timestamp
        }
      ]);
    }
  };

  const handleListen = (text: string) => {
    speakKannada(
      text,
      undefined,
      undefined,
      () => {
        if (onVoiceMissing) onVoiceMissing();
      }
    );
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="text-xs font-semibold text-[#B71C1C] hover:underline flex items-center gap-1 sm:hidden mr-1"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <h1 className="text-2xl font-bold text-[#2B2B2B] flex items-center gap-2">
              <span>💬</span> AI Practice Chat
            </h1>
          </div>
          <p className="text-xs text-[#6B5B4B] mt-0.5">
            Simulate practical daily Kannada conversations with instant feedback.
          </p>
        </div>

        {/* Scenario Switcher Buttons */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#FFE082] shadow-xs">
          {scenarios.map((sc) => {
            const isActive = sc.id === activeScenarioId;
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#B71C1C] text-white shadow-xs'
                    : 'text-[#6B5B4B] hover:text-[#2B2B2B]'
                }`}
              >
                {sc.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl border border-[#FFF0B3] kannada-card-shadow overflow-hidden flex flex-col h-[600px]">
        {/* Vendor/Scenario Info Bar */}
        {activeScenario && (
          <div className="bg-[#FFF8E1] px-5 py-3 border-b border-[#FFE082] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFC107] text-[#B71C1C] font-bold flex items-center justify-center text-lg border border-[#FFE082]">
                🏪
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2B2B2B]">
                  {activeScenario.vendorName}
                </h3>
                <p className="text-xs text-[#6B5B4B] font-kannada">
                  {activeScenario.vendorRole} · <span className="font-sans font-medium">{activeScenario.title}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleResetChat}
              className="p-2 rounded-lg text-[#6B5B4B] hover:text-[#B71C1C] hover:bg-white text-xs font-semibold flex items-center gap-1 transition-all"
              title="Reset conversation"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Restart</span>
            </button>
          </div>
        )}

        {/* Chat Messages scroll area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#FFFDF7]">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  isBot ? 'justify-start' : 'justify-end'
                }`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-full bg-[#FFC107] text-[#2B2B2B] flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 shadow-xs ${
                    isBot
                      ? 'bg-white border border-[#FFE082] text-[#2B2B2B]'
                      : 'bg-[#B71C1C] text-white'
                  }`}
                >
                  {/* Kannada text */}
                  <div className={`font-kannada font-bold text-lg md:text-xl leading-snug ${isBot ? 'text-[#B71C1C]' : 'text-white'}`}>
                    {msg.kannada}
                  </div>

                  {/* Roman & English for bot messages */}
                  {msg.roman && (
                    <div className="text-xs font-semibold text-[#2B2B2B] mt-1 pt-1 border-t border-[#FFF0B3]">
                      {msg.roman}
                    </div>
                  )}

                  {msg.english && (
                    <div className="text-xs text-[#6B5B4B] mt-0.5">
                      Meaning: {msg.english}
                    </div>
                  )}

                  {/* Footer: timestamp + audio button for bot */}
                  <div className="flex items-center justify-between gap-3 mt-2 pt-1">
                    <span className={`text-[10px] ${isBot ? 'text-[#6B5B4B]' : 'text-white/70'}`}>
                      {msg.timestamp}
                    </span>

                    {isBot && (
                      <button
                        onClick={() => handleListen(msg.kannada)}
                        className="text-[11px] font-semibold text-[#B71C1C] hover:bg-[#FFF0B3] px-2 py-0.5 rounded flex items-center gap-1 transition-all"
                        title="Listen to phrase"
                      >
                        <Volume2 size={13} />
                        <span>Listen</span>
                      </button>
                    )}
                  </div>
                </div>

                {!isBot && (
                  <div className="w-8 h-8 rounded-full bg-[#B71C1C] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#6B5B4B] bg-white px-3 py-2 rounded-xl w-max border border-[#FFE082]">
              <Sparkles size={14} className="text-[#FFC107] animate-spin" />
              <span>Vendor is typing in Kannada...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips */}
        {activeScenario && activeScenario.quickReplies?.length > 0 && (
          <div className="px-4 py-2 bg-[#FFF8E1] border-t border-[#FFE082] overflow-x-auto flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#6B5B4B] uppercase shrink-0">
              Quick replies:
            </span>
            {activeScenario.quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => handleSend(qr.kannada)}
                className="shrink-0 text-xs font-semibold bg-white text-[#2B2B2B] hover:bg-[#FFE082] hover:text-[#B71C1C] border border-[#FFE082] px-3 py-1.5 rounded-full transition-all shadow-2xs"
              >
                <span className="font-kannada font-bold mr-1">{qr.kannada}</span>
                <span className="text-[10px] text-[#6B5B4B]">({qr.english})</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Area */}
        <div className="p-3 bg-white border-t border-[#FFE082] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Type your message in Kannada or English transliteration..."
            className="flex-1 min-h-[44px] px-4 rounded-[10px] bg-[#FFF8E1] border border-[#FFE082] text-sm text-[#2B2B2B] placeholder:text-[#6B5B4B]/60 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="min-h-[44px] px-5 bg-[#B71C1C] text-white hover:bg-[#8F1414] disabled:opacity-50 disabled:cursor-not-allowed rounded-[10px] font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <span>Send</span>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
