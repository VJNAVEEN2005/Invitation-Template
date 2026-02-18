import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, X, ChevronRight, Zap } from 'lucide-react';

const AiChat = ({ 
    messages = [], 
    onSendMessage, 
    isGenerating = false, 
    onClose,
    selectedModel = 'gemini-2.0-flash',
    onModelChange,
    availableModels = []
}) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isGenerating]);

    useEffect(() => {
        if (!isGenerating) {
            inputRef.current?.focus();
        }
    }, [isGenerating]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || isGenerating) return;
        
        onSendMessage(input);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-orange-100 flex justify-between items-center bg-orange-50/50 flex-shrink-0">
                <div className="flex items-center gap-2 text-[var(--color-accent)]">
                    <Sparkles size={18} className="animate-pulse" />
                    <h3 className="font-serif font-bold text-lg text-[var(--color-dark)]">Ask Gemini</h3>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <div className="relative group">
                        <select 
                            value={selectedModel}
                            onChange={(e) => onModelChange && onModelChange(e.target.value)}
                            className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold py-1.5 pl-3 pr-8 rounded-lg outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-orange-200 transition-all cursor-pointer hover:border-orange-200"
                        >
                            {availableModels.map(model => (
                                <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                        </select>
                        <ChevronRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-orange-100 rounded-full text-slate-400 hover:text-[var(--color-accent)] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6 opacity-60">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                            <Sparkles size={32} className="text-orange-300" />
                        </div>
                        <h4 className="font-bold text-slate-700 mb-2">How can I help you design?</h4>
                        <p className="text-sm text-slate-400">Try asking to change colors, add sections, or modify text.</p>
                        
                        <div className="mt-8 space-y-2 w-full">
                            <button 
                                onClick={() => onSendMessage("Change the background color to soft peach")}
                                className="w-full p-3 text-left text-xs bg-slate-50 hover:bg-orange-50 rounded-xl border border-slate-100 hover:border-orange-200 transition-colors text-slate-600 truncate"
                            >
                                "Change background to soft peach"
                            </button>
                            <button 
                                onClick={() => onSendMessage("Make the headline font larger and bold")}
                                className="w-full p-3 text-left text-xs bg-slate-50 hover:bg-orange-50 rounded-xl border border-slate-100 hover:border-orange-200 transition-colors text-slate-600 truncate"
                            >
                                "Make headline larger and bold"
                            </button>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-1">
                                <Sparkles size={14} />
                            </div>
                        )}
                        
                        <div 
                            className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-[var(--color-accent)] text-white rounded-tr-none' 
                                : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
                            }`}
                        >
                            {msg.text}
                        </div>

                        {msg.role === 'user' && (
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400 mt-1">
                                <User size={14} />
                             </div>
                        )}
                    </div>
                ))}

                {isGenerating && (
                    <div className="flex gap-3 justify-start">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-1">
                            <Sparkles size={14} className="animate-spin" />
                        </div>
                        <div className="bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-[var(--color-accent)] transition-all shadow-sm">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your changes..."
                        className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 resize-none max-h-32 py-2 px-2 custom-scrollbar"
                        rows={1}
                        style={{ minHeight: '40px' }}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isGenerating}
                        className={`p-2 rounded-lg transition-all ${
                            input.trim() && !isGenerating
                            ? 'bg-[var(--color-accent)] text-white shadow-md hover:scale-105 active:scale-95'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 mt-2 flex justify-center items-center gap-1">
                    Powered by <Zap size={10} className="text-orange-400" /> Gemini Pro
                </div>
            </div>
        </div>
    );
};

export default AiChat;
