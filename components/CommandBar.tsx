import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { routeUserCommand } from '../services/geminiService';
import { CommandBarResult, Feature } from '../types';
import { CommandIcon } from './icons/CommandIcon';
import { LoaderIcon } from './icons/LoaderIcon';

interface CommandBarProps {
    onClose: () => void;
    onExecute: (result: CommandBarResult) => void;
}

const CommandBar: React.FC<CommandBarProps> = ({ onClose, onExecute }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-focus the input when the component mounts
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const result = await routeUserCommand(query);
            onExecute(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: -20 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-full max-w-xl glass-card rounded-xl overflow-hidden shadow-2xl shadow-indigo-900/50"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center p-4 border-b border-slate-700/50">
                        {isLoading ? (
                            <LoaderIcon className="w-5 h-5 text-indigo-400 animate-spin" />
                        ) : (
                            <CommandIcon className="w-5 h-5 text-slate-400" />
                        )}
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tell Vigil what to do... (e.g., new goal to learn React)"
                            className="w-full bg-transparent text-lg text-slate-200 ml-4 placeholder-slate-500 focus:outline-none"
                            disabled={isLoading}
                        />
                    </div>
                </form>
                {error && <div className="text-sm text-red-400 p-4 bg-red-900/30">{error}</div>}
                <div className="p-2 text-xs text-slate-500 bg-slate-900/50 flex justify-between">
                    <span>Quick Actions: "new goal...", "simulate...", "audit...", "decision..."</span>
                    <span><kbd className="font-sans border border-slate-600 rounded px-1.5 py-0.5">esc</kbd> to close</span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CommandBar;
