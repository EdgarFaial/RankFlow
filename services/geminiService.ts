
import { GoogleGenAI, Type } from "@google/genai";

// Always use named parameter for apiKey and use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTaskBreakdown = async (taskTitle: string, taskDescription: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Break down this task into smaller, actionable sub-tasks and estimate its difficulty (1-10) and priority (1-10): Title: ${taskTitle}, Description: ${taskDescription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedDifficulty: { type: Type.NUMBER },
            suggestedPriority: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["subtasks", "suggestedDifficulty", "suggestedPriority"]
        }
      }
    });

    // Extract text directly from property .text
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini breakdown error:", error);
    return null;
  }
};

export const getRankingAudit = async (tasks: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Audit this list of tasks and their manual rankings. Tell me if the logic seems sound or if some tasks should be moved based on their descriptions. Tasks: ${JSON.stringify(tasks)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING },
                  improvement: { type: Type.STRING }
                }
              }
            },
            summary: { type: Type.STRING }
          }
        }
      }
    });
    // Extract text directly from property .text
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return null;
  }
};
