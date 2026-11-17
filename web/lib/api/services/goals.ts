import type { GoalInput, GoalProjection } from "@/types/api";
import { http } from "../client";

/** POST /v1/goals/project. */
export const goalsService = {
  project: (input: GoalInput) => http.post<GoalProjection>("/goals/project", input).then((r) => r.data),
};
