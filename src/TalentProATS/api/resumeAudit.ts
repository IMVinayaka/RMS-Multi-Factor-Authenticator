import axiosInstance from "@/network";

export type ResumeAuditRequest = {
  candidateId: number | string;
  candidateInstance: string;
  jobId: number | string;
  jobInstance: string;
  userId: number | string;
  userInstance: string;
};

export type ResumeAuditContactInfo = {
  Emails?: Array<{ Email?: string | null; Type?: string | null; Primary?: boolean | null }>;
  Phones?: Array<{ Number?: string | null; Type?: string | null; Primary?: boolean | null }>;
};

export type ResumeAuditSalaryAmount = {
  Amount?: number | null;
  Currency?: string | null;
  Type?: string | null;
};

export type ResumeAuditResponse = {
  candidate?: {
    candidateId?: number | string | null;
    name?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    currentTitle?: string | null;
    currentCompany?: string | null;
    experienceYears?: number | string | null;
    education?: string | null;
    location?: {
      city?: string | null;
      state?: string | null;
      country?: string | null;
      zipCode?: string | null;
    } | null;
    ContactInfo?: ResumeAuditContactInfo | null;
    Salary?: {
      CurrentSalary?: ResumeAuditSalaryAmount | null;
      ExpectedSalary?: ResumeAuditSalaryAmount | null;
      SalaryMatch?: {
        Score?: number | null;
        Status?: string | null;
        DifferencePercentage?: number | null;
        Summary?: string | null;
      } | null;
    } | null;
    Availability?: {
      NoticePeriod?: string | null;
      AvailableFrom?: string | null;
    } | null;
    WorkAuthorization?: string[] | null;
    coreSkills?: string[] | null;
  } | null;
  job?: {
    jobId?: number | string | null;
    jobTitle?: string | null;
    client?: string | null;
    industry?: string | null;
    salary?: {
      amount?: number | null;
      currency?: string | null;
      type?: string | null;
    } | null;
  } | null;
  auditResult?: {
    overallScore?: number | null;
    recommendation?: string | null;
    confidence?: string | null;
    statusColor?: string | null;
    submissionPriority?: string | null;
    interviewProbability?: number | null;
    summary?: string | null;
    decisionReason?: string | null;
  } | null;
  scoreBreakdown?: Array<{
    type?: string | null;
    displayName?: string | null;
    weight?: number | null;
    scorePercentage?: number | null;
    score?: number | null;
    maxScore?: number | null;
    severity?: string | null;
    message?: string | null;
  }> | null;
  skillsAnalysis?: {
    mandatorySkills?: ResumeAuditSkill[] | null;
    preferredSkills?: ResumeAuditSkill[] | null;
    softSkills?: ResumeAuditSkill[] | null;
    missingSkills?: string[] | null;
    additionalStrengthSkills?: string[] | null;
  } | null;
  strengths?: string[] | null;
  candidateConcerns?: Array<{
    type?: string | null;
    severity?: string | null;
    message?: string | null;
    recommendation?: string | null;
  }> | null;
  screeningQuestions?: ResumeAuditScreeningQuestions | null;
  ResumeImprovement?: {
    MissingInformation?: string[] | null;
    ImprovementSuggestions?: string[] | null;
    AchievementSuggestions?: string[] | null;
    KeywordSuggestions?: string[] | null;
    ProjectSuggestions?: string[] | null;
  } | null;
  submissionSummary?: {
    candidateSummary?: string | null;
    sellingPoints?: string[] | null;
    clientConcerns?: string[] | null;
    submissionNotes?: string | null;
  } | null;
  executiveInsights?: {
    whyRecommended?: string[] | null;
    whyNotPerfect?: string[] | null;
    nextRecommendedAction?: string | null;
  } | null;
  auditMetadata?: {
    auditedOn?: string | null;
    auditedBy?: string | null;
    model?: string | null;
  } | null;
};

export type ResumeAuditSkill = {
  skill?: string | null;
  matched?: boolean | null;
  coverage?: number | string | null;
  experience?: string | null;
  confidence?: number | null;
  evidence?: string[] | null;
};

export type ResumeAuditQuestion = {
  question?: string | null;
  reason?: string | null;
  priority?: string | null;
};

export type ResumeAuditScreeningQuestions = {
  technicalQuestions?: ResumeAuditQuestion[] | null;
  experienceQuestions?: ResumeAuditQuestion[] | null;
  domainQuestions?: ResumeAuditQuestion[] | null;
  riskQuestions?: ResumeAuditQuestion[] | null;
  softSkillQuestions?: ResumeAuditQuestion[] | null;
};

const RESUME_AUDIT_SERVICE_URL =
  process.env.NEXT_PUBLIC_RESUME_AUDIT_SERVICE_URL ||
  "https://intranet.radiants.com/RadAPIs/api/OpenAI/ResumeAuditService";

const maskPayload = (payload: ResumeAuditRequest) => ({
  candidateId: payload.candidateId,
  candidateInstance: payload.candidateInstance,
  jobId: payload.jobId,
  jobInstance: payload.jobInstance,
  userId: payload.userId ? "********" : "",
  userInstance: payload.userInstance,
});

export const auditResume = async (payload: ResumeAuditRequest) => {
  console.log("[ResumeAudit API] POST", RESUME_AUDIT_SERVICE_URL);
  console.log("[ResumeAudit API] Payload", maskPayload(payload));

  const response = await axiosInstance.post<ResumeAuditResponse>(RESUME_AUDIT_SERVICE_URL, payload, {
    headers: {
      accept: "*/*",
      "Content-Type": "application/json-patch+json",
    },
  });

  console.log("[ResumeAudit API] Response", response.data);

  return response.data;
};
