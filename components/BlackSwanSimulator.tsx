import React, { useState, useEffect } from 'react';
import { runBlackSwanSimulation } from '../services/geminiService';
import { BotIcon } from './icons/BotIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { BlackSwanSimulationReport } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { Chat } from '@google/genai';
import VigilChat from './VigilChat';
import { motion, AnimatePresence } from 'framer-motion';

interface BlackSwanSimulatorProps {
  setSystemStatus: (status: string) => void;
  initialScenario?: string;
}

type ScenarioTab = 'bestCase' | 'worstCase' | 'mostLikely';

const BlackSwanSimulator: React.FC<BlackSwanSimulatorProps> = ({ setSystemStatus, initialScenario }) => {
  const [scenario, setScenario] = useState<string>('');
  const [report, setReport] = useState<BlackSwanSimulationReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ScenarioTab>('mostLikely');
  const [chat, setChat] = useState<Chat | null>(null);
  
  const formRef = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (initialScenario) {
      setScenario(initialScenario);
      setTimeout(() => formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 50);
    }
  }, [initialScenario]);

  useEffect(() => {
    setSystemStatus(isLoading ? "Simulating future outcomes..." : "Online");
  }, [isLoading, setSystemStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim()) return;

    setIsLoading(true);
    setError(null);
    setReport(null);
    setChat(null);
    setActiveTab('mostLikely');

    try {
      const { report: result, chat: chatSession } = await runBlackSwanSimulation(scenario);
      setReport(result);
      setChat(chatSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: {id: ScenarioTab, label: string, color: string, icon: React.FC<any>}[] = [
      { id: 'bestCase', label: 'Best Case', color: 'border-green-500', icon: CheckIcon },
      { id: 'mostLikely', label: 'Most Likely', color: 'border-blue-500', icon: ArrowRightIcon },
      { id: 'worstCase', label: 'Worst Case', color: 'border-red-500', icon: XIcon },
  ];
  
  const renderReportContent = () => {
      if (!report) return null;
      const data = report[activeTab];
      return (
          <motion.div key={activeTab} initial={{opacity: 0, y:10}} animate={{opacity:1, y:0}} transition={{duration: 0.3}}>
              <p className="text-slate-300">{data.outcome}</p>
              <h5 className="font-semibold text-slate-200 mt-4 mb-2">Leading Indicators to Monitor:</h5>
              <ul className="space-y-2">
                  {data.indicators.map((indicator, i) => (
                      <li key={i} className="flex items-start text-sm text-slate-400">
                         <ArrowRightIcon className="w-4 h-4 mr-3 mt-0.5 text-indigo-400 shrink-0"/>
                         <span>{indicator}</span>
                      </li>
                  ))}
              </ul>
          </motion.div>
      )
  };


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white">"Black Swan" Simulator</h1>
      <p className="mt-2 text-slate-400">Model major choices to understand their ripple effects. Explore the probable futures of your most impactful decisions.</p>
      
      <form onSubmit={handleSubmit} ref={formRef} className="mt-8 glass-card p-6 rounded-lg">
        <label htmlFor="scenario" className="block text-sm font-medium text-slate-300 mb-2">Scenario to Simulate</label>
        <textarea
          id="scenario" value={scenario} onChange={(e) => setScenario(e.target.value)}
          placeholder="e.g., What if I move to another country for 1 year? or What if I launch this product next quarter instead of this one?"
          rows={4}
          className="w-full bg-slate-800/70 border border-slate-700 rounded-md px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit" disabled={isLoading || !scenario.trim()}
          className="mt-4 bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-md hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Run Simulation'}
        </button>
      </form>

      {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-6 bg-red-900/50 border border-red-500/30 text-red-300 p-4 rounded-md">{error}</motion.div>}

      {isLoading && (
         <div className="text-center py-10 px-6 mt-8 glass-card border-2 border-dashed border-slate-700 rounded-lg">
            <LoaderIcon className="w-8 h-8 animate-spin mx-auto text-indigo-400"/>
            <p className="text-slate-400 mt-4">Vigil is simulating future outcomes...</p>
         </div>
      )}

      {report && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-8 glass-card rounded-xl p-6 glow-shadow-indigo">
            <div className="flex items-start space-x-4">
                <div className="bg-indigo-500/20 text-indigo-300 rounded-full p-2 mt-1 shrink-0">
                    <BotIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Vigil's Impact Report</h3>
                    <p className="text-slate-400 text-sm">Probabilistic forecast based on the provided scenario.</p>
                </div>
            </div>
            <div className="mt-6">
                <div className="border-b border-slate-700 flex space-x-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center space-x-2 pb-2 px-1 text-sm font-medium transition-colors ${
                                activeTab === tab.id ? `text-white` : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                           <span>{tab.label}</span>
                           {activeTab === tab.id && (
                                <motion.div className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.color.replace('border-','bg-')}`} layoutId="underline" />
                           )}
                        </button>
                    ))}
                </div>
                <div className="pt-6 min-h-[150px]">
                    <AnimatePresence mode="wait">
                        {renderReportContent()}
                    </AnimatePresence>
                </div>
            </div>
            {chat && <VigilChat chatSession={chat} setSystemStatus={setSystemStatus} />}
        </motion.div>
      )}
    </div>
  );
};

export default BlackSwanSimulator;