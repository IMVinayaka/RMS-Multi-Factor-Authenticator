import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const talentProRoutes: Record<string, ComponentType> = {
  "job-analysis": dynamic(() => import("@/TalentProATS/app/JobAnalysis")),
  "resume-audit": dynamic(() => import("@/TalentProATS/app/ResumeAudit")),
};
