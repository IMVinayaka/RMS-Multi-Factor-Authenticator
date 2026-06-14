import axiosInstance from "@/network";

export type JobAnalysisRequest = {
  jobId: number | string;
  jobInstance: string;
  clientReference: string;
};

export type SkillValue =
  | string
  | {
      skill?: string | null;
      skillExperienceRequirement?: string | null;
    };

export type JobAnalysisResponse = {
  jobId: number | string;
  jobInfo: {
    jobTitle?: string;
    primaryTitle?: string;
    relatedTitles?: string[];
    department?: string;
    seniorityLevel?: string;
    employmentType?: string;
  };
  location: {
    workModel?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    remoteAllowed?: boolean | string;
  };
  compensation?: {
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryType?: string | null;
    currency?: string | null;
  } | null;
  experience?: {
    minimumYears?: number | null;
    preferredYears?: number | null;
  };
  skills?: {
    mandatorySkills?: SkillValue[];
    preferredSkills?: SkillValue[];
    softSkills?: SkillValue[];
    prioritySkills?: string[];
  };
  skillExperienceRequirements?: Array<{
    skill?: string;
    minimumYears?: number | null;
  }>;
  education?: {
    educationQualification?: string[];
    degrees?: string[];
    certifications?: string[];
  };
  industryDomains?: string[];
  technologies?: string[];
  searchOptimization?: {
    keywords?: string[];
    searchSynonyms?: Record<string, string[]>;
    searchTitles?: {
      primaryTitle?: string;
      relatedTitles?: string[];
    };
    booleanSearchString?: string;
  };
  summary?: {
    jdSummary?: string;
    jobDiscriptionSummary?: string;
    recruiterNotes?: string;
  };
};

const JD_ANALYSE_SERVICE_URL =
  process.env.NEXT_PUBLIC_JD_ANALYSE_SERVICE_URL ||
  "https://intranet.radiants.com/RadAPIs/api/OpenAI/JDAnalyseService";

const maskPayload = (payload: JobAnalysisRequest) => ({
  jobId: payload.jobId,
  jobInstance: payload.jobInstance,
  clientReference: payload.clientReference ? "********" : "",
});

export const analyseJobDescription = async (payload: JobAnalysisRequest) => {
  console.log("[JobAnalysis API] POST", JD_ANALYSE_SERVICE_URL);
  console.log("[JobAnalysis API] Payload", maskPayload(payload));

  const response = await axiosInstance.post<JobAnalysisResponse>(JD_ANALYSE_SERVICE_URL, payload, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json-patch+json",
    },
  });

  console.log("[JobAnalysis API] Response", response.data);

  return response.data;
};
