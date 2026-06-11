import axiosInstance from "@/network";

export type JobAnalysisRequest = {
  jobId: number | string;
  jobInstance: string;
  clientReference: string;
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
    mandatorySkills?: string[];
    preferredSkills?: string[];
    softSkills?: string[];
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

export const analyseJobDescription = async (payload: JobAnalysisRequest) => {
  console.log("[JobAnalysis API] POST", JD_ANALYSE_SERVICE_URL);
  console.log("[JobAnalysis API] Payload", payload);

  const response = await axiosInstance.post<JobAnalysisResponse>(JD_ANALYSE_SERVICE_URL, payload, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json-patch+json",
    },
  });

  console.log("[JobAnalysis API] Response", response.data);

  return response.data;
};
