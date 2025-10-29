import React, { useState, useEffect } from 'react';
import { BotIcon } from './icons/BotIcon';
import { KeyIcon } from './icons/KeyIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { Task } from '../types';
import { generateDailyTasks } from '../services/geminiService';
import { InfoIcon } from './icons/InfoIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from './icons/SparklesIcon';
import { TargetIcon } from './icons/TargetIcon';

interface DashboardProps {
  setSystemStatus: (status: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setSystemStatus }) => {
    const [objective, setObjective] = useState('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [insight, setInsight] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusMode, setFocusMode] = useState(false);

    useEffect(() => {
        setSystemStatus(isLoading ? `Generating plan for: ${objective}` : 'Online');
    }, [isLoading, objective, setSystemStatus]);

    const completedTasks = tasks.filter(t => t.completed).length;
    const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!objective.trim()) return;

        setIsLoading(true);
        setError(null);
        setTasks([]);
        setInsight('');
        try {
            const { tasks: tasksResult, insight: insightResult } = await generateDailyTasks(objective);
            
            const tasksWithIds = tasksResult.map(t => ({
                ...t,
                id: Date.now() + Math.random(),
                completed: false,
            }));
            setTasks(tasksWithIds);
            setInsight(insightResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };
    
  return (
    <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
             <div className="glass-card rounded-xl p-6 flex items-start space-x-4 glow-shadow-indigo">
                <div className="bg-indigo-500/20 text-indigo-300 rounded-full p-2 shrink-0">
                    <BotIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">Vigil's Morning Briefing</h2>
                    <p className="text-slate-400 mt-1">
                        Good morning. Define your primary objective for today to generate a focused action plan.
                    </p>
                </div>
            </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <form onSubmit={handleSubmit} className="mt-6">
                 <label htmlFor="objective" className="block text-sm font-medium text-slate-300 mb-2">Primary Objective</label>
                 <div className="flex items-center space-x-3">
                    <input
                        id="objective" type="text" value={objective} onChange={(e) => setObjective(e.target.value)}
                        placeholder="e.g., Secure funding for Series A"
                        className="flex-1 bg-slate-800/70 border border-slate-700 rounded-md px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        disabled={isLoading}
                    />
                     <button
                        type="submit" disabled={isLoading || !objective.trim()}
                        className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                        {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Generate'}
                    </button>
                 </div>
            </form>
        </motion.div>


        {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-4 bg-red-900/50 border border-red-500/30 text-red-300 p-3 rounded-md text-sm">{error}</motion.div>}

        <div className="mt-8">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Today's Action Plan</h3>
                {tasks.length > 0 && (
                     <label className="flex items-center cursor-pointer">
                        <span className="text-sm text-slate-400 mr-2">Focus Mode</span>
                        <div className="relative">
                            <input type="checkbox" checked={focusMode} onChange={() => setFocusMode(!focusMode)} className="sr-only" />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${focusMode ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${focusMode ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                )}
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div className="lg:col-span-2" layout>
                    {tasks.length > 0 ? (
                        <motion.div layout className="space-y-3">
                             <AnimatePresence>
                                {tasks.map(task => (
                                    <motion.div key={task.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{duration: 0.3}} className={`glass-card rounded-lg p-4 flex items-center justify-between hover:border-slate-600 transition-all duration-300 ${task.completed ? 'opacity-50' : ''}`}>
                                        <div className="flex items-center">
                                            <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} className="h-5 w-5 bg-transparent border-slate-600 text-indigo-500 focus:ring-indigo-500 rounded-sm cursor-pointer" />
                                            <p className={`ml-4 text-slate-300 ${task.completed ? 'line-through' : ''}`}>{task.task}</p>
                                            
                                            <div className="group relative ml-2">
                                                <InfoIcon className="w-4 h-4 text-slate-500" />
                                                <div className="absolute bottom-full mb-2 w-64 p-2 bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    <strong className="font-semibold text-indigo-400">Alignment:</strong> {task.strategicAlignment}
                                                </div>
                                            </div>
                                        </div>
                                        {task.isCritical && (
                                            <div className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
                                              <KeyIcon className="w-3 h-3 mr-1.5"/> Critical
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                         <div className="text-center py-10 px-6 glass-card border-2 border-dashed border-slate-700 rounded-lg">
                            <p className="text-slate-500">Your generated action plan will appear here.</p>
                        </div>
                    )}
                </motion.div>
                <AnimatePresence>
                {!focusMode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{duration: 0.5}} className="space-y-6">
                       <motion.div layout>
                           <h3 className="text-xl font-bold text-white mb-4">Focus Momentum</h3>
                           <div className="glass-card rounded-lg p-6 flex flex-col items-center justify-center">
                                <div className="relative w-32 h-32">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                        <path className="text-slate-700" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <motion.path initial={{strokeDasharray: "0, 100"}} animate={{strokeDasharray: `${progress}, 100`}} transition={{duration: 1, ease: "circOut"}} className="text-indigo-500" strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-white">{Math.round(progress)}%</span>
                                        <span className="text-xs text-slate-400">Complete</span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 mt-4">{completedTasks} of {tasks.length} tasks done</p>
                           </div>
                        </motion.div>
                         <motion.div layout>
                           <h3 className="text-xl font-bold text-white mb-4">Vigil's Insight</h3>
                            <div className="glass-card rounded-lg p-6">
                                {insight ? (
                                     <div className="flex items-start space-x-3">
                                        <LightbulbIcon className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                                        <p className="text-sm text-slate-300">{insight}</p>
                                    </div>
                                ) : (
                                     <p className="text-sm text-center text-slate-500">Insight will appear here.</p>
                                )}
                           </div>
                        </motion.div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;