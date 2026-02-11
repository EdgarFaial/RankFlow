import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskBreakdown, RankingAudit } from "../types";

export const getTaskBreakdown = async (title: string, description: string): Promise<TaskBreakdown | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const prompt = `Break down the following task into clear actionable subtasks and provide reasoning for the approach. 
  Task: ${title}
  Context: ${description}
  Return a structured JSON with 'subtasks' (array of strings) and 'reasoning' (string).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable steps."
            },
            reasoning: {
              type: Type.STRING,
              description: "Strategic reason for this breakdown."
            }
          },
          required: ["subtasks", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text || "null") as TaskBreakdown;
  } catch (error) {
    console.error("Gemini breakdown error:", error);
    return null;
  }
};

export const getRankingAudit = async (tasks: Task[]): Promise<RankingAudit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const taskList = tasks
    .filter(t => t.status !== 'done')
    .map(t => `- [ID:${t.id}] ${t.title} (P:${t.priorityRank}, D:${t.difficultyRank}, U:${t.urgencyRank})`)
    .join('\n');

  const prompt = `Act as a high-performance productivity coach. Audit this task list and provide a summary of the user's workload state and specific suggestions for improving focus or flow based on their priority (P), difficulty (D), and urgency (U) rankings.
  
  Tasks:
  ${taskList}
  
  Return a JSON with 'summary' (string) and 'suggestions' (array of {taskId, improvement}).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING },
                  improvement: { type: Type.STRING }
                },
                required: ["taskId", "improvement"]
              }
            }
          },
          required: ["summary", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as RankingAudit;
  } catch (error) {
    console.error("Gemini audit error:", error);
    return { 
      summary: "Não foi possível realizar a auditoria de IA no momento. Concentre-se em sua tarefa de maior prioridade.", 
      suggestions: [] 
    };
  }
};

export const rankTasksWithAI = async (tasks: Task[]): Promise<any> => {
    // Placeholder as requested previously but with valid structure if needed later
    return { 
      rankedTaskIds: tasks.map(t => t.id), 
      reasoning: "Ordenação manual preferencial." 
    };
};