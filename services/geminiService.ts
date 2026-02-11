
import { Task, TaskBreakdown, RankingAudit } from "../types";

// Temporariamente desativado para economizar recursos/limites de API
export const getTaskBreakdown = async (title: string, description: string): Promise<TaskBreakdown | null> => {
  console.log("Gemini Service (Breakdown) is temporarily disabled.");
  return null;
};

export const getRankingAudit = async (tasks: Task[]): Promise<RankingAudit | null> => {
  console.log("Gemini Service (Audit) is temporarily disabled.");
  return null;
};
