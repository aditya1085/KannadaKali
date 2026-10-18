import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Sparkles, RefreshCw, Bot, User, ArrowLeft, Lightbulb, X, AlertCircle } from 'lucide-react';
import { ChatScenario, ChatMessage } from '../types';
import { api, ChatHint } from '../services/api';
import { speakKannada } from '../utils/speech';
import { useAuth } from '../context/AuthContext';

interface PracticeChatPageProps {
  initialScenarioId?: string;
  onBackToHome?: () => void;
  onVoiceMissing?: () => void;
}

export const PracticeChatPage: React.FC<PracticeChatPageProps> = ({
  initialScenarioId,
  onBackToHome,
  onVoiceMissing,
}) => {
  const { user } = useAuth();

  const [scenarios, setScenarios] = useState<ChatScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId || 'market-chat');
  const [selectedLevel, setSelectedLevel] = useState<'Beginner' | 'Intermediate'>('Beginner');
  const [isChatActive, setIsChatActive] = useState<boolean>(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Hint state
  const [hint, setHint] = useState<ChatHint | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load scenarios on mount
  useEffect(() => {
    async function load() {
      const data = await api.getChatScenarios();
      setScenarios(data);
      if (initialScenarioId && data.some((s) => s.id === initialScenarioId)) {
        setSelectedScenarioId(initialScenarioId);
      } else if (data.length > 0) {
        setSelectedScenarioId(data[0].id);
      }
    }
    load();
  }, [initialScenarioId]);

  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  // Initialize or reset chat when a scenario starts
  const startScenarioChat = (scenarioId: string, level: 'Beginner' | 'Intermediate') => {
    setSelectedScenarioId(scenarioId);
    setSelectedLevel(level);
    const target = scenarios.find((s) => s.id === scenarioId) || scenarios[0];

    if (target) {
      setMessages([
        {
          id: `init-${Date.now()}`,
          sender: 'bot',
          kannada: target.initialMessage.kannada,
          roman: target.initialMessage.roman,
          english: target.initialMessage.english,
          timestamp: target.initialMessage.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    setErrorMessage(null);
    setHint(null);
    setInputText('');
    setIsChatActive(true);
  };

  const handleResetChat = () => {
    if (activeScenario) {
      setMessages([
        {
          id: `reset-${Date.now()}`,
          sender: 'bot',
          kannada: activeScenario.initialMessage.kannada,
          roman: activeScenario.initialMessage.roman,
          english: activeScenario.initialMessage.english,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setErrorMessage(null);
      setHint(null);
      setInputText('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatActive) {
      scrollToBottom();
    }
  }, [messages, isLoading, isChatActive]);

  // Send a message to AI server
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    setHint(null);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      kannada: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const idToken = user ? await user.getIdToken() : '';

      // Prepare conversation history for server
      const historyPayload = nextMessages.slice(-10).map((m) => ({
        sender: m.sender,
        text: m.kannada,
        kannada: m.kannada,
      }));

      const scenarioLabel = `${activeScenario?.title || 'Market'} ${activeScenario?.emoji || ''}`;

      const reply = await api.sendAiChat({
        scenario: scenarioLabel,
        level: selectedLevel,
        history: historyPayload,
        userMessage: text,
        idToken,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          kannada: reply.replyKannada,
          roman: reply.replyRoman,
          english: reply.replyEnglish,
          correction: reply.correction,
          tip: reply.tip,
          timestamp: reply.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err?.message || 'Could not connect to the AI chat service. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Request a hint for what to say next
  const handleGetHint = async () => {
    if (isLoadingHint) return;
    setIsLoadingHint(true);
    setErrorMessage(null);

    try {
      const idToken = user ? await user.getIdToken() : '';
      const historyPayload = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.kannada,
        kannada: m.kannada,
      }));

      const scenarioLabel = `${activeScenario?.title || 'Market'} ${activeScenario?.emoji || ''}`;

      const suggestedHint = await api.getChatHint({
        scenario: scenarioLabel,
        level: selectedLevel,
        history: historyPayload,
        idToken,
      });

      setHint(suggestedHint);
    } catch (err: any) {
      console.warn('Hint error:', err);
      // Fallback hint
      setHint({
        kannada: 'ಎಷ್ಟು ರೂಪಾಯಿ ಆಗುತ್ತೆ?',
        roman: 'Eshtu roopayi aagutte?',
        english: 'How many rupees will it be?',
      });
    } finally {
      setIsLoadingHint(false);
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

  // 1. SCENARIO & LEVEL PICKER VIEW
  if (!isChatActive) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        {/* Header */}
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
              <h1 className="text-2xl md:text-3xl font-bold text-[#2B2B2B] flex items-center gap-2">
                <span>💬</span> AI Practice Chat
              </h1>
            </div>
            <p className="text-sm text-[#6B5B4B] mt-1">
              Select a real-world Bangalore scenario and your learning level to practice conversational Kannada with instant AI feedback.
            </p>
          </div>
        </div>

        {/* Level Selection Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#FFF0B3] kannada-card-shadow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#2B2B2B] uppercase tracking-wider flex items-center gap-2">
              <span>🎯</span> 1. Choose Your Level
            </h2>
            <span className="text-xs text-[#6B5B4B] font-medium">Adapts speech complexity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedLevel('Beginner')}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedLevel === 'Beginner'
                  ? 'border-[#B71C1C] bg-[#FFF8E1] shadow-xs'
                  : 'border-[#FFE082]/60 bg-white hover:border-[#FFC107]'
              }`}
            >
              <div className="text-2xl">🌱</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#2B2B2B]">Beginner</span>
                  {selectedLevel === 'Beginner' && (
                    <span className="text-[10px] bg-[#B71C1C] text-white px-2 py-0.5 rounded-full font-bold">Selected</span>
                  )}
                </div>
                <p className="text-xs text-[#6B5B4B] mt-1 leading-relaxed">
                  Simple words, short 1-2 sentence dialogues, clear English translations, and gentle corrections.
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedLevel('Intermediate')}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedLevel === 'Intermediate'
                  ? 'border-[#B71C1C] bg-[#FFF8E1] shadow-xs'
                  : 'border-[#FFE082]/60 bg-white hover:border-[#FFC107]'
              }`}
            >
              <div className="text-2xl">🌿</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#2B2B2B]">Intermediate</span>
                  {selectedLevel === 'Intermediate' && (
                    <span className="text-[10px] bg-[#B71C1C] text-white px-2 py-0.5 rounded-full font-bold">Selected</span>
                  )}
                </div>
                <p className="text-xs text-[#6B5B4B] mt-1 leading-relaxed">
                  Everyday Bangalore street Kannada, realistic bargaining, natural flow, and practical grammar tips.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Scenario Selection Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#2B2B2B] uppercase tracking-wider flex items-center gap-2">
              <span>🏪</span> 2. Choose a Scenario
            </h2>
            <span className="text-xs text-[#6B5B4B] font-medium">{scenarios.length} scenarios available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              const emoji = sc.emoji || (sc.id.includes('market') ? '🛒' : sc.id.includes('bus') ? '🚌' : sc.id.includes('restaurant') ? '🍛' : sc.id.includes('hospital') ? '🏥' : '💼');

              return (
                <div
                  key={sc.id}
                  className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between kannada-card-shadow ${
                    isSelected
                      ? 'border-[#B71C1C] ring-2 ring-[#B71C1C]/20'
                      : 'border-[#FFF0B3] hover:border-[#FFC107]'
                  }`}
                >
                  <div>
                    {/* Top row with emoji and role */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF8E1] border border-[#FFE082] flex items-center justify-center text-2xl">
                        {emoji}
                      </div>
                      <span className="text-[11px] font-semibold text-[#6B5B4B] bg-[#FFF8E1] px-2.5 py-1 rounded-full border border-[#FFE082]">
                        {sc.category || 'Everyday'}
                      </span>
                    </div>

                    {/* Titles */}
                    <h3 className="text-base font-bold text-[#2B2B2B] flex items-center gap-1.5">
                      <span>{sc.title}</span>
                      <span className="text-sm">{emoji}</span>
                    </h3>
                    <p className="font-kannada font-bold text-sm text-[#B71C1C] mt-0.5">
                      {sc.kannadaTitle}
                    </p>

                    {/* Persona info */}
                    <div className="mt-2.5 pt-2.5 border-t border-[#FFF0B3] text-xs text-[#6B5B4B]">
                      <div className="font-semibold text-[#2B2B2B]">
                        Partner: {sc.vendorName}
                      </div>
                      <div className="text-[11px] text-[#6B5B4B] mt-0.5 font-kannada">
                        {sc.vendorRole}
                      </div>
                    </div>

                    <p className="text-xs text-[#6B5B4B] mt-2 line-clamp-2">
                      {sc.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3">
                    <button
                      onClick={() => startScenarioChat(sc.id, selectedLevel)}
                      className="w-full min-h-[44px] bg-[#B71C1C] hover:bg-[#8F1414] text-white rounded-[10px] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <span>Start Practice Chat</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE CHAT VIEW
  const scenarioEmoji = activeScenario?.emoji || (activeScenario?.id.includes('market') ? '🛒' : activeScenario?.id.includes('bus') ? '🚌' : activeScenario?.id.includes('restaurant') ? '🍛' : activeScenario?.id.includes('hospital') ? '🏥' : '💼');

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300">
      {/* Top Header with Back / New Scenario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsChatActive(false)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#FFF0B3] text-[#B71C1C] border border-[#FFE082] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <ArrowLeft size={15} />
            <span>New scenario</span>
          </button>

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#2B2B2B] flex items-center gap-2">
              <span>{scenarioEmoji}</span>
              <span>{activeScenario?.title || 'Practice Scenario'}</span>
            </h1>
            <p className="text-xs text-[#6B5B4B] flex items-center gap-2 mt-0.5">
              <span className="font-semibold text-[#B71C1C]">{selectedLevel} Level</span>
              <span>•</span>
              <span className="font-kannada">{activeScenario?.vendorRole}</span>
            </p>
          </div>
        </div>

        {/* Restart Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetChat}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF8E1] text-[#6B5B4B] hover:text-[#B71C1C] border border-[#FFE082] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
            title="Start conversation from beginning"
          >
            <RefreshCw size={14} />
            <span>Reset chat</span>
          </button>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-2xl border border-[#FFF0B3] kannada-card-shadow overflow-hidden flex flex-col h-[620px]">
        {/* Scenario Persona Banner */}
        <div className="bg-[#FFF8E1] px-5 py-3 border-b border-[#FFE082] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFC107] text-[#B71C1C] font-bold flex items-center justify-center text-xl border border-[#FFE082] shrink-0">
              {scenarioEmoji}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2B2B2B]">
                {activeScenario?.vendorName}
              </h3>
              <p className="text-xs text-[#6B5B4B] font-kannada">
                {activeScenario?.vendorRole} · <span className="font-sans font-medium text-[#2B2B2B]">{activeScenario?.title}</span>
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] bg-white text-[#6B5B4B] px-2.5 py-1 rounded-full font-medium border border-[#FFE082]">
              💬 Spoken Kannada AI
            </span>
          </div>
        </div>

        {/* Inline Error Message if server error occurs */}
        {errorMessage && (
          <div className="bg-[#FFEBEE] border-b border-[#FFCDD2] p-3 text-xs text-[#B71C1C] flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-[#FFCDD2] rounded text-[#B71C1C]"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#FFFDF7]">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {/* Bot Avatar */}
                {isBot && (
                  <div className="w-8 h-8 rounded-full bg-[#FFC107] text-[#2B2B2B] flex items-center justify-center text-xs font-bold shrink-0 mt-1 border border-[#FFE082]">
                    <Bot size={16} />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  {/* Bubble */}
                  <div
                    className={`rounded-2xl p-4 shadow-xs ${
                      isBot
                        ? 'bg-white border border-[#FFE082] text-[#2B2B2B]'
                        : 'bg-[#B71C1C] text-white'
                    }`}
                  >
                    {/* Kannada Script */}
                    <div
                      className={`font-kannada font-bold leading-snug ${
                        isBot ? 'text-lg text-[#B71C1C]' : 'text-base text-white'
                      }`}
                    >
                      {msg.kannada}
                    </div>

                    {/* Roman Transliteration for Bot */}
                    {isBot && msg.roman && (
                      <div className="text-[13px] font-semibold text-[#2B2B2B] mt-1.5 pt-1.5 border-t border-[#FFF0B3]">
                        {msg.roman}
                      </div>
                    )}

                    {/* English Meaning for Bot */}
                    {isBot && msg.english && (
                      <div className="text-xs text-[#6B5B4B] mt-1">
                        Meaning: {msg.english}
                      </div>
                    )}

                    {/* Timestamp & Listen Button */}
                    <div className="flex items-center justify-between gap-3 mt-2.5 pt-1 border-t border-black/5">
                      <span className={`text-[10px] ${isBot ? 'text-[#6B5B4B]' : 'text-white/70'}`}>
                        {msg.timestamp}
                      </span>

                      {isBot && (
                        <button
                          onClick={() => handleListen(msg.kannada)}
                          className="text-[11px] font-semibold text-[#B71C1C] hover:bg-[#FFF0B3] px-2 py-0.5 rounded flex items-center gap-1 transition-all"
                          title="Listen to pronunciation"
                        >
                          <Volume2 size={13} />
                          <span>Listen</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Soft-yellow box for Correction or Tip if provided by Gemini */}
                  {isBot && (msg.correction || msg.tip) && (
                    <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-3 text-xs space-y-1.5 shadow-2xs">
                      {msg.correction && (
                        <div className="flex items-start gap-1.5 text-[#2B2B2B]">
                          <span className="text-sm shrink-0">✏️</span>
                          <div>
                            <span className="font-bold text-[#B71C1C]">Correction: </span>
                            <span>{msg.correction}</span>
                          </div>
                        </div>
                      )}
                      {msg.tip && (
                        <div className="flex items-start gap-1.5 text-[#6B5B4B]">
                          <span className="text-sm shrink-0">💡</span>
                          <div>
                            <span className="font-bold text-[#2B2B2B]">Tip: </span>
                            <span>{msg.tip}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {!isBot && (
                  <div className="w-8 h-8 rounded-full bg-[#B71C1C] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#6B5B4B] bg-white px-3.5 py-2.5 rounded-xl w-max border border-[#FFE082] shadow-2xs">
              <Sparkles size={14} className="text-[#FFC107] animate-spin" />
              <span>{activeScenario?.vendorName || 'Vendor'} is replying in Kannada...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* AI Hint Pop-up / Drawer */}
        {hint && (
          <div className="px-4 py-3 bg-[#FFF8E1] border-t border-[#FFE082] flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#FFC107] text-[#B71C1C] flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                💡
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#B71C1C]">
                  Suggested what to say next:
                </div>
                <div className="font-kannada font-bold text-base text-[#2B2B2B] mt-0.5">
                  {hint.kannada}
                </div>
                <div className="text-xs font-semibold text-[#6B5B4B]">
                  {hint.roman} · <span className="font-normal italic">"{hint.english}"</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  handleSend(hint.kannada);
                  setHint(null);
                }}
                className="px-3 py-1.5 bg-[#B71C1C] hover:bg-[#8F1414] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Send this
              </button>
              <button
                onClick={() => setHint(null)}
                className="p-1.5 text-[#6B5B4B] hover:text-[#2B2B2B] rounded-lg"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* 3 Starter Suggestion Chips */}
        {activeScenario?.starterSuggestions && activeScenario.starterSuggestions.length > 0 && (
          <div className="px-4 py-2.5 bg-[#FFFDF7] border-t border-[#FFE082] overflow-x-auto flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#6B5B4B] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <span>Suggestions:</span>
            </span>
            {activeScenario.starterSuggestions.slice(0, 3).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.kannada)}
                disabled={isLoading}
                className="shrink-0 text-xs font-semibold bg-white text-[#2B2B2B] hover:bg-[#FFE082] hover:text-[#B71C1C] border border-[#FFE082] px-3 py-1.5 rounded-full transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="font-kannada font-bold">{item.kannada}</span>
                <span className="text-[10px] text-[#6B5B4B]">({item.label})</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar with Hint Button */}
        <div className="p-3 bg-white border-t border-[#FFE082] flex items-center gap-2">
          {/* Hint Button */}
          <button
            onClick={handleGetHint}
            disabled={isLoadingHint || isLoading}
            className="min-h-[44px] px-3 bg-[#FFF8E1] hover:bg-[#FFE082] text-[#B71C1C] border border-[#FFE082] rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-50"
            title="Get an AI suggestion for what to say right now"
          >
            <Lightbulb size={16} className={isLoadingHint ? 'animate-bounce text-[#FFC107]' : ''} />
            <span className="hidden sm:inline">What should I say?</span>
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type in Kannada script, Roman Kannada, or English..."
            disabled={isLoading}
            className="flex-1 min-h-[44px] px-4 rounded-[10px] bg-[#FFF8E1] border border-[#FFE082] text-sm text-[#2B2B2B] placeholder:text-[#6B5B4B]/60 focus:outline-none focus:ring-2 focus:ring-[#B71C1C] disabled:opacity-60"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="min-h-[44px] px-5 bg-[#B71C1C] text-white hover:bg-[#8F1414] disabled:opacity-50 disabled:cursor-not-allowed rounded-[10px] font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <span>Send</span>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
