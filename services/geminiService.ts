
import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskBreakdown, RankingAudit } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getTaskBreakdown = async (title: string, description: string): Promise<TaskBreakdown | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise a seguinte tarefa e crie um detalhamento estratégico. 
      Tarefa: ${title}
      Descrição original: ${description}
      Retorne um JSON com subtasks (passos acionáveis) e reasoning (por que essa ordem).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING }
          },
          required: ["subtasks", "reasoning"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Error:", e);
    return null;
  }
};

export const getRankingAudit = async (tasks: Task[]): Promise<RankingAudit | null> => {
  try {
    const taskList = tasks.map(t => ({ title: t.title, priority: t.priorityRank, urgency: t.urgencyRank }));
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é um coach de produtividade. Analise esta lista de tarefas: ${JSON.stringify(taskList)}. 
      Forneça um resumo estratégico e 3 sugestões de melhoria de foco.`,
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
                required: ["improvement"]
              }
            }
          },
          required: ["summary", "suggestions"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Audit Error:", e);
    return null;
  }
};
