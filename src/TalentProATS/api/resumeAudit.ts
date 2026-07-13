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
  Emails?: ResumeAuditEmailContact[] | null;
  emails?: ResumeAuditEmailContact[] | null;
  Phones?: ResumeAuditPhoneContact[] | null;
  phones?: ResumeAuditPhoneContact[] | null;
};

export type ResumeAuditPrimaryFlag = boolean | string | number | null;

export type ResumeAuditEmailContact = {
  Email?: string | null;
  email?: string | null;
  Address?: string | null;
  address?: string | null;
  Value?: string | null;
  value?: string | null;
  Type?: string | null;
  type?: string | null;
  Primary?: ResumeAuditPrimaryFlag;
  primary?: ResumeAuditPrimaryFlag;
  IsPrimary?: ResumeAuditPrimaryFlag;
  isPrimary?: ResumeAuditPrimaryFlag;
};

export type ResumeAuditPhoneContact = {
  Number?: string | null;
  number?: string | null;
  Phone?: string | null;
  phone?: string | null;
  Value?: string | null;
  value?: string | null;
  Type?: string | null;
  type?: string | null;
  Primary?: ResumeAuditPrimaryFlag;
  primary?: ResumeAuditPrimaryFlag;
  IsPrimary?: ResumeAuditPrimaryFlag;
  isPrimary?: ResumeAuditPrimaryFlag;
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
    ResumeFileURL?: string | null;
    resumeFileURL?: string | null;
    resumeFileUrl?: string | null;
    location?: ResumeAuditCandidateLocation | null;
    Location?: ResumeAuditCandidateLocation | null;
    ContactInfo?: ResumeAuditContactInfo | null;
    contactInfo?: ResumeAuditContactInfo | null;
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
    WorkAuthorization?: string[] | string | null;
    workAuthorization?: string[] | string | null;
    coreSkills?: string[] | null;
  } | null;
  job?: {
    jobId?: number | string | null;
    jobTitle?: string | null;
    client?: string | null;
    industry?: string | null;
    Location?: string | null;
    location?: string | null;
    WorkModel?: string | null;
    workModel?: string | null;
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
    Type?: string | null;
    displayName?: string | null;
    DisplayName?: string | null;
    weight?: number | null;
    Weight?: number | null;
    scorePercentage?: number | null;
    ScorePercentage?: number | null;
    score?: number | null;
    Score?: number | null;
    maxScore?: number | null;
    MaxScore?: number | null;
    severity?: string | null;
    Severity?: string | null;
    message?: string | null;
    Message?: string | null;
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
  ResumeImprovement?: ResumeAuditImprovement | null;
  resumeImprovement?: ResumeAuditImprovement | null;
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

export type ResumeAuditCandidateLocation = {
  city?: string | null;
  City?: string | null;
  state?: string | null;
  State?: string | null;
  country?: string | null;
  Country?: string | null;
  zipCode?: string | null;
  ZipCode?: string | null;
  TravelDistance?: number | string | null;
  travelDistance?: number | string | null;
  DistanceUnit?: string | null;
  distanceUnit?: string | null;
  DistanceAnalysis?: string | null;
  distanceAnalysis?: string | null;
  CommuteStatus?: "Near" | "MidRange" | "Far" | "Remote" | string | null;
  commuteStatus?: "Near" | "MidRange" | "Far" | "Remote" | string | null;
};

export type ResumeAuditImprovement = {
  MissingInformation?: string[] | null;
  missingInformation?: string[] | null;
  ImprovementSuggestions?: string[] | null;
  improvementSuggestions?: string[] | null;
  AchievementSuggestions?: string[] | null;
  achievementSuggestions?: string[] | null;
  KeywordSuggestions?: string[] | null;
  keywordSuggestions?: string[] | null;
  ProjectSuggestions?: string[] | null;
  projectSuggestions?: string[] | null;
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
