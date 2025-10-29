import React, { useState, useEffect } from 'react';
import { LoaderIcon } from './icons/LoaderIcon';
import { BotIcon } from './icons/BotIcon';
import { generateFrictionAuditReport } from '../services/geminiService';
import { FrictionReportItem } from '../types';
import { Chat } from '@google/genai';
import VigilChat from './VigilChat';
import { motion } from 'framer-motion';

interface FrictionAuditProps {
    setSystemStatus: (status: string) => void;
    initialInput?: string;
}

const FrictionAudit: React.FC<FrictionAuditProps> = ({ setSystemStatus, initialInput }) => {
    const [userInput, setUserInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [auditResult, setAuditResult] = useState<FrictionReportItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    
    const formRef = React.useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (initialInput) {
            setUserInput(initialInput);
            setTimeout(() => formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 50);
        }
    }, [initialInput]);

     useEffect(() => {
        setSystemStatus(isScanning ? "Analyzing workflow for inefficiencies..." : "Online");
    }, [isScanning, setSystemStatus]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        setIsScanning(true);
        setAuditResult([]);
        setError(null);
        setChat(null);

        try {
            const { report, chat: chatSession } = await generateFrictionAuditReport(userInput);
            setAuditResult(report);
            setChat(chatSession);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsScanning(false);
        }
    };
    
    const quadrantLabels: { [key: string]: { label: string, color: string, description: string } } = {
        'q1': { label: 'Quick Wins', color: 'text-green-400', description: 'High Impact, Low Effort. Prioritize these.'},
        'q2': { label: 'Major Projects', color: 'text-blue-400', description: 'High Impact, High Effort. Plan carefully.'},
        'q3': { label: 'Fill-ins', color: 'text-yellow-400', description: 'Low Impact, Low Effort. Do when time permits.'},
        'q4': { label: 'Reconsider', color: 'text-red-400', description: 'Low Impact, High Effort. Avoid or delegate.'},
    };

    const getQuadrant = (impact: number, effort: number): keyof typeof quadrantLabels => {
        if (impact >= 6 && effort <= 5) return 'q1';
        if (impact >= 6 && effort > 5) return 'q2';
        if (impact < 6 && effort <= 5) return 'q3';
        return 'q4';
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white">Friction Audit</h1>
            <p className="mt-2 text-slate-400">Identify and eliminate energy drains. Describe your workflow to generate an actionable impact/effort analysis.</p>
            
            <form onSubmit={handleScan} ref={formRef} className="mt-8 glass-card p-6 rounded-lg">
                <label htmlFor="userInput" className="block text-sm font-medium text-slate-300 mb-2">Describe your typical workflow or pain points</label>
                <textarea
                    id="userInput" value={userInput} onChange={(e) => setUserInput(e.target.value)}
                    placeholder="e.g., I spend mornings answering repetitive emails and afternoons are filled with back-to-back meetings, leaving no time for deep work."
                    rows={4}
                    className="w-full bg-slate-800/70 border border-slate-700 rounded-md px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isScanning}
                />
                <button
                    type="submit" disabled={isScanning || !userInput.trim()}
                    className="mt-4 bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-md hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                     {isScanning ? (
                        <>
                            <LoaderIcon className="w-5 h-5 mr-3 animate-spin" />
                            Analyzing...
                        </>
                    ) : 'Generate Audit'}
                </button>
            </form>

            {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-6 bg-red-900/50 border border-red-500/30 text-red-300 p-4 rounded-md">{error}</motion.div>}
            
            {isScanning && (
                 <div className="text-center py-10 px-6 mt-8 glass-card border-2 border-dashed border-slate-700 rounded-lg">
                    <LoaderIcon className="w-8 h-8 animate-spin mx-auto text-indigo-400"/>
                    <p className="text-slate-400 mt-4">Vigil is analyzing your workflow for inefficiencies...</p>
                 </div>
            )}

            {auditResult.length > 0 && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-8">
                    <div className="glass-card rounded-xl p-6 flex items-start space-x-4 glow-shadow-indigo mb-6">
                        <div className="bg-indigo-500/20 text-indigo-300 rounded-full p-2 mt-1 shrink-0">
                            <BotIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Vigil's Friction Report</h3>
                            <p className="text-slate-400 mt-1">Analysis complete. The following inefficiencies have been identified and prioritized based on impact and effort.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(quadrantLabels).map(([key, {label, color, description}]) => {
                            const items = auditResult.filter(item => getQuadrant(item.impact, item.effort) === key);
                            return (
                                <motion.div key={key} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2 + (parseInt(key.slice(1)) * 0.1)}} className="glass-card rounded-lg p-4">
                                    <h4 className={`font-bold text-lg ${color}`}>{label}</h4>
                                    <p className="text-xs text-slate-400 mb-4">{description}</p>
                                    {items.length > 0 ? (
                                        <div className="space-y-3">
                                            {items.map((item, index) => (
                                                <div key={index} className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
                                                    <p className="font-semibold text-slate-200">{item.inefficiency}</p>
                                                    <p className="text-xs text-slate-400 mt-1">{item.recommendation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 text-center py-4">No items in this quadrant.</p>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                     {chat && <VigilChat chatSession={chat} setSystemStatus={setSystemStatus} />}
                </motion.div>
            )}
        </div>
    );
};

export default FrictionAudit;