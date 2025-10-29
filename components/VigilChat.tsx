import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { ChatMessage } from '../types';
import { continueChatStream } from '../services/geminiService';
import { LoaderIcon } from './icons/LoaderIcon';
import { BotIcon } from './icons/BotIcon';
import { motion, AnimatePresence } from 'framer-motion';

interface VigilChatProps {
    chatSession: Chat;
    setSystemStatus: (status: string) => void;
}

const VigilChat: React.FC<VigilChatProps> = ({ chatSession, setSystemStatus }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        setSystemStatus(isLoading ? "Vigil is typing..." : "Online");
    }, [isLoading, setSystemStatus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        const newModelMessage: ChatMessage = { role: 'model', text: '' };
        setMessages(prev => [...prev, newModelMessage]);

        try {
            await continueChatStream(chatSession, input, (chunk) => {
                setMessages(prev => prev.map((msg, index) => 
                    index === prev.length - 1 ? { ...msg, text: msg.text + chunk } : msg
                ));
            });
        } catch (error) {
            console.error("Chat error:", error);
             setMessages(prev => prev.map((msg, index) => 
                index === prev.length - 1 ? { ...msg, text: "Sorry, I encountered an error." } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} transition={{delay: 0.5}} className="mt-6 border-t border-slate-700/50 pt-6">
            <h4 className="text-base font-semibold text-slate-200 mb-4 flex items-center">
                <BotIcon className="w-5 h-5 mr-2 text-indigo-400" />
                Refine with Vigil
            </h4>
            <div className="glass-card rounded-lg p-4 max-h-80 flex flex-col">
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                     <AnimatePresence>
                        {messages.map((msg, index) => (
                            <motion.div 
                                key={index}
                                layout
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <BotIcon className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />}
                                <div className={`px-4 py-2 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}{isLoading && msg.role === 'model' && index === messages.length -1 ? '...' : ''}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSubmit} className="mt-4 flex items-center space-x-2 border-t border-slate-700 pt-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a follow-up question..."
                        className="flex-1 bg-slate-800/70 border border-slate-700 rounded-md px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="bg-indigo-600 text-white font-semibold p-2 rounded-md hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors">
                        {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 3.105a.75.75 0 011.06 0L10 8.94l5.835-5.836a.75.75 0 011.06 1.06L11.06 10l5.835 5.835a.75.75 0 01-1.06 1.06L10 11.06l-5.835 5.835a.75.75 0 01-1.06-1.06L8.94 10 3.105 4.165a.75.75 0 010-1.06z" clipRule="evenodd" transform="rotate(45 10 10)" /></svg>
                        }
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default VigilChat;
