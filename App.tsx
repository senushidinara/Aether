import React, { useState, useEffect, useCallback } from 'react';
import { CommandBarResult, Feature } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuantumGoalEngine from './components/QuantumGoalEngine';
import FrictionAudit from './components/FrictionAudit';
import DecisionMatrix from './components/DecisionMatrix';
import BlackSwanSimulator from './components/BlackSwanSimulator';
import { AetherLogo } from './components/icons/AetherLogo';
import { AnimatePresence, motion } from 'framer-motion';
import SystemStatus from './components/SystemStatus';
import CommandBar from './components/CommandBar';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>(Feature.Dashboard);
  const [systemStatus, setSystemStatus] = useState<string>("Online");
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [commandBarInitialData, setCommandBarInitialData] = useState<string | undefined>(undefined);

  const handleCommandBarAction = (result: CommandBarResult) => {
    setActiveFeature(result.feature);
    setCommandBarInitialData(result.initialData);
    setIsCommandBarOpen(false);
  };
  
  // Reset initial data after feature switch to prevent re-triggering
  useEffect(() => {
    if (commandBarInitialData) {
      const timer = setTimeout(() => setCommandBarInitialData(undefined), 50);
      return () => clearTimeout(timer);
    }
  }, [activeFeature, commandBarInitialData]);


  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      setIsCommandBarOpen(open => !open);
    }
    if (event.key === 'Escape') {
      setIsCommandBarOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


  const renderFeature = () => {
    switch (activeFeature) {
      case Feature.QuantumGoalEngine:
        return <QuantumGoalEngine setSystemStatus={setSystemStatus} initialGoal={commandBarInitialData} />;
      case Feature.FrictionAudit:
        return <FrictionAudit setSystemStatus={setSystemStatus} initialInput={commandBarInitialData} />;
      case Feature.DecisionMatrix:
        return <DecisionMatrix setSystemStatus={setSystemStatus} initialDecision={commandBarInitialData} />;
      case Feature.BlackSwanSimulator:
        return <BlackSwanSimulator setSystemStatus={setSystemStatus} initialScenario={commandBarInitialData} />;
      case Feature.Dashboard:
      default:
        return <Dashboard setSystemStatus={setSystemStatus} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-transparent text-slate-300 font-sans">
      <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
         <header className="flex md:hidden items-center p-4 border-b border-slate-700/50 h-16 shrink-0 glass-card z-10">
            <AetherLogo className="h-8 w-8 text-indigo-400" />
            <span className="ml-3 text-xl font-semibold text-slate-100">Aether</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {renderFeature()}
            </motion.div>
          </AnimatePresence>
        </div>
        <SystemStatus status={systemStatus} />
      </main>
      <AnimatePresence>
        {isCommandBarOpen && <CommandBar onClose={() => setIsCommandBarOpen(false)} onExecute={handleCommandBarAction} />}
      </AnimatePresence>
    </div>
  );
};

export default App;