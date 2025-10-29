import { GoogleGenAI, Type, Chat, FunctionDeclaration } from "@google/genai";
import { GoalPlan, DecisionFactor, DecisionAnalysis, Milestone, Task, BlackSwanSimulationReport, FrictionReportItem, Feature, CommandBarResult } from '../types';

const getAIClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set. Please set GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

let ai: GoogleGenAI | null = null;

const initializeAI = () => {
  if (!ai) {
    ai = getAIClient();
  }
  return ai;
};

const VIGIL_PERSONA = "You are Vigil, the AI Chief of Staff for Aether, a Life Operating System. Your communication style is professional, concise, data-driven, and focused on execution and efficiency. You provide clear, actionable intelligence, not motivation. Address the user directly but maintain a formal, advisory tone. Avoid conversational filler, emojis, or overly friendly language. Your goal is to deliver precise, structured JSON output initially, and then engage in helpful, concise conversation when the user asks follow-up questions.";

// This represents the structure returned by the API, before we add client-side IDs.
type ApiTask = Omit<Task, 'id' | 'completed' | 'strategicAlignment'>;
type ApiMilestone = Omit<Milestone, 'tasks'> & { tasks: ApiTask[] };
type ApiGoalPlan = Omit<GoalPlan, 'milestones'> & { milestones: ApiMilestone[] };


const createChat = (initialPrompt: string): Chat => {
    const aiClient = initializeAI();
    return aiClient.chats.create({
        model: "gemini-2.5-pro",
        config: { systemInstruction: VIGIL_PERSONA },
        history: [{ role: 'user', parts: [{ text: initialPrompt }] }]
    });
};

export const startChatAndStreamResponse = async (chat: Chat, onChunk: (text: string) => void) => {
    const response = await chat.sendMessageStream({ message: "" }); // Send empty message to trigger response from history
    for await (const chunk of response) {
        onChunk(chunk.text);
    }
};

export const continueChatStream = async (chat: Chat, message: string, onChunk: (text: string) => void) => {
    const response = await chat.sendMessageStream({ message });
    for await (const chunk of response) {
        onChunk(chunk.text);
    }
};

const navigationTools: FunctionDeclaration[] = [
    {
        name: 'navigateToDashboard',
        description: 'Navigates the user to their main dashboard view.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'navigateToGoalEngine',
        description: 'Opens the Quantum Goal Engine. If the user specifies a goal, extract it.',
        parameters: { type: Type.OBJECT, properties: { goal: { type: Type.STRING, description: 'The user\'s stated goal, if any.' } } },
    },
    {
        name: 'startFrictionAudit',
        description: 'Opens the Friction Audit feature. If the user mentions a specific workflow to analyze, extract it.',
        parameters: { type: Type.OBJECT, properties: { workflow: { type: Type.STRING, description: 'The user\'s workflow description, if any.' } } },
    },
    {
        name: 'startDecisionMatrix',
        description: 'Opens the Decision Matrix. If the user states a decision they need to make, extract it.',
        parameters: { type: Type.OBJECT, properties: { decision: { type: Type.STRING, description: 'The user\'s decision to analyze, if any.' } } },
    },
    {
        name: 'startBlackSwanSimulation',
        description: 'Opens the Black Swan Simulator. If the user provides a scenario to simulate, extract it.',
        parameters: { type: Type.OBJECT, properties: { scenario: { type: Type.STRING, description: 'The "what if" scenario to simulate, if any.' } } },
    },
];

export const routeUserCommand = async (command: string): Promise<CommandBarResult> => {
    try {
        const aiClient = initializeAI();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `User command: "${command}"`,
            config: {
                systemInstruction: "You are the routing engine for the Aether application. Your only job is to analyze the user's command and call the appropriate navigation function. Do not respond with text. Only call a function.",
                tools: [{ functionDeclarations: navigationTools }]
            }
        });
        
        const call = response.functionCalls?.[0];
        if (!call) {
            // Fallback if no function is called
            return { feature: Feature.Dashboard };
        }

        switch (call.name) {
            case 'navigateToDashboard':
                return { feature: Feature.Dashboard };
            case 'navigateToGoalEngine':
                // FIX: Cast unknown to string as we expect the API to return a string.
                return { feature: Feature.QuantumGoalEngine, initialData: call.args.goal as string };
            case 'startFrictionAudit':
                // FIX: Cast unknown to string as we expect the API to return a string.
                return { feature: Feature.FrictionAudit, initialData: call.args.workflow as string };
            case 'startDecisionMatrix':
                // FIX: Cast unknown to string as we expect the API to return a string.
                return { feature: Feature.DecisionMatrix, initialData: call.args.decision as string };
            case 'startBlackSwanSimulation':
                // FIX: Cast unknown to string as we expect the API to return a string.
                return { feature: Feature.BlackSwanSimulator, initialData: call.args.scenario as string };
            default:
                return { feature: Feature.Dashboard };
        }
    } catch (error) {
        console.error("Error routing user command:", error);
        throw new Error("Vigil could not understand the command.");
    }
};


export const generateGoalBreakdown = async (goal: string): Promise<{ plan: ApiGoalPlan; chat: Chat }> => {
  const prompt = `Reverse-engineer this goal into a detailed plan: "${goal}". For each milestone, provide key results, specific tasks, and a risk analysis identifying potential obstacles and mitigation strategies. Mark tasks on the critical path. Respond with ONLY the JSON object.`;
  const chat = createChat(prompt);

  try {
    const aiClient = initializeAI();
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-pro", contents: prompt,
      config: {
        systemInstruction: VIGIL_PERSONA,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goal: { type: Type.STRING },
            criticalPathSummary: { type: Type.STRING },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  milestone: { type: Type.STRING },
                  keyResults: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        task: { type: Type.STRING },
                        isCritical: { type: Type.BOOLEAN },
                        duration: { type: Type.STRING },
                      },
                      required: ["task", "isCritical", "duration"],
                    },
                  },
                  riskAnalysis: {
                    type: Type.OBJECT,
                    properties: {
                      potentialObstacles: { type: Type.ARRAY, items: { type: Type.STRING } },
                      mitigationStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["potentialObstacles", "mitigationStrategies"],
                  },
                },
                required: ["milestone", "keyResults", "tasks", "riskAnalysis"],
              },
            },
          },
          required: ["goal", "criticalPathSummary", "milestones"],
        },
      },
    });
    const parsedResponse = JSON.parse(response.text);
    return { plan: parsedResponse as ApiGoalPlan, chat };
  } catch (error) {
    console.error("Error generating goal breakdown:", error);
    throw new Error("Failed to generate goal breakdown from AI.");
  }
};

export const analyzeDecision = async (decision: string, factors: DecisionFactor[]): Promise<{ analysis: DecisionAnalysis; chat: Chat }> => {
    const prompt = `Analyze the following decision: "${decision}" based on these weighted factors: ${JSON.stringify(factors)}. Provide a clear recommendation, a confidence score (0-100), and detailed lists of pros, cons, and potential pitfalls. Respond with ONLY the JSON object.`;
    const chat = createChat(prompt);
    try {
        const aiClient = initializeAI();
        const response = await aiClient.models.generateContent({
             model: "gemini-2.5-pro", contents: prompt,
            config: {
                systemInstruction: VIGIL_PERSONA,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    recommendation: { type: Type.STRING },
                    confidenceScore: { type: Type.INTEGER },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    potentialPitfalls: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["recommendation", "confidenceScore", "pros", "cons", "potentialPitfalls"],
                }
            }
        });
        const parsedResponse = JSON.parse(response.text);
        return { analysis: parsedResponse as DecisionAnalysis, chat };
    } catch (error) {
        console.error("Error analyzing decision:", error);
        throw new Error("Failed to analyze decision with AI.");
    }
};


export const runBlackSwanSimulation = async (scenario: string): Promise<{ report: BlackSwanSimulationReport; chat: Chat }> => {
    const prompt = `Run a "Black Swan" simulation for this scenario: "${scenario}". Analyze ripple effects across finances, work, health, and relationships. Provide a detailed report with Best Case, Worst Case, and Most Likely outcomes. For each outcome, provide a summary and 3-4 leading indicators to monitor. Respond with ONLY the JSON object.`;
    const chat = createChat(prompt);
    try {
        const aiClient = initializeAI();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-pro", contents: prompt,
            config: {
                systemInstruction: VIGIL_PERSONA,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    bestCase: {
                      type: Type.OBJECT,
                      properties: {
                        outcome: { type: Type.STRING },
                        indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ["outcome", "indicators"],
                    },
                    worstCase: {
                      type: Type.OBJECT,
                      properties: {
                        outcome: { type: Type.STRING },
                        indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ["outcome", "indicators"],
                    },
                    mostLikely: {
                      type: Type.OBJECT,
                      properties: {
                        outcome: { type: Type.STRING },
                        indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ["outcome", "indicators"],
                    },
                  },
                  required: ["bestCase", "worstCase", "mostLikely"],
                }
            }
        });
        const parsedResponse = JSON.parse(response.text);
        return { report: parsedResponse as BlackSwanSimulationReport, chat };
    } catch (error) {
        console.error("Error running simulation:", error);
        throw new Error("Failed to run simulation with AI.");
    }
};

export const generateDailyTasks = async (objective: string, existingPlan?: GoalPlan): Promise<{tasks: Omit<Task, 'id' | 'duration' | 'completed'>[], insight: string}> => {
    let taskPrompt = `Objective: "${objective}". Generate 3-4 high-impact tasks for today. For each task, provide its strategic alignment explaining WHY it supports the objective. Mark the most important task as critical.`;
    if (existingPlan) {
        taskPrompt += `\nConsider the user's long-term goal: "${existingPlan.goal}". Are there any critical tasks from that plan that should be prioritized today?`
    }

    try {
        const aiClient = initializeAI();
        const [tasksResponse, insightResponse] = await Promise.all([
             aiClient.models.generateContent({
                model: "gemini-2.5-flash", contents: taskPrompt,
                config: {
                    systemInstruction: VIGIL_PERSONA,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            tasks: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        task: { type: Type.STRING }, isCritical: { type: Type.BOOLEAN }, strategicAlignment: { type: Type.STRING }
                                    }, required: ["task", "isCritical", "strategicAlignment"]
                                }
                            }
                        }, required: ["tasks"]
                    }
                }
            }),
             aiClient.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Based on the daily objective "${objective}", provide one concise, strategic insight or question to maintain focus. Max 2 sentences.`,
                config: { systemInstruction: VIGIL_PERSONA }
            })
        ]);
        
        const parsedTasks = JSON.parse(tasksResponse.text);
        return {tasks: parsedTasks.tasks, insight: insightResponse.text.trim() };
    } catch (error) {
        console.error("Error generating daily briefing:", error);
        throw new Error("Failed to generate daily briefing from AI.");
    }
};

export const generateFrictionAuditReport = async (userInput: string): Promise<{ report: FrictionReportItem[]; chat: Chat }> => {
    const prompt = `Analyze the user's workflow: "${userInput}". Identify 3-4 high-impact inefficiencies. For each, provide a concise analysis, a concrete recommendation, and score its Impact and Effort on a scale of 1-10 (where 10 is highest). Respond with ONLY the JSON object.`;
    const chat = createChat(prompt);
    try {
        const aiClient = initializeAI();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-pro", contents: prompt,
            config: {
                systemInstruction: VIGIL_PERSONA,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: { report: { type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: {
                            inefficiency: { type: Type.STRING }, analysis: { type: Type.STRING }, recommendation: { type: Type.STRING },
                            impact: { type: Type.INTEGER }, effort: { type: Type.INTEGER }
                        }, required: ["inefficiency", "analysis", "recommendation", "impact", "effort"]
                    }}}, required: ["report"]
                }
            }
        });
        const parsedResponse = JSON.parse(response.text);
        return { report: parsedResponse.report as FrictionReportItem[], chat };
    } catch (error) {
        console.error("Error generating friction audit:", error);
        throw new Error("Failed to generate friction audit from AI.");
    }
};

export const suggestDecisionFactors = async (decision: string): Promise<{name: string}[]> => {
    const prompt = `For the decision "${decision}", suggest 5-7 relevant factors to consider. Examples: financial cost, time investment, strategic alignment, potential ROI, team morale. Respond with ONLY the JSON object.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: {
                systemInstruction: VIGIL_PERSONA,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: { factors: { type: Type.ARRAY, items: {
                        type: Type.OBJECT, properties: { name: { type: Type.STRING }}, required: ["name"]
                    }}}, required: ["factors"]
                }
            }
        });
        const parsedResponse = JSON.parse(response.text);
        return parsedResponse.factors;
    } catch (error) {
        console.error("Error suggesting decision factors:", error);
        throw new Error("Failed to suggest decision factors from AI.");
    }
};
