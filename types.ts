export enum Feature {
  Dashboard = 'Dashboard',
  QuantumGoalEngine = 'QuantumGoalEngine',
  FrictionAudit = 'FrictionAudit',
  DecisionMatrix = 'DecisionMatrix',
  BlackSwanSimulator = 'BlackSwanSimulator',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Task {
  id: number;
  task: string;
  isCritical: boolean;
  duration?: string;
  strategicAlignment?: string; // For Dashboard
  completed?: boolean; // For Dashboard
}

export interface Milestone {
  milestone: string;
  keyResults: string[];
  tasks: Task[];
  riskAnalysis: {
    potentialObstacles: string[];
    mitigationStrategies: string[];
  };
}

export interface GoalPlan {
  goal: string;
  criticalPathSummary: string;
  milestones: Milestone[];
}

export interface DecisionFactor {
  id: number;
  name: string;
  weight: number; // 1-10
  score: number; // 1-10
}

export interface DecisionAnalysis {
  recommendation: string;
  confidenceScore: number;
  pros: string[];
  cons: string[];
  potentialPitfalls: string[];
}

export interface BlackSwanSimulationReport {
    bestCase: {
        outcome: string;
        indicators: string[];
    };
    worstCase: {
        outcome: string;
        indicators: string[];
    };
    mostLikely: {
        outcome: string;
        indicators: string[];
    };
}

export interface FrictionReportItem {
    inefficiency: string;
    analysis: string;
    recommendation: string;
    impact: number; // 1-10
    effort: number; // 1-10
}

export interface CommandBarResult {
    feature: Feature;
    initialData?: string;
}
