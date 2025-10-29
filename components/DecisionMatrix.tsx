import React, { useState, useEffect } from 'react';
import { DecisionFactor, DecisionAnalysis } from '../types';
import { analyzeDecision, suggestDecisionFactors } from '../services/geminiService';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { BotIcon } from './icons/BotIcon';
import { Chat } from '@google/genai';
import VigilChat from './VigilChat';
import { motion } from 'framer-motion';


interface DecisionMatrixProps {
  setSystemStatus: (status: string) => void;
  initialDecision?: string;
}


const ScoreMeter: React.FC<{ score: number }> = ({ score }) => {
    const rotation = (score / 100) * 180;
    const color = score > 75 ? 'text-green-400' : score > 50 ? 'text-yellow-400' : 'text-red-400';
    return (
        <div className="relative w-40 h-20 overflow-hidden mx-auto">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-700 rounded-t-full border-b-0"></div>
            <motion.div
                className="absolute top-0 left-0 w-full h-full rounded-t-full border-b-0 border-4 border-transparent"
                initial={{ transform: 'rotate(0deg)' }}
                animate={{ transform: `rotate(${rotation}deg)` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                style={{ transformOrigin: 'bottom center' }}
            >
                 <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full bg-white`}></div>
            </motion.div>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <span className={`text-2xl font-bold ${color}`}>{score}%</span>
                <span className="block text-xs text-slate-400">Confidence</span>
             </div>
        </div>
    );
};


const DecisionMatrix: React.FC<DecisionMatrixProps> = ({ setSystemStatus, initialDecision }) => {
    const [decision, setDecision] = useState<string>('');
    const [factors, setFactors] = useState<DecisionFactor[]>([]);
    const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);

    useEffect(() => {
        if (initialDecision) {
            setDecision(initialDecision);
        }
    }, [initialDecision]);


    useEffect(() => {
        let status = "Online";
        if (isLoading) status = "Analyzing decision...";
        if (isSuggesting) status = "Suggesting factors...";
        setSystemStatus(status);
    }, [isLoading, isSuggesting, setSystemStatus]);


    const addFactor = () => {
        setFactors([...factors, { id: Date.now(), name: '', weight: 5, score: 5 }]);
    };

    const removeFactor = (id: number) => {
        setFactors(factors.filter(f => f.id !== id));
    };

    const updateFactor = <K extends keyof DecisionFactor>(id: number, field: K, value: DecisionFactor[K]) => {
        setFactors(factors.map(f => f.id === id ? { ...f, [field]: value } : f));
    };
    
    const handleSuggestFactors = async () => {
        if (!decision.trim()) return;
        
        setIsSuggesting(true);
        setError(null);
        try {
            const suggested = await suggestDecisionFactors(decision);
            const newFactors = suggested.map(f => ({
                id: Date.now() + Math.random(),
                name: f.name,
                weight: 5,
                score: 5,
            }));
            setFactors(prevFactors => [...prevFactors, ...newFactors]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!decision.trim() || factors.length === 0 || factors.some(f => !f.name.trim())) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        setChat(null);

        try {
            const { analysis: result, chat: chatSession } = await analyzeDecision(decision, factors);
            setAnalysis(result);
            setChat(chatSession);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white">Decision Matrix</h1>
            <p className="mt-2 text-slate-400">Reduce bias and guesswork. Input the factors, Aether provides an objective analysis.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6 glass-card p-6 rounded-lg">
                 <div>
                    <label htmlFor="decision" className="block text-sm font-medium text-slate-300 mb-2">Decision to Make</label>
                    <div className="flex space-x-2">
                        <input
                            id="decision" type="text" value={decision} onChange={(e) => setDecision(e.target.value)}
                            placeholder="e.g., Hire a COO vs. Promote internally"
                            className="w-full bg-slate-800/70 border border-slate-700 rounded-md px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            disabled={isLoading}
                        />
                        <button type="button" onClick={handleSuggestFactors} disabled={isSuggesting || !decision.trim()} className="text-sm bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-md hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0">
                           {isSuggesting ? <LoaderIcon className="w-5 h-5 animate-spin"/> : "Suggest Factors"}
                        </button>
                    </div>
                </div>
                
                <div className="space-y-3">
                     {factors.map((factor, index) => (
                        <div key={factor.id} className="grid grid-cols-12 gap-3 items-center">
                           <div className="col-span-12 sm:col-span-5">
                             {index === 0 && <label className="hidden sm:block text-xs font-medium text-slate-400 mb-1">Factor Name</label>}
                             <input type="text" value={factor.name} onChange={e => updateFactor(factor.id, 'name', e.target.value)} placeholder={`Factor ${index + 1}`} className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                           </div>
                           <div className="col-span-5 sm:col-span-3">
                             {index === 0 && <label className="block text-xs font-medium text-slate-400 mb-1">Weight (1-10)</label>}
                              <input type="number" min="1" max="10" value={factor.weight} onChange={e => updateFactor(factor.id, 'weight', parseInt(e.target.value, 10))} className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                           </div>
                            <div className="col-span-5 sm:col-span-3">
                             {index === 0 && <label className="block text-xs font-medium text-slate-400 mb-1">Score (1-10)</label>}
                              <input type="number" min="1" max="10" value={factor.score} onChange={e => updateFactor(factor.id, 'score', parseInt(e.target.value, 10))} className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                           </div>
                           <div className="col-span-2 sm:col-span-1 flex items-end h-full pb-1 justify-end">
                             <button type="button" onClick={() => removeFactor(factor.id)} className="text-slate-500 hover:text-red-400">
                               <TrashIcon className="w-5 h-5" />
                             </button>
                           </div>
                        </div>
                    ))}
                </div>
                
                 <div>
                    <button type="button" onClick={addFactor} className="flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300">
                        <PlusIcon className="w-4 h-4 mr-2" /> Add Factor
                    </button>
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={isLoading || !decision.trim() || factors.length === 0} className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-md hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                         {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Analyze Decision'}
                    </button>
                </div>
            </form>
            
            {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-6 bg-red-900/50 border border-red-500/30 text-red-300 p-4 rounded-md">{error}</motion.div>}

            {analysis && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-8 glass-card rounded-xl p-6 glow-shadow-indigo">
                    <div className="flex items-start space-x-4">
                        <div className="bg-indigo-500/20 text-indigo-300 rounded-full p-2 mt-1 shrink-0">
                            <BotIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Vigil's Analysis</h3>
                            <p className="text-2xl font-bold text-indigo-300 mt-1">{analysis.recommendation}</p>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-lg p-4">
                           <ScoreMeter score={analysis.confidenceScore} />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <h4 className="font-semibold text-green-400">Pros</h4>
                                <ul className="mt-1 space-y-1 text-sm text-slate-300 list-disc list-inside">
                                    {analysis.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold text-yellow-400">Cons</h4>
                                <ul className="mt-1 space-y-1 text-sm text-slate-300 list-disc list-inside">
                                    {analysis.cons.map((con, i) => <li key={i}>{con}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold text-red-400">Potential Pitfalls</h4>
                                <ul className="mt-1 space-y-1 text-sm text-slate-300 list-disc list-inside">
                                    {analysis.potentialPitfalls.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                     {chat && <VigilChat chatSession={chat} setSystemStatus={setSystemStatus} />}
                </motion.div>
            )}
        </div>
    );
};

export default DecisionMatrix;