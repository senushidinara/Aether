import React, { useState, useEffect } from 'react';
import { LoaderIcon } from './icons/LoaderIcon';

interface SystemStatusProps {
    status: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const isOnline = status === 'Online';
    
    return (
        <footer className="h-8 shrink-0 glass-card border-t border-slate-700/50 flex items-center justify-between px-4 text-xs font-mono">
            <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <span className="text-slate-400">Vigil Status:</span>
                <span className="text-slate-200 truncate max-w-xs">{status}</span>
                { !isOnline && <LoaderIcon className="w-3 h-3 animate-spin text-slate-400" /> }
            </div>
            <div className="text-slate-500">
                Last Sync: {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </footer>
    );
};

export default SystemStatus;
