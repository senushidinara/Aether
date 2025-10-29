import React, { useState, useEffect } from 'react';
import { generateGoalBreakdown } from '../services/geminiService';
import { GoalPlan, Milestone, Task } from '../types';
import { BotIcon } from './icons/BotIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { KeyIcon } from './icons/KeyIcon';
import { PencilIcon } from './icons/PencilIcon';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { WarningIcon } from './icons/WarningIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { Chat } from '@google/genai';
import VigilChat from './VigilChat';
import { motion } from 'framer-motion';

interface QuantumGoalEngineProps {
  setSystemStatus: (status: string) => void;
  initialGoal?: string;
}

const TaskItem: React.FC<{ 
  task: Task;
  editingTask: Task | null;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: <K extends keyof Task>(field: K, value: Task[K]) => void;
}> = ({ task, editingTask, onEdit, onDelete, onSave, onCancel, onUpdate }) => {
  const isEditing = editingTask?.id === task.id;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave();
    if (e.key === 'Escape') onCancel();
  };

  if (isEditing && editingTask) {
    return (
       <li className="bg-slate-900/70 p-3 rounded-md ring-2 ring-indigo-500">
        <input
            type="text"
            value={editingTask.task}
            onChange={(e) => onUpdate('task', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            autoFocus
        />
        <div className="flex items-center space-x-4 mt-2">
            <input
                type="text"
                value={editingTask.duration}
                onChange={(e) => onUpdate('duration', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Duration"
                className="w-24 bg-slate-800 border border-slate-700 rounded-md p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <label className="flex items-center text-xs text-slate-400 cursor-pointer">
                <input
                    type="checkbox"
                    checked={editingTask.isCritical}
                    onChange={(e) => onUpdate('isCritical', e.target.checked)}
                    className="h-4 w-4 bg-transparent border-slate-600 text-indigo-500 focus:ring-indigo-500 rounded-sm cursor-pointer"
                />
                <span className="ml-2">Critical</span>
            </label>
            <div className="flex-grow flex justify-end items-center space-x-2">
                 <button onClick={onSave} className="text-green-400 hover:text-green-300 p-1" aria-label="Save task"><CheckIcon className="w-5 h-5" /></button>
                 <button onClick={onCancel} className="text-slate-400 hover:text-white p-1" aria-label="Cancel edit"><XIcon className="w-5 h-5" /></button>
                 <button onClick={() => onDelete(task.id)} className="text-red-500 hover:text-red-400 p-1" aria-label="Delete task"><TrashIcon className="w-5 h-5" /></button>
            </div>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between p-3 rounded-md hover:bg-slate-800/50 transition-colors duration-200">
      <div className="flex items-center overflow-hidden">
        {task.isCritical ? <KeyIcon className="w-4 h-4 mr-3 text-yellow-400 shrink-0" /> : <div className="w-4 mr-3 shrink-0" />}
        <p className="text-slate-300 text-sm truncate" title={task.task}>{task.task}</p>
        <span className="text-slate-500 text-xs ml-2 shrink-0">({task.duration})</span>
      </div>
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(task)} className="text-slate-400 hover:text-white p-1"><PencilIcon className="w-4 h-4" /></button>
      </div>
    </li>
  );
};
  
const MilestoneItem: React.FC<{ 
  milestone: Milestone; 
  index: number;
  editingTask: Task | null;
  onAddTask: (milestoneName: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onSaveTask: () => void;
  onCancelEdit: () => void;
  onUpdateTask: <K extends keyof Task>(field: K, value: Task[K]) => void;
}> = ({ milestone, index, ...taskProps }) => {
  const [isOpen, setIsOpen] = useState(index < 2);
  const tasksComplete = milestone.tasks.filter(t => t.completed).length;
  const progress = milestone.tasks.length > 0 ? (tasksComplete / milestone.tasks.length) * 100 : 0;
  
  return (
    <motion.div layout className="glass-card rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm mr-4 shrink-0">
            {index + 1}
          </div>
          <h3 className="text-md font-semibold text-white text-left">{milestone.milestone}</h3>
        </div>
        <div className="flex items-center space-x-4">
            <div className="w-24 h-2 bg-slate-700 rounded-full hidden sm:block">
                <motion.div className="h-2 bg-indigo-500 rounded-full" initial={{width:0}} animate={{width: `${progress}%`}} />
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-indigo-300 mb-2 text-sm">Key Results</h4>
              <ul className="space-y-1">
                {milestone.keyResults.map((kr, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-300">
                    <CheckIcon className="w-4 h-4 mr-2 mt-0.5 text-green-400 shrink-0" />
                    <span>{kr}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
                <h4 className="font-semibold text-yellow-300 mb-2 text-sm flex items-center"><WarningIcon className="w-4 h-4 mr-2" />Risk Analysis</h4>
              <div className="text-sm pl-6">
                <strong className="text-slate-400">Obstacles:</strong>
                <ul className="list-disc list-inside text-slate-300 mb-2">
                  {milestone.riskAnalysis.potentialObstacles.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
                <strong className="text-slate-400">Mitigations:</strong>
                <ul className="list-disc list-inside text-slate-300">
                  {milestone.riskAnalysis.mitigationStrategies.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-700/50 pt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-slate-200 text-sm">Tasks</h4>
              <button onClick={() => taskProps.onAddTask(milestone.milestone)} className="flex items-center text-xs font-medium text-indigo-400 hover:text-indigo-300">
                <PlusIcon className="w-3 h-3 mr-1" /> Add Task
              </button>
            </div>
            <ul className="space-y-2">
              {milestone.tasks.map(task => <TaskItem key={task.id} task={task} editingTask={taskProps.editingTask} onEdit={taskProps.onEditTask} onDelete={taskProps.onDeleteTask} onSave={taskProps.onSaveTask} onCancel={taskProps.onCancelEdit} onUpdate={taskProps.onUpdateTask} />)}
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const QuantumGoalEngine: React.FC<QuantumGoalEngineProps> = ({ setSystemStatus, initialGoal }) => {
  const [goal, setGoal] = useState<string>('');
  const [plan, setPlan] = useState<GoalPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [originalTask, setOriginalTask] = useState<Task | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);

  const formRef = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (initialGoal) {
      setGoal(initialGoal);
      // Use a timeout to ensure the state update is rendered before submitting
      setTimeout(() => formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 50);
    }
  }, [initialGoal]);

  useEffect(() => {
    setSystemStatus(isLoading ? "Constructing optimal path..." : "Online");
  }, [isLoading, setSystemStatus]);

  const handleClear = () => {
    setGoal('');
    setPlan(null);
    setError(null);
    setIsLoading(false);
    setEditingTask(null);
    setOriginalTask(null);
    setChat(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsLoading(true);
    setError(null);
    setPlan(null);
    setEditingTask(null);
    setOriginalTask(null);
    setChat(null);

    try {
      const { plan: result, chat: chatSession } = await generateGoalBreakdown(goal);
      const planWithIds: GoalPlan = {
        ...result,
        milestones: result.milestones.map(m => ({
          ...m,
          tasks: m.tasks.map(t => ({
            ...t,
            id: Date.now() + Math.random(),
            completed: false,
          })),
        })),
      };
      setPlan(planWithIds);
      setChat(chatSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateEditingTask = <K extends keyof Task>(field: K, value: Task[K]) => {
    if (editingTask) {
      setEditingTask({ ...editingTask, [field]: value });
    }
  };
  
  const handleSaveEdit = () => {
    if (!editingTask || !plan) return;
    
    const newPlan: GoalPlan = {
      ...plan,
      milestones: plan.milestones.map(m => ({
        ...m,
        tasks: m.tasks.map(t => t.id === editingTask.id ? editingTask : t),
      })),
    };
    setPlan(newPlan);
    setEditingTask(null);
    setOriginalTask(null);
  };

  const handleCancelEdit = () => {
     if (originalTask && originalTask.task.trim() === '' && plan) { // It was a new task
       handleDeleteTask(originalTask.id);
    }
    setEditingTask(null);
    setOriginalTask(null);
  };

  const handleAddTask = (milestoneName: string) => {
    if (!plan || editingTask) return;

    const newTask: Task = {
      id: Date.now() + Math.random(),
      task: '',
      isCritical: false,
      duration: '1 day',
      completed: false,
    };

    const newPlan = {
      ...plan,
      milestones: plan.milestones.map(m => {
        if (m.milestone === milestoneName) {
          return { ...m, tasks: [...m.tasks, newTask] };
        }
        return m;
      }),
    };

    setPlan(newPlan);
    setEditingTask(newTask);
    setOriginalTask(newTask); // Store it in case of cancel
  };

  const handleDeleteTask = (taskId: number) => {
    if (!plan) return;
    const newPlan = {
      ...plan,
      milestones: plan.milestones.map(m => ({
        ...m,
        tasks: m.tasks.filter(t => t.id !== taskId),
      })),
    };
    setPlan(newPlan);
    if(editingTask?.id === taskId) {
        setEditingTask(null);
        setOriginalTask(null);
    }
  };
  
  const handleEditTask = (task: Task) => {
      setOriginalTask(task);
      setEditingTask(task);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white">Quantum Goal Engine</h1>
      <p className="mt-2 text-slate-400">Define your objective. Aether will reverse-engineer the critical path to success.</p>
      
      <form onSubmit={handleSubmit} ref={formRef} className="mt-8 flex items-center space-x-3">
        <input
          type="text" value={goal} onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g., Reach $10M ARR with 30% profit margin by 2027"
          className="flex-1 bg-slate-800/70 border border-slate-700 rounded-md px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit" disabled={isLoading || !goal.trim()}
          className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Generate Plan'}
        </button>
        <button
          type="button" onClick={handleClear} disabled={isLoading}
          className="bg-slate-700 text-slate-300 font-semibold p-2.5 rounded-md hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          aria-label="Clear goal and plan"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </form>

      {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-6 bg-red-900/50 border border-red-500/30 text-red-300 p-4 rounded-md">{error}</motion.div>}

      {isLoading && (
         <div className="text-center py-10 px-6 mt-8 glass-card border-2 border-dashed border-slate-700 rounded-lg">
            <LoaderIcon className="w-8 h-8 animate-spin mx-auto text-indigo-400"/>
            <p className="text-slate-400 mt-4">Vigil is analyzing the goal and constructing the optimal path...</p>
         </div>
      )}

      {plan && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-8">
            <div className="glass-card rounded-xl p-6 flex items-start space-x-4 glow-shadow-indigo">
                <div className="bg-indigo-500/20 text-indigo-300 rounded-full p-2 shrink-0">
                    <BotIcon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Vigil's Analysis: Critical Path Summary</h3>
                    <p className="text-slate-400 mt-1">{plan.criticalPathSummary}</p>
                </div>
            </div>
          
            <div className="mt-6 space-y-6">
              {plan.milestones.map((milestone, i) => 
                <MilestoneItem 
                    key={i} 
                    index={i} 
                    milestone={milestone}
                    editingTask={editingTask}
                    onAddTask={handleAddTask}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onSaveTask={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onUpdateTask={handleUpdateEditingTask}
                />
              )}
            </div>

            {chat && <VigilChat chatSession={chat} setSystemStatus={setSystemStatus} />}
        </motion.div>
      )}

      {!plan && !isLoading && (
         <div className="text-center py-10 px-6 mt-8 glass-card border-2 border-dashed border-slate-700 rounded-lg">
            <p className="text-slate-500">Your generated plan will appear here.</p>
         </div>
      )}
    </div>
  );
};

export default QuantumGoalEngine;