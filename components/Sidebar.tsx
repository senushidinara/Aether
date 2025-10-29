import React from 'react';
import { Feature } from '../types';
import { AetherLogo } from './icons/AetherLogo';
import { CompassIcon } from './CompassIcon';
import { DashboardIcon } from './icons/DashboardIcon';
import { FrictionAuditIcon } from './icons/FrictionAuditIcon';
import { DecisionMatrixIcon } from './icons/DecisionMatrixIcon';
import { BlackSwanIcon } from './icons/BlackSwanIcon';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
}

const navItems = [
  { feature: Feature.Dashboard, label: 'Dashboard', icon: DashboardIcon },
  { feature: Feature.QuantumGoalEngine, label: 'Quantum Goal Engine', icon: CompassIcon },
  { feature: Feature.FrictionAudit, label: 'Friction Audit', icon: FrictionAuditIcon },
  { feature: Feature.DecisionMatrix, label: 'Decision Matrix', icon: DecisionMatrixIcon },
  { feature: Feature.BlackSwanSimulator, label: 'Black Swan Simulator', icon: BlackSwanIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature }) => {
  const NavItem: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isActive = activeFeature === item.feature;
    return (
      <motion.button
        onClick={() => setActiveFeature(item.feature)}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-300 group relative focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
          isActive
            ? 'text-white'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:shadow-lg hover:shadow-indigo-500/10'
        }`}
        whileTap={{ scale: 0.98 }}
      >
        <item.icon className="h-5 w-5 mr-4 shrink-0" />
        <span className="truncate">{item.label}</span>
        {isActive && (
            <motion.div
                layoutId="active-nav-indicator"
                className="absolute inset-0 bg-indigo-500/10 rounded-lg -z-10"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
        )}
      </motion.button>
    );
  };
  
  return (
    <aside className="hidden md:flex flex-col w-64 glass-card p-4 shrink-0 h-screen">
      <div className="flex items-center mb-8 h-12">
        <motion.div
            animate={{ scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
        >
            <AetherLogo className="h-8 w-8 text-indigo-400" />
        </motion.div>
        <span className="ml-3 text-xl font-semibold text-slate-100">Aether</span>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavItem key={item.feature} item={item} />
        ))}
      </nav>
      <div className="mt-auto">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700 rounded-lg p-4 text-center">
            <h4 className="font-semibold text-white">Upgrade to Aether Pro</h4>
            <p className="text-xs text-slate-400 mt-1">Unlock advanced AI features & integrations.</p>
            <button className="mt-3 w-full bg-indigo-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-indigo-500 transition-colors duration-300 ring-1 ring-indigo-500/50">
                Learn More
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;