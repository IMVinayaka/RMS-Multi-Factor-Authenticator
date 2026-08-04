import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  auditResume,
  type ResumeAuditCandidateSnapshot,
  type ResumeAuditEmailContact,
  type ResumeAuditImprovement,
  type ResumeAuditPhoneContact,
  type ResumeAuditQuestion,
  type ResumeAuditRequest,
  type ResumeAuditResponse,
  type ResumeAuditSkill,
} from "@/TalentProATS/api/resumeAudit";
import { CANDIDATE_SNAPSHOT_EMAIL_TEMPLATE } from "@/TalentProATS/templates/CandidateSnapshotEmailTemplate";
import { InteractiveResumeViewer, type ResumeHighlightSelection } from "@/TalentProATS/app/ResumeComparison";
import { AnalysisErrorState, getAnalysisErrorDetails, type AnalysisErrorDetails } from "@/TalentProATS/app/AnalysisErrorState";

type Tone = "blue" | "green" | "orange" | "red" | "purple" | "gray";
type QuestionGroup = {
  key: string;
  title: string;
  items: ResumeAuditQuestion[];
};

type QuestionPopover = {
  title: string;
  groups: QuestionGroup[];
};

type QuestionSort = "priority" | "difficulty" | "default";

type PopoverPosition = {
  left: number;
  top: number;
};

type ComparisonMode = "resume" | "job" | null;

const emptyArray = <T,>(value?: T[] | null) => (Array.isArray(value) ? value : []);

const compactStringArray = (value?: Array<string | null | undefined> | null) =>
  emptyArray(value).map((item) => String(item || "").trim()).filter(Boolean);

const compactStringList = (value?: string | Array<string | null | undefined> | null) => {
  if (Array.isArray(value)) return compactStringArray(value);
  const normalized = String(value || "").trim();
  return normalized ? [normalized] : [];
};

const valueOrDash = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const QUESTION_PAGE_SIZE = 3;
const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

const normalizeQuestionValue = (value?: string | null) => String(value || "").trim().toLowerCase();

const sortQuestions = (items: ResumeAuditQuestion[], sort: QuestionSort) => {
  if (sort === "default") return items;

  return items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((left, right) => {
      const leftPriority = priorityOrder[normalizeQuestionValue(left.item.priority || left.item.Priority)] ?? 99;
      const rightPriority = priorityOrder[normalizeQuestionValue(right.item.priority || right.item.Priority)] ?? 99;
      const leftDifficulty = difficultyOrder[normalizeQuestionValue(left.item.difficulty || left.item.Difficulty)] ?? 99;
      const rightDifficulty = difficultyOrder[normalizeQuestionValue(right.item.difficulty || right.item.Difficulty)] ?? 99;
      const primaryDifference = sort === "priority" ? leftPriority - rightPriority : leftDifficulty - rightDifficulty;
      const secondaryDifference = sort === "priority" ? leftDifficulty - rightDifficulty : leftPriority - rightPriority;

      return primaryDifference || secondaryDifference || left.originalIndex - right.originalIndex;
    })
    .map(({ item }) => item);
};

const escapeHtml = (value?: string | number | null) =>
  valueOrDash(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderTemplate = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((html, [key, value]) => html.replaceAll(`@@${key}`, value), template);

const getQueryParam = (query: Record<string, string | string[] | undefined>, ...keys: string[]) => {
  for (const key of keys) {
    const value = query[key];
    if (value) return Array.isArray(value) ? value[0] : value;
  }
  return undefined;
};

const parseResumeAuditRequest = (query: Record<string, string | string[] | undefined>): ResumeAuditRequest | null => {
  const candidateId = getQueryParam(query, "CandID", "candId", "candidateId", "candidateid");
  const candidateInstance = getQueryParam(query, "CandInstance", "candInstance", "candidateInstance", "candidateinstance");
  const jobId = getQueryParam(query, "JobID", "jobId", "jobid");
  const jobInstance = getQueryParam(query, "JobInstance", "jobInstance", "jobinstance");
  const userId = getQueryParam(query, "UserID", "userId", "userid");
  const userInstance = getQueryParam(query, "UserInstance", "userInstance", "userinstance");

  if (!candidateId || !candidateInstance || !jobId || !jobInstance || !userId || !userInstance) return null;

  return {
    candidateId,
    candidateInstance,
    jobId,
    jobInstance,
    userId,
    userInstance,
  };
};

const maskRequest = (request: ResumeAuditRequest | null) => {
  if (!request) return null;

  return {
    candidateId: request.candidateId,
    candidateInstance: request.candidateInstance,
    jobId: request.jobId,
    jobInstance: request.jobInstance,
    userId: request.userId ? "********" : "",
    userInstance: request.userInstance,
  };
};

const formatYears = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "-";
  const normalized = String(value);
  if (/years?|yrs?/i.test(normalized)) return normalized;
  return `${normalized} Years`;
};

const formatSkillExperience = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const formatYearLastUsed = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const copyFirstQueryAlias = (params: URLSearchParams, aliases: string[], to: string) => {
  for (const alias of aliases) {
    const value = params.get(alias);
    if (value && !params.get(to)) {
      params.set(to, value);
      return;
    }
  }
};

const buildJobAnalysisComparisonUrl = (asPath: string) => {
  const queryText = asPath.split("?")[1]?.split("#")[0] || "";
  const params = new URLSearchParams(queryText);

  params.delete("talentproRoute");
  params.delete("token");
  copyFirstQueryAlias(params, ["JobID", "jobId", "jobid"], "jobId");
  copyFirstQueryAlias(params, ["JobInstance", "jobInstance", "jobinstance"], "jobInstance");
  copyFirstQueryAlias(params, ["UserID", "userId", "userid"], "userId");
  copyFirstQueryAlias(params, ["UserInstance", "userInstance", "userinstance"], "userInstance");
  copyFirstQueryAlias(
    params,
    ["ClientReference", "clientReference", "clientreference", "ClientRef", "clientRef", "clientref", "ClientID", "clientId", "clientid"],
    "clientReference"
  );
  if (!params.get("clientReference") && params.get("jobInstance")) {
    params.set("clientReference", String(params.get("jobInstance")));
  }

  const query = params.toString();
  return query ? `/job-analysis?${query}` : "/job-analysis";
};

const buildInteractiveComparisonUrl = (asPath: string) => {
  const queryText = asPath.split("?")[1]?.split("#")[0] || "";
  return queryText ? `/resume-comparison?${queryText}` : "/resume-comparison";
};

const isWordDocumentUrl = (url: string) => {
  const path = url.split(/[?#]/)[0]?.trim().toLowerCase() || "";
  return path.endsWith(".doc") || path.endsWith(".docx");
};

const getResumeDocumentFrameUrl = (url: string) => {
  if (!url || url === "-") return "";
  if (isWordDocumentUrl(url)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return encodeURI(url);
};

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  const normalized = Number(value);
  const percent = normalized > 0 && normalized <= 1 ? normalized * 100 : normalized;
  return `${Math.round(percent)}%`;
};

const normalizeScorePercentage = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 0;
  const normalized = Number(value);
  return normalized > 0 && normalized <= 1 ? normalized * 100 : normalized;
};

const getScoreBreakdownMaximum = (
  item: NonNullable<ResumeAuditResponse["scoreBreakdown"]>[number]
) => item.maxScore ?? item.MaxScore ?? item.weight ?? item.Weight;

const formatSalaryAssessmentScore = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  const normalized = Number(value);
  const percent = normalized <= 10 ? normalized * 10 : normalized;
  return `${Math.round(percent)}%`;
};

const getSalaryAssessmentTone = (value?: number | null): Tone => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "gray";
  const normalized = Number(value);
  if (normalized <= 10) return normalized >= 8 ? "green" : "orange";
  return normalized >= 80 ? "green" : "orange";
};

const formatDifferencePercentage = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toFixed(1).replace(/\.0$/, "")}%`;
};

const getSalaryAssessmentTooltip = (
  summary: string,
  differencePercentage?: number | null,
  expectedSalary?: string,
  budget?: string
) => {
  const lines = [];
  if (summary && summary !== "-") lines.push(summary);
  if (expectedSalary && expectedSalary !== "-") lines.push(`Expected Salary: ${expectedSalary}`);
  if (budget && budget !== "-") lines.push(`Budget: ${budget}`);
  if (differencePercentage !== null && differencePercentage !== undefined && Number(differencePercentage) > 0) {
    lines.push(`Difference Percentage: ${formatDifferencePercentage(differencePercentage)}`);
  }
  return lines.join("\n");
};

const normalizeCommuteTone = (status?: string | null): Tone => {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "near") return "green";
  if (normalized === "midrange") return "orange";
  if (normalized === "far") return "red";
  return "gray";
};

const formatDistanceLabel = (distance?: number | string | null, unit?: string | null) => {
  if (distance === null || distance === undefined || distance === "") return "-";
  const normalizedUnit = unit ? unit.trim() : "";
  const displayUnit = normalizedUnit ? `${normalizedUnit.charAt(0).toUpperCase()}${normalizedUnit.slice(1)}` : "";
  return [distance, displayUnit].filter(Boolean).join(" ");
};

const getCurrencySymbol = (currency?: string | null) => {
  const normalized = currency?.trim().toLowerCase();
  if (!normalized) return "";
  if (["usd", "us dollar", "dollar", "dollars", "$"].includes(normalized)) return "$";
  if (["inr", "rupee", "rupees", "rs"].includes(normalized)) return "Rs ";
  return `${currency} `;
};

const formatMoney = (amount?: number | null, currency?: string | null, type?: string | null) => {
  if (amount === null || amount === undefined) return "-";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
  const suffix = type ? ` / ${type.toLowerCase()}` : "";
  return `${getCurrencySymbol(currency)}${formatted}${suffix}`;
};

const formatMoneyWithDecimals = (amount?: number | null, currency?: string | null, type?: string | null) => {
  if (amount === null || amount === undefined) return "-";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  const suffix = type ? ` / ${type.toLowerCase()}` : "";
  return `${getCurrencySymbol(currency)}${formatted}${suffix}`;
};

const formatTitleCompany = (title?: string | null, company?: string | null) => {
  const normalizedTitle = valueOrDash(title);
  const normalizedCompany = valueOrDash(company);

  if (normalizedTitle !== "-" && normalizedCompany !== "-") return `${normalizedTitle} @ ${normalizedCompany}`;
  if (normalizedTitle !== "-") return normalizedTitle;
  return normalizedCompany;
};

const formatLocationWorkModel = (location?: string | null, workModel?: string | null) => {
  const normalizedLocation = valueOrDash(location);
  const normalizedWorkModel = valueOrDash(workModel);

  if (normalizedLocation !== "-" && normalizedWorkModel !== "-") return `${normalizedLocation} (${normalizedWorkModel})`;
  if (normalizedLocation !== "-") return normalizedLocation;
  if (normalizedWorkModel !== "-") return normalizedWorkModel;
  return "-";
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

const formatRecommendation = (value?: string | null) => {
  const normalized = valueOrDash(value).replace(/([a-z])([A-Z])/g, "$1 $2");
  if (normalized === "-") return "-";
  return normalized;
};

const getRecommendationTone = (value?: string | null): Tone => {
  const normalized = value?.toLowerCase() || "";
  if (normalized.includes("strong") || normalized.includes("submit")) return "green";
  if (normalized.includes("weak") || normalized.includes("reject")) return "red";
  if (normalized.includes("medium") || normalized.includes("review")) return "orange";
  return "blue";
};

const getSeverityTone = (value?: string | null): Tone => {
  const normalized = value?.toLowerCase() || "";
  if (normalized === "high") return "red";
  if (normalized === "medium") return "orange";
  if (normalized === "low") return "green";
  return "blue";
};

const isPrimaryContact = (value: unknown) => {
  if (value === true || value === 1) return true;
  if (typeof value === "string") return ["true", "yes", "y", "1", "primary"].includes(value.trim().toLowerCase());
  return false;
};

const getContactInfo = (data?: ResumeAuditResponse | null) => data?.candidate?.ContactInfo || data?.candidate?.contactInfo || null;

const getEmailValue = (item?: ResumeAuditEmailContact | null) =>
  valueOrDash(item?.Email || item?.email || item?.Address || item?.address || item?.Value || item?.value);

const getPhoneValue = (item?: ResumeAuditPhoneContact | null) =>
  valueOrDash(item?.Number || item?.number || item?.Phone || item?.phone || item?.Value || item?.value);

const isPrimaryEmail = (item?: ResumeAuditEmailContact | null) =>
  isPrimaryContact(item?.Primary ?? item?.primary ?? item?.IsPrimary ?? item?.isPrimary);

const isPrimaryPhone = (item?: ResumeAuditPhoneContact | null) =>
  isPrimaryContact(item?.Primary ?? item?.primary ?? item?.IsPrimary ?? item?.isPrimary);

const getPrimaryEmail = (data?: ResumeAuditResponse | null) => {
  const contactInfo = getContactInfo(data);
  const emails = emptyArray(contactInfo?.Emails || contactInfo?.emails).filter((item) => getEmailValue(item) !== "-");
  const primaryEmail = emails.find(isPrimaryEmail);

  return getEmailValue(primaryEmail || (emails.length === 1 ? emails[0] : null));
};

const getPrimaryPhone = (data?: ResumeAuditResponse | null) => {
  const contactInfo = getContactInfo(data);
  const phones = emptyArray(contactInfo?.Phones || contactInfo?.phones).filter((item) => getPhoneValue(item) !== "-");
  const primaryPhone = phones.find(isPrimaryPhone);

  return getPhoneValue(primaryPhone || (phones.length === 1 ? phones[0] : null));
};

const getQuestionGroups = (data?: ResumeAuditResponse | null): QuestionGroup[] => [
  { key: "technical", title: "Technical Questions", items: emptyArray(data?.screeningQuestions?.technicalQuestions) },
  { key: "experience", title: "Experience Questions", items: emptyArray(data?.screeningQuestions?.experienceQuestions) },
  { key: "domain", title: "Domain Questions", items: emptyArray(data?.screeningQuestions?.domainQuestions) },
  { key: "risk", title: "Risk Questions", items: emptyArray(data?.screeningQuestions?.riskQuestions) },
  { key: "softSkill", title: "Soft Skill Questions", items: emptyArray(data?.screeningQuestions?.softSkillQuestions) },
].filter((group) => group.items.length > 0);

const getInitials = (name?: string | null) => {
  const parts = valueOrDash(name).split(/\s+/).filter(Boolean);
  if (!parts.length || parts[0] === "-") return "RA";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
};

const getResumeImprovement = (data?: ResumeAuditResponse | null) => data?.ResumeImprovement || data?.resumeImprovement || null;

const getCandidateSnapshot = (data?: ResumeAuditResponse | null) => data?.CandidateSnapshot || data?.candidateSnapshot || null;

const getSnapshotSummary = (snapshot?: ResumeAuditCandidateSnapshot | null) => valueOrDash(snapshot?.Summary || snapshot?.summary);

const getSnapshotPoints = (snapshot?: ResumeAuditCandidateSnapshot | null) => compactStringArray(snapshot?.Snapshot || snapshot?.snapshot);

const getImprovementSections = (data?: ResumeAuditImprovement | null) =>
  [
    { title: "Missing Information", tone: "orange" as Tone, items: compactStringArray(data?.MissingInformation || data?.missingInformation) },
    { title: "Improvement Suggestions", tone: "blue" as Tone, items: compactStringArray(data?.ImprovementSuggestions || data?.improvementSuggestions) },
    { title: "Achievement Suggestions", tone: "green" as Tone, items: compactStringArray(data?.AchievementSuggestions || data?.achievementSuggestions) },
    { title: "Keyword Suggestions", tone: "purple" as Tone, items: compactStringArray(data?.KeywordSuggestions || data?.keywordSuggestions), variant: "tags" },
    { title: "Project Suggestions", tone: "blue" as Tone, items: compactStringArray(data?.ProjectSuggestions || data?.projectSuggestions) },
  ].filter((section) => section.items.length > 0);

const getAdditionalRequirementSkills = (mandatorySkills: ResumeAuditSkill[], preferredSkills: ResumeAuditSkill[]) => {
  const mandatoryNames = new Set(mandatorySkills.map((item) => valueOrDash(item.skill).trim().toLowerCase()).filter((item) => item && item !== "-"));

  return preferredSkills.filter((item) => {
    const skillName = valueOrDash(item.skill).trim().toLowerCase();
    return skillName && skillName !== "-" && !mandatoryNames.has(skillName);
  });
};

export default function ResumeAudit() {
  const router = useRouter();
  const comparisonWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<ResumeAuditResponse | null>(null);
  const [requestPayload, setRequestPayload] = useState<ResumeAuditRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState<AnalysisErrorDetails | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(null);
  const [resumeHighlightSelection, setResumeHighlightSelection] = useState<ResumeHighlightSelection | null>(null);
  const [interactiveComparisonOpen, setInteractiveComparisonOpen] = useState(false);
  const [comparisonLeftPercent, setComparisonLeftPercent] = useState(60);
  const [isComparisonResizing, setIsComparisonResizing] = useState(false);
  const [questionPopover, setQuestionPopover] = useState<QuestionPopover | null>(null);
  const [questionPopoverPosition, setQuestionPopoverPosition] = useState<PopoverPosition | null>(null);
  const [questionSort, setQuestionSort] = useState<QuestionSort>("priority");

  useEffect(() => {
    if (!router.isReady) return;

    const request = parseResumeAuditRequest(router.query);
    console.log("[ResumeAudit Page] URL query received", router.query);
    console.log("[ResumeAudit Page] Parsed payload", maskRequest(request));

    setRequestPayload(request);
    setAnalysisError(null);

    if (!request) {
      setData(null);
      setLoading(false);
      setAnalysisError({ message: "The Resume Audit link is missing one or more required request parameters." });
      console.warn("[ResumeAudit Page] Missing required query parameters.");
      return;
    }

    let active = true;

    async function loadResumeAudit() {
      try {
        setLoading(true);
        const response = await auditResume(request);
        if (active) setData(response);
      } catch (error) {
        if (active) {
          setData(null);
          const details = getAnalysisErrorDetails(error, "Unable to load resume audit.");
          setAnalysisError(details);
          console.error("[ResumeAudit Page] API error", error);
          toast.error(details.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResumeAudit();

    return () => {
      active = false;
    };
  }, [
    router.isReady,
    router.query.CandID,
    router.query.CandInstance,
    router.query.JobID,
    router.query.JobInstance,
    router.query.UserID,
    router.query.UserInstance,
  ]);

  useEffect(() => {
    const embedded = typeof window !== "undefined" && window.parent !== window;
    setIsEmbedded(embedded);
    if (!embedded) return;

    const sendHeight = () => {
      window.parent.postMessage(
        {
          type: "resumeAuditHeight",
          height: Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight
          ),
        },
        "*"
      );
    };

    const scheduleHeight = () => {
      sendHeight();
      requestAnimationFrame(sendHeight);
    };

    scheduleHeight();
    const timers = [100, 300, 700, 1200].map((delay) => setTimeout(sendHeight, delay));
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleHeight) : null;
    resizeObserver?.observe(document.body);
    window.addEventListener("resize", sendHeight);

    return () => {
      timers.forEach(clearTimeout);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", sendHeight);
    };
  }, [data, loading, questionPopover]);

  useEffect(() => {
    if (isEmbedded && comparisonMode) setComparisonMode(null);
  }, [isEmbedded, comparisonMode]);

  useEffect(() => {
    if (comparisonMode !== "resume") setResumeHighlightSelection(null);
  }, [comparisonMode]);

  const view = useMemo(() => {
    const candidate = data?.candidate;
    const job = data?.job;
    const audit = data?.auditResult;
    const auditPascal = data?.AuditResult;
    const salary = candidate?.Salary || candidate?.salary;
    const currentSalary = salary?.CurrentSalary || salary?.currentSalary;
    const expectedSalary = salary?.ExpectedSalary || salary?.expectedSalary;
    const salaryAssessment = audit?.SalaryAssessment || audit?.salaryAssessment || auditPascal?.SalaryAssessment || auditPascal?.salaryAssessment || salary?.SalaryMatch;
    const salaryAssessmentScore = salaryAssessment?.Score ?? salaryAssessment?.score;
    const salaryAssessmentSummary = valueOrDash(salaryAssessment?.Summary || salaryAssessment?.summary);
    const salaryAssessmentDifference = salaryAssessment?.DifferencePercentage ?? salaryAssessment?.differencePercentage;
    const hasCandidateSalary = Boolean(
      (currentSalary?.Amount ?? currentSalary?.amount) !== null && (currentSalary?.Amount ?? currentSalary?.amount) !== undefined ||
      (expectedSalary?.Amount ?? expectedSalary?.amount) !== null && (expectedSalary?.Amount ?? expectedSalary?.amount) !== undefined ||
      salaryAssessmentScore !== null && salaryAssessmentScore !== undefined
    );
    const candidateLocation = candidate?.location || candidate?.Location;
    const location = [
      candidateLocation?.city || candidateLocation?.City,
      candidateLocation?.state || candidateLocation?.State,
      candidateLocation?.country || candidateLocation?.Country,
    ].filter(Boolean).join(", ");
    const commuteStatus = valueOrDash(candidateLocation?.CommuteStatus || candidateLocation?.commuteStatus);
    const travelDistance = candidateLocation?.TravelDistance ?? candidateLocation?.travelDistance;
    const distanceUnit = candidateLocation?.DistanceUnit || candidateLocation?.distanceUnit;
    const distanceLabel = formatDistanceLabel(travelDistance, distanceUnit);
    const jobBudgetDisplay = formatMoneyWithDecimals(job?.salary?.amount, job?.salary?.currency, job?.salary?.type);
    const currentSalaryDisplay = formatMoney(currentSalary?.Amount ?? currentSalary?.amount, currentSalary?.Currency || currentSalary?.currency, currentSalary?.Type || currentSalary?.type);
    const expectedSalaryCompact = formatMoney(expectedSalary?.Amount ?? expectedSalary?.amount, expectedSalary?.Currency || expectedSalary?.currency, expectedSalary?.Type || expectedSalary?.type);
    const expectedSalaryDetailed = formatMoneyWithDecimals(expectedSalary?.Amount ?? expectedSalary?.amount, expectedSalary?.Currency || expectedSalary?.currency, expectedSalary?.Type || expectedSalary?.type);

    return {
      candidateName: valueOrDash(candidate?.name),
      resumeFileUrl: valueOrDash(candidate?.ResumeFileURL || candidate?.resumeFileURL || candidate?.resumeFileUrl),
      initials: getInitials(candidate?.name),
      currentTitle: valueOrDash(candidate?.currentTitle),
      currentCompany: valueOrDash(candidate?.currentCompany),
      titleCompanyDisplay: formatTitleCompany(candidate?.currentTitle, candidate?.currentCompany),
      experience: formatYears(candidate?.experienceYears),
      email: getPrimaryEmail(data),
      phone: getPrimaryPhone(data),
      education: valueOrDash(candidate?.education),
      location: location || "-",
      commuteStatus,
      commuteTone: normalizeCommuteTone(commuteStatus),
      commuteDistanceLabel: commuteStatus.toLowerCase() !== "remote" ? distanceLabel : "-",
      commuteDistanceAnalysis: valueOrDash(candidateLocation?.DistanceAnalysis || candidateLocation?.distanceAnalysis),
      workAuthorization: compactStringList(candidate?.WorkAuthorization || candidate?.workAuthorization).join(", ") || "-",
      coreSkills: compactStringArray(candidate?.coreSkills),
      jobTitle: valueOrDash(job?.jobTitle),
      jobId: valueOrDash(job?.jobId || requestPayload?.jobId),
      client: valueOrDash(job?.client),
      industry: valueOrDash(job?.industry),
      jobLocationWorkModel: formatLocationWorkModel(job?.Location || job?.location, job?.WorkModel || job?.workModel),
      jobBudget: jobBudgetDisplay,
      hasCandidateSalary,
      overallScore: audit?.overallScore ?? auditPascal?.OverallScore ?? 0,
      recommendation: formatRecommendation(audit?.recommendation || auditPascal?.Recommendation),
      recommendationTone: getRecommendationTone(audit?.recommendation || auditPascal?.Recommendation),
      confidence: valueOrDash(audit?.confidence || auditPascal?.Confidence),
      submissionPriority: valueOrDash(audit?.submissionPriority || auditPascal?.SubmissionPriority),
      interviewProbability: audit?.interviewProbability ?? auditPascal?.InterviewProbability ?? 0,
      summary: valueOrDash(audit?.summary || auditPascal?.Summary),
      decisionReason: valueOrDash(audit?.decisionReason || auditPascal?.DecisionReason),
      scoreBreakdown: emptyArray(data?.scoreBreakdown).filter((item) => {
        const maximum = getScoreBreakdownMaximum(item);
        return maximum !== null && maximum !== undefined && Number(maximum) !== 0;
      }),
      mandatorySkills: emptyArray(data?.skillsAnalysis?.mandatorySkills).map((item) => ({ ...item, skillCategory: "Mandatory Skills" as const })),
      preferredSkills: emptyArray(data?.skillsAnalysis?.preferredSkills).map((item) => ({ ...item, skillCategory: "Preferred Skills" as const })),
      softSkills: emptyArray(data?.skillsAnalysis?.softSkills).map((item) => ({ ...item, skillCategory: "Soft Skills" as const })),
      missingSkills: compactStringArray(data?.skillsAnalysis?.missingSkills),
      additionalStrengthSkills: compactStringArray(data?.skillsAnalysis?.additionalStrengthSkills),
      strengths: compactStringArray(data?.strengths),
      concerns: emptyArray(data?.candidateConcerns),
      questionGroups: getQuestionGroups(data),
      resumeImprovement: getResumeImprovement(data),
      candidateSnapshot: getCandidateSnapshot(data),
      submissionSummary: data?.submissionSummary,
      clientConcerns: compactStringArray(data?.submissionSummary?.clientConcerns),
      executiveInsights: data?.executiveInsights,
      nextRecommendedAction: valueOrDash(data?.executiveInsights?.nextRecommendedAction),
      currentSalary: currentSalaryDisplay,
      expectedSalary: expectedSalaryCompact,
      expectedSalaryDisplay: expectedSalaryDetailed,
      salaryMatchScore: salaryAssessmentScore ?? 0,
      salaryMatchScoreDisplay: formatSalaryAssessmentScore(salaryAssessmentScore),
      salaryMatchTone: getSalaryAssessmentTone(salaryAssessmentScore),
      salaryMatchStatus: valueOrDash(salaryAssessment?.Status || salaryAssessment?.status),
      salaryMatchSummary: salaryAssessmentSummary,
      salaryMatchTooltip: getSalaryAssessmentTooltip(salaryAssessmentSummary, salaryAssessmentDifference, expectedSalaryDetailed, jobBudgetDisplay),
      availableFrom: formatDate(candidate?.Availability?.AvailableFrom),
      noticePeriod: valueOrDash(candidate?.Availability?.NoticePeriod),
      auditedOn: formatDate(data?.auditMetadata?.auditedOn),
    };
  }, [data, requestPayload]);

  const improvementSections = getImprovementSections(view.resumeImprovement);
  const resumeAuditEvidenceTerms = useMemo(
    () => Array.from(new Set(
      [...view.mandatorySkills, ...view.preferredSkills]
        .flatMap((item) => compactStringArray(item.ResumeEvidenceTerms || item.resumeEvidenceTerms))
    )),
    [view.mandatorySkills, view.preferredSkills]
  );
  const canUseComparisonWorkspace = !isEmbedded;
  const isComparisonOpen = canUseComparisonWorkspace && Boolean(comparisonMode);
  const comparisonJobUrl = useMemo(() => buildJobAnalysisComparisonUrl(router.asPath), [router.asPath]);
  const interactiveComparisonUrl = useMemo(() => buildInteractiveComparisonUrl(router.asPath), [router.asPath]);

  useEffect(() => {
    if (!interactiveComparisonOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInteractiveComparisonOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [interactiveComparisonOpen]);
  const sellingPoints = compactStringArray(view.submissionSummary?.sellingPoints);
  const hasCandidateSummary = valueOrDash(view.submissionSummary?.candidateSummary) !== "-";
  const hasSubmissionNotes = valueOrDash(view.submissionSummary?.submissionNotes) !== "-";
  const hasAuditSummary = view.summary !== "-";
  const hasDecisionReason = view.decisionReason !== "-";
  const additionalRequirementSkills = getAdditionalRequirementSkills(view.mandatorySkills, view.preferredSkills);
  const skillsRequirementItems = [...view.mandatorySkills, ...additionalRequirementSkills];
  const hasSkillsRequirementCoverage = skillsRequirementItems.length > 0;
  const hasExecutiveInsights =
    compactStringArray(view.executiveInsights?.whyRecommended).length > 0 ||
    compactStringArray(view.executiveInsights?.whyNotPerfect).length > 0;
  const whyRecommendedItems = compactStringArray(view.executiveInsights?.whyRecommended);
  const whyNotPerfectItems = compactStringArray(view.executiveInsights?.whyNotPerfect);
  const showRiskFirst = ["medium", "low"].includes(view.submissionPriority.toLowerCase());
  const insightPanels = [
    {
      key: "recommended",
      title: "Why Recommended",
      tone: "green" as Tone,
      items: whyRecommendedItems,
    },
    {
      key: "not-perfect",
      title: "Why Not Perfect",
      tone: "orange" as Tone,
      items: whyNotPerfectItems,
    },
  ].sort((left, right) => {
    if (!showRiskFirst) return 0;
    if (left.key === "not-perfect") return -1;
    if (right.key === "not-perfect") return 1;
    return 0;
  });
  const candidateSnapshotSummary = getSnapshotSummary(view.candidateSnapshot);
  const candidateSnapshotPoints = getSnapshotPoints(view.candidateSnapshot);
  const hasCandidateSnapshot = candidateSnapshotSummary !== "-" || candidateSnapshotPoints.length > 0;
  const snapshotSummaryCopy = candidateSnapshotSummary !== "-" ? candidateSnapshotSummary : "";
  const snapshotPointsCopy = candidateSnapshotPoints.map((item) => `- ${item}`).join("\n");
  const locationForTemplate =
    view.location !== "-" && view.commuteStatus.toLowerCase() === "near" && view.commuteDistanceLabel !== "-"
      ? `${view.location} (${view.commuteDistanceLabel})`
      : view.location;
  const candidateSnapshotEmailPlainText = [
    "Hi,",
    "",
    candidateSnapshotSummary !== "-" ? candidateSnapshotSummary : "",
    "",
    "Candidate Information",
    `Candidate Name: ${view.candidateName}`,
    `Job Title: ${view.jobTitle}`,
    `Current Company: ${view.currentCompany}`,
    `Total Experience: ${view.experience}`,
    `Location: ${locationForTemplate}`,
    "",
    "Candidate snapshot:",
    ...candidateSnapshotPoints.map((item) => `- ${item}`),
    "",
    "Regards,",
  ].filter((line, index, lines) => !(line === "" && lines[index - 1] === "")).join("\n");
  const candidateSnapshotEmailTemplate = renderTemplate(CANDIDATE_SNAPSHOT_EMAIL_TEMPLATE, {
    SummaryBlock: candidateSnapshotSummary !== "-" ? `<p style="margin: 0 0 16px;">${escapeHtml(candidateSnapshotSummary)}</p>` : "",
    CandidateName: escapeHtml(view.candidateName),
    JobTitle: escapeHtml(view.jobTitle),
    CurrentCompany: escapeHtml(view.currentCompany),
    TotalExperience: escapeHtml(view.experience),
    Location: escapeHtml(locationForTemplate),
    SnapshotBlock: candidateSnapshotPoints.length > 0 ? `
      <div style="margin: 0 0 16px;">
        <div style="margin: 0 0 8px; color: #0d5fec; font-weight: 700;">Candidate Snapshot</div>
        <ul style="margin: 0; padding-left: 20px;">
          ${candidateSnapshotPoints.map((item) => `<li style="margin: 0 0 6px;">${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    ` : "",
  });

  const copyText = async (text: string, label: string) => {
    if (!text.trim()) {
      toast.info(`${label} is not available.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied.`);
    } catch (error) {
      console.error(`[ResumeAudit Page] Unable to copy ${label}`, error);
      toast.error(`Unable to copy ${label}.`);
    }
  };

  const copyHtml = async (html: string, plainText: string, label: string) => {
    if (!html.trim()) {
      toast.info(`${label} is not available.`);
      return;
    }

    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plainText], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(html);
      }
      toast.success(`${label} copied.`);
    } catch (error) {
      console.error(`[ResumeAudit Page] Unable to copy ${label}`, error);
      toast.error(`Unable to copy ${label}.`);
    }
  };

  const openQuestionPopover = (title: string, groups: QuestionGroup[], anchor: HTMLElement) => {
    if (isEmbedded) {
      const card = anchor.closest(".ra-screening-card") as HTMLElement | null;
      const cardRect = card?.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();

      if (cardRect) {
        setQuestionPopoverPosition({
          left: window.innerWidth / 2 - cardRect.left,
          top: anchorRect.bottom - cardRect.top + 8,
        });
      }
    }

    setQuestionPopover({ title, groups });
  };

  const closeQuestionPopover = () => {
    setQuestionPopover(null);
    setQuestionPopoverPosition(null);
  };

  const startComparisonResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isComparisonOpen) return;

    event.preventDefault();
    setIsComparisonResizing(true);

    const updateSplit = (clientX: number) => {
      const rect = comparisonWorkspaceRef.current?.getBoundingClientRect();
      if (!rect?.width) return;

      const rawPercent = ((clientX - rect.left) / rect.width) * 100;
      const clampedPercent = Math.min(70, Math.max(45, rawPercent));
      setComparisonLeftPercent(Number(clampedPercent.toFixed(1)));
    };

    updateSplit(event.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => updateSplit(moveEvent.clientX);
    const stopResize = () => {
      setIsComparisonResizing(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  };

  const exportPdf = async () => {
    if (typeof window === "undefined") return;

    const target = document.querySelector<HTMLElement>(".ra-pdf-template");
    if (!target) {
      toast.error("Resume audit content is not available.");
      return;
    }

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      document.body.classList.add("ra-exporting-pdf");
      const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: "#f6f8fc" });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Resume-Audit-${view.jobId}-${valueOrDash(requestPayload?.candidateId)}.pdf`);
    } catch (error) {
      console.error("[ResumeAudit Page] PDF export failed", error);
      toast.error("Unable to export PDF.");
    } finally {
      document.body.classList.remove("ra-exporting-pdf");
    }
  };

  if (loading) {
    return (
      <main className="ra-page ra-loader-page">
        <Box className="ra-loader-card">
          <Box className="ra-loader-icon">
            <AutoAwesomeIcon />
          </Box>
          <Typography className="ra-loader-title">Resume Audit</Typography>
          <Chip size="small" className="ra-ai-chip" icon={<AutoAwesomeIcon />} label="Insights by RAD IQ" />
        </Box>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="ra-page">
        <Box className="ra-shell">
          <AnalysisErrorState
            title="Resume Audit"
            error={analysisError || { message: "No resume audit data is available for this request." }}
            guidance="Verify the candidate, job, and user details in the link, then try again."
            onRetry={requestPayload ? () => router.reload() : undefined}
          />
        </Box>
      </main>
    );
  }

  return (
    <main className={`ra-page ${isComparisonOpen ? "ra-comparison-open" : ""} ${isComparisonResizing ? "ra-comparison-resizing" : ""}`}>
      <Box className="ra-comparison-workspace" ref={comparisonWorkspaceRef}>
      <Box
        className="ra-shell ra-pdf-template ra-audit-pane"
        style={isComparisonOpen ? { flexBasis: `${comparisonLeftPercent}%` } : undefined}
      >
        <Box className="ra-topbar">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography className="ra-page-title">Resume Assessment</Typography>
            <Chip size="small" className="ja-ai-chip ja-title-ai-chip ra-title-ai-chip" icon={<AutoAwesomeIcon />} label="RAD IQ" />
          </Stack>
          <Stack direction="row" spacing={0.8} alignItems="center" className="ra-topbar-actions">
            {canUseComparisonWorkspace && (
              <>
                <Button
                  className="ra-secondary-btn ra-compare-btn"
                  variant="outlined"
                  startIcon={<CompareArrowsOutlinedIcon />}
                  onClick={() => setInteractiveComparisonOpen(true)}
                >
                  JD vs Resume
                </Button>
                {view.resumeFileUrl !== "-" && (
                  <Button
                    className={`ra-secondary-btn ra-compare-btn ${comparisonMode === "resume" ? "ra-compare-active" : ""}`}
                    variant="outlined"
                    startIcon={<DescriptionOutlinedIcon />}
                    onClick={() => {
                      setResumeHighlightSelection(null);
                      setComparisonMode("resume");
                    }}
                  >
                    Compare Resume
                  </Button>
                )}
                <Button
                  className={`ra-secondary-btn ra-compare-btn ${comparisonMode === "job" ? "ra-compare-active" : ""}`}
                  variant="outlined"
                  startIcon={<CompareArrowsOutlinedIcon />}
                  onClick={() => setComparisonMode("job")}
                >
                  Compare JD Analysis
                </Button>
              </>
            )}
            <Button className="ra-export-btn" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportPdf}>
              Export PDF
            </Button>
          </Stack>
        </Box>

        <Card className="ra-hero-card">
          <Box className="ra-hero">
            <Stack direction="row" spacing={1.4} alignItems="flex-start" className="ra-candidate-block">
              <Box className="ra-avatar">{view.initials}</Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography className="ra-candidate-name">{view.candidateName}</Typography>
                  <Chip size="small" className={`ra-status-chip ra-status-${view.recommendationTone}`} label={view.recommendation} />
                </Stack>
                <Stack className="ra-meta-lines" spacing={0.7}>
                  <InlineMeta icon={<BusinessCenterOutlinedIcon />} text={`${view.titleCompanyDisplay} | ${view.experience}`} />
                  <InlineMeta icon={<MailOutlineOutlinedIcon />} text={view.email} />
                  <InlineMeta icon={<PhoneOutlinedIcon />} text={view.phone} />
                  <CandidateLocationMeta
                    location={view.location}
                    commuteDistanceLabel={view.commuteDistanceLabel}
                    commuteStatus={view.commuteStatus}
                    commuteTone={view.commuteTone}
                    distanceAnalysis={view.commuteDistanceAnalysis}
                  />
                  <InlineMeta icon={<WorkspacePremiumOutlinedIcon />} text={view.workAuthorization !== "-" ? `Work Authorization: ${view.workAuthorization}` : "-"} />
                  <InlineMeta icon={<PaidOutlinedIcon />} text={view.expectedSalaryDisplay !== "-" ? `Expected Salary: ${view.expectedSalaryDisplay}` : "-"} />
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.4} alignItems="flex-start" className="ra-target-block">
              <Box className="ra-job-bubble">
                <BusinessCenterOutlinedIcon />
              </Box>
              <Box minWidth={0}>
                <Typography className="ra-target-title">{view.jobTitle}</Typography>
                <Stack className="ra-target-meta-lines" spacing={0.7}>
                  <LabeledMeta label="Job ID" value={view.jobId} />
                  <LabeledMeta label="Client" value={view.client} />
                  <LabeledMeta label="Industry" value={view.industry} />
                  <LabeledMeta label="Location" value={view.jobLocationWorkModel} />
                  <LabeledMeta label="Budget" value={view.jobBudget} />
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Card>

        <Box className="ra-summary-grid">
          <Card className="ra-score-card">
            <ScoreRing value={view.overallScore} />
            <Box>
              <Typography className="ra-card-kicker">Overall Match Score</Typography>
              <Typography className={`ra-score-label ra-tone-${view.recommendationTone}`}>{view.recommendation}</Typography>
              <Typography className="ra-body-text">Confidence: {view.confidence}</Typography>
            </Box>
          </Card>
          <MetricCard
            icon={<FlagOutlinedIcon />}
            title="Submission Priority"
            value={view.submissionPriority}
            tone={getSeverityTone(view.submissionPriority)}
            valueTooltip={view.decisionReason}
          />
          <MetricCard icon={<TrendingUpOutlinedIcon />} title="Interview Probability" value={`${view.interviewProbability}%`} tone="blue" />
          {view.hasCandidateSalary && (
            <MetricCard
              icon={<PaidOutlinedIcon />}
              title="Salary Match"
              value={view.salaryMatchScoreDisplay}
              tone={view.salaryMatchTone}
              helper={view.salaryMatchStatus}
              valueTooltip={view.salaryMatchTooltip}
              className="ra-salary-match-metric"
            />
          )}
        </Box>

        {view.nextRecommendedAction !== "-" && (
          <Card className="ra-next-action-row">
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Box className="ra-next-action-icon">
                <AutoAwesomeIcon />
              </Box>
              <Box minWidth={0}>
                <Typography className="ra-next-action-label">Next Recommended Action</Typography>
                <Typography className="ra-next-action-text">{view.nextRecommendedAction}</Typography>
              </Box>
            </Stack>
          </Card>
        )}

        {(hasCandidateSummary || hasSubmissionNotes) && (
          <Box className="ra-half-grid ra-note-grid">
            {hasCandidateSummary && (
              <Card className="ra-note-panel">
                <InfoTitle icon={<PersonOutlinedIcon />} title="Candidate Profile" />
                <Typography className="ra-body-text" sx={{ whiteSpace: "pre-line" }}>{valueOrDash(view.submissionSummary?.candidateSummary)}</Typography>
              </Card>
            )}
            {hasSubmissionNotes && (
              <Card className="ra-note-panel">
                <InfoTitle icon={<ContentCopyOutlinedIcon />} title="Submission Notes" />
                <Typography className="ra-body-text" sx={{ whiteSpace: "pre-line" }}>{valueOrDash(view.submissionSummary?.submissionNotes)}</Typography>
              </Card>
            )}
          </Box>
        )}

        {(hasAuditSummary || hasDecisionReason) && (
          <Box className="ra-half-grid ra-note-grid">
            {hasAuditSummary && (
              <Card className="ra-note-panel">
                <InfoTitle icon={<AutoAwesomeIcon />} title="Candidate Assessment" />
                <Typography className="ra-body-text" sx={{ whiteSpace: "pre-line" }}>{view.summary}</Typography>
              </Card>
            )}
            {hasDecisionReason && (
              <Card className="ra-note-panel">
                <InfoTitle icon={<InfoOutlinedIcon />} title="Decision Reason" />
                <Typography className="ra-body-text" sx={{ whiteSpace: "pre-line" }}>{view.decisionReason}</Typography>
              </Card>
            )}
          </Box>
        )}

        {hasExecutiveInsights && (
          <Card className="ra-executive-card">
            <InfoTitle icon={<AutoAwesomeIcon />} title="Executive Insights" />
            <Box className="ra-insight-grid">
              {insightPanels.map((panel) => (
                panel.items.length > 0 && <InsightList title={panel.title} tone={panel.tone} items={panel.items} key={panel.key} />
              ))}
            </Box>
          </Card>
        )}

        <Box className="ra-coverage-grid">
          {view.scoreBreakdown.length > 0 && <Card>
            <InfoTitle
              icon={<TrendingUpOutlinedIcon />}
              title="Score Breakdown"
              tooltip={
                <Stack spacing={0.7}>
                  {view.scoreBreakdown.map((item) => (
                    <Typography className="ra-tooltip-text" key={item.displayName || item.DisplayName || item.type || item.Type || item.message || item.Message || "score"}>
                      {valueOrDash(item.displayName || item.DisplayName || item.type || item.Type)}: {valueOrDash(item.score ?? item.Score)} / {valueOrDash(getScoreBreakdownMaximum(item))}, Weight {valueOrDash(item.weight ?? item.Weight)}%
                    </Typography>
                  ))}
                </Stack>
              }
            />
            <Stack spacing={0.25}>
              {view.scoreBreakdown.map((item) => (
                <ScoreBreakdownRow key={item.displayName || item.DisplayName || item.type || item.Type || item.message || item.Message || Math.random()} item={item} />
              ))}
            </Stack>
          </Card>}

          {hasSkillsRequirementCoverage && <Card>
            <InfoTitle icon={<PsychologyOutlinedIcon />} title="Skills & Requirement Coverage" />
            <SkillTable
              items={skillsRequirementItems}
              highlightingEnabled={comparisonMode === "resume"}
              activeSkillId={resumeHighlightSelection?.id}
              onSelectEvidence={(item) => {
                const terms = compactStringArray(item.ResumeEvidenceTerms || item.resumeEvidenceTerms);
                if (!terms.length) return;
                setResumeHighlightSelection({
                  id: `audit-skill-${valueOrDash(item.skill)}`,
                  label: valueOrDash(item.skill),
                  aliases: terms,
                });
              }}
            />
          </Card>}

          {view.questionGroups.length > 0 && <Card className="ra-screening-card">
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} className="ra-screening-header">
              <InfoTitle icon={<ManageSearchOutlinedIcon />} title="Screening Questions" />
              <label className="ra-question-sort">
                <span>Sort by</span>
                <select value={questionSort} onChange={(event) => setQuestionSort(event.target.value as QuestionSort)}>
                  <option value="priority">Priority</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="default">Default Order</option>
                </select>
              </label>
            </Stack>
            <Stack spacing={0.8}>
              {view.questionGroups.map((group) => (
                <Stack className="ra-question-count-row" direction="row" justifyContent="space-between" alignItems="center" key={group.key}>
                  <Typography className="ra-body-text">{group.title}</Typography>
                  <button
                    className="ra-question-count-btn"
                    type="button"
                    onClick={(event) => openQuestionPopover(group.title, [group], event.currentTarget)}
                  >
                    {Math.min(QUESTION_PAGE_SIZE, group.items.length)}
                  </button>
                </Stack>
              ))}
            </Stack>
            <button
              className="ra-question-view-all"
              type="button"
              onClick={(event) => openQuestionPopover("All Screening Questions", view.questionGroups, event.currentTarget)}
            >
              View All Questions
            </button>
            {isEmbedded && questionPopover && questionPopoverPosition && (
              <Box className="ra-embedded-questions-overlay" style={{ left: questionPopoverPosition.left, top: questionPopoverPosition.top }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} className="ra-embedded-questions-title">
                  <Typography className="ra-row-strong">{questionPopover.title}</Typography>
                  <IconButton aria-label="Close screening question" onClick={closeQuestionPopover}>
                    <CloseOutlinedIcon />
                  </IconButton>
                </Stack>
                <QuestionGroupDetail groups={questionPopover.groups} sort={questionSort} />
              </Box>
            )}
          </Card>}
        </Box>

        {(view.concerns.length > 0 || view.clientConcerns.length > 0) && (
          <Box className="ra-half-grid">
            {view.concerns.length > 0 && <Card>
              <InfoTitle icon={<ReportProblemOutlinedIcon />} title="Recruiter Alerts" />
              <Stack spacing={0.8}>
                {view.concerns.map((item) => (
                  <ConcernItem key={`${item.type}-${item.message}`} item={item} />
                ))}
              </Stack>
            </Card>}

            {view.clientConcerns.length > 0 && <Card>
              <InfoTitle icon={<ReportProblemOutlinedIcon />} title="Client Concerns" />
              <BulletList items={view.clientConcerns} tone="orange" />
            </Card>}
          </Box>
        )}

        {([...view.strengths, ...view.additionalStrengthSkills].length > 0 || sellingPoints.length > 0) && (
          <Box className="ra-half-grid">
            {[...view.strengths, ...view.additionalStrengthSkills].length > 0 && <Card>
              <InfoTitle icon={<WorkspacePremiumOutlinedIcon />} title="Top Candidate Strengths" />
              <BulletList items={[...view.strengths, ...view.additionalStrengthSkills].slice(0, 7)} tone="green" />
            </Card>}

            {sellingPoints.length > 0 && <Card>
              <InfoTitle icon={<CheckCircleOutlineOutlinedIcon />} title="Candidate Selling Points" />
              <BulletList items={sellingPoints} tone="green" />
            </Card>}
          </Box>
        )}

        {hasCandidateSnapshot && (
          <Card className="ra-full-section ra-candidate-snapshot-card">
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.2} className="ra-section-title-row">
              <InfoTitle icon={<DescriptionOutlinedIcon />} title="Candidate Snapshot" />
              <Stack direction="row" spacing={0.7} alignItems="center" className="ra-snapshot-actions">
                <Button
                  className="ra-copy-btn"
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyOutlinedIcon />}
                  onClick={() => copyText(snapshotSummaryCopy, "Candidate snapshot summary")}
                >
                  Summary
                </Button>
                <Button
                  className="ra-copy-btn"
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyOutlinedIcon />}
                  onClick={() => copyText(snapshotPointsCopy, "Candidate snapshot points")}
                >
                  Points
                </Button>
                <Button
                  className="ra-copy-btn"
                  variant="outlined"
                  size="small"
                  startIcon={<MailOutlineOutlinedIcon />}
                  onClick={() => copyHtml(candidateSnapshotEmailTemplate, candidateSnapshotEmailPlainText, "Client email template")}
                >
                  Email
                </Button>
              </Stack>
            </Stack>
            {candidateSnapshotSummary !== "-" && (
              <Typography className="ra-body-text ra-snapshot-summary">{candidateSnapshotSummary}</Typography>
            )}
            {candidateSnapshotPoints.length > 0 && (
              <Box className="ra-snapshot-points">
                <BulletList items={candidateSnapshotPoints} tone="blue" />
              </Box>
            )}
          </Card>
        )}

        {improvementSections.length > 0 && <Card className="ra-full-section">
          <InfoTitle icon={<HelpOutlineOutlinedIcon />} title="Resume Improvement Suggestions" />
          <ImprovementSections sections={improvementSections} />
        </Card>}

        {!isEmbedded && (
          <Dialog open={Boolean(questionPopover)} onClose={closeQuestionPopover} fullWidth maxWidth="md">
            <DialogTitle className="ra-dialog-title">
              {questionPopover?.title || "Screening Questions"}
              <IconButton aria-label="Close screening questions" onClick={closeQuestionPopover}>
                <CloseOutlinedIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {questionPopover && <QuestionGroupDetail groups={questionPopover.groups} sort={questionSort} />}
            </DialogContent>
          </Dialog>
        )}
      </Box>
      {isComparisonOpen && (
        <button
          type="button"
          className="ra-comparison-resize-handle"
          aria-label="Resize comparison panel"
          onPointerDown={startComparisonResize}
        />
      )}
      {isComparisonOpen && (
        <ComparisonPanel
          mode={comparisonMode}
          resumeUrl={view.resumeFileUrl}
          jobAnalysisUrl={comparisonJobUrl}
          widthPercent={100 - comparisonLeftPercent}
          onClose={() => {
            setComparisonMode(null);
            setResumeHighlightSelection(null);
          }}
          resumeSelection={resumeHighlightSelection}
          resumeEvidenceTerms={resumeAuditEvidenceTerms}
          onClearResumeSelection={() => setResumeHighlightSelection(null)}
        />
      )}
      </Box>
      {interactiveComparisonOpen && (
        <Box className="ra-interactive-overlay" role="dialog" aria-modal="true" aria-label="JD versus resume comparison">
          <Box className="ra-interactive-overlay-header">
            <Stack direction="row" spacing={1} alignItems="center">
              <Box className="ra-comparison-icon"><CompareArrowsOutlinedIcon /></Box>
              <Box>
                <Typography className="ra-comparison-title">JD vs Resume</Typography>
                <Typography className="ra-comparison-subtitle">Interactive skill and job title comparison</Typography>
              </Box>
            </Stack>
            <IconButton aria-label="Close JD versus resume comparison" onClick={() => setInteractiveComparisonOpen(false)} className="ra-interactive-overlay-close">
              <CloseOutlinedIcon />
            </IconButton>
          </Box>
          <iframe className="ra-interactive-overlay-frame" title="JD versus interactive resume" src={interactiveComparisonUrl} />
        </Box>
      )}
    </main>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Paper className={`ra-card ${className}`} elevation={0}>{children}</Paper>;
}

function ComparisonPanel({
  mode,
  resumeUrl,
  jobAnalysisUrl,
  widthPercent,
  onClose,
  resumeSelection,
  resumeEvidenceTerms,
  onClearResumeSelection,
}: {
  mode: ComparisonMode;
  resumeUrl: string;
  jobAnalysisUrl: string;
  widthPercent: number;
  onClose: () => void;
  resumeSelection: ResumeHighlightSelection | null;
  resumeEvidenceTerms: string[];
  onClearResumeSelection: () => void;
}) {
  const isResume = mode === "resume";
  const title = isResume ? "Resume" : "JD Analysis";
  const sourceUrl = isResume ? resumeUrl : jobAnalysisUrl;
  const frameUrl = isResume ? getResumeDocumentFrameUrl(sourceUrl) : sourceUrl && sourceUrl !== "-" ? encodeURI(sourceUrl) : "";

  return (
    <Box
      className="ra-comparison-panel"
      aria-label={`${title} comparison panel`}
      style={{ flexBasis: `calc(${widthPercent}% - 9px)`, maxWidth: `calc(${widthPercent}% - 9px)` }}
    >
      <Box className="ra-comparison-header">
        <Stack direction="row" spacing={0.8} alignItems="center" minWidth={0}>
          <Box className="ra-comparison-icon">
            {isResume ? <DescriptionOutlinedIcon /> : <CompareArrowsOutlinedIcon />}
          </Box>
          <Box minWidth={0}>
            <Typography className="ra-comparison-title">Compare {title}</Typography>
            <Typography className="ra-comparison-subtitle" noWrap>
              {isResume ? "Candidate resume document" : "Job analysis workspace"}
            </Typography>
          </Box>
        </Stack>
        <IconButton aria-label="Close comparison" onClick={onClose} className="ra-comparison-close">
          <CloseOutlinedIcon />
        </IconButton>
      </Box>
      <Box className="ra-comparison-body">
        {isResume && sourceUrl && sourceUrl !== "-" ? (
          <InteractiveResumeViewer
            url={sourceUrl}
            selection={resumeSelection}
            evidenceTerms={resumeEvidenceTerms}
            onClearSelection={onClearResumeSelection}
          />
        ) : frameUrl ? (
          <iframe className="ra-comparison-frame" title={`Compare ${title}`} src={frameUrl} />
        ) : (
          <Box className="ra-comparison-empty">
            <Typography className="ra-row-strong">{title} is not available.</Typography>
            <Typography className="ra-muted">The comparison source was not included in the audit response.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function InfoTitle({ icon, title, tooltip }: { icon: ReactNode; title: string; tooltip?: ReactNode }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.8} className="ra-info-title">
      <span>{icon}</span>
      <Typography>{title}</Typography>
      {tooltip && (
        <Tooltip title={tooltip} arrow placement="top">
          <HelpOutlineOutlinedIcon className="ra-title-help" />
        </Tooltip>
      )}
    </Stack>
  );
}

function InlineMeta({ icon, text }: { icon: ReactNode; text: string }) {
  if (text === "-") return null;
  return (
    <Stack direction="row" spacing={0.7} alignItems="center" className="ra-inline-meta">
      {icon}
      <Typography>{text}</Typography>
    </Stack>
  );
}

function CandidateLocationMeta({
  location,
  commuteDistanceLabel,
  commuteStatus,
  commuteTone,
  distanceAnalysis,
}: {
  location: string;
  commuteDistanceLabel: string;
  commuteStatus: string;
  commuteTone: Tone;
  distanceAnalysis: string;
}) {
  if (location === "-") return null;

  const showDistanceBadge = commuteDistanceLabel !== "-" && commuteStatus.toLowerCase() !== "remote";
  const tooltipTitle = (
    <Box className="ra-skill-tooltip">
      <Typography className={`ra-commute-tooltip-status ra-alert-${commuteTone}`}>
        {commuteStatus}
      </Typography>
      <Box>
        <Typography className="ra-skill-tooltip-heading">Distance Analysis</Typography>
        <Typography>{distanceAnalysis}</Typography>
      </Box>
    </Box>
  );

  return (
    <Stack direction="row" spacing={0.7} alignItems="center" className="ra-inline-meta ra-location-meta">
      <PlaceOutlinedIcon />
      <Typography>{location}</Typography>
      {showDistanceBadge && (
        <Tooltip title={tooltipTitle} arrow placement="top">
          <Chip size="small" className={`ra-commute-chip ra-commute-${commuteTone}`} label={commuteDistanceLabel} />
        </Tooltip>
      )}
    </Stack>
  );
}

function LabeledMeta({ label, value }: { label: string; value: string }) {
  if (value === "-") return null;
  return (
    <Typography className="ra-labeled-meta">
      <span>{label}:</span> {value}
    </Typography>
  );
}

function ScoreRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value || 0));
  return (
    <Box className="ra-score-ring" style={{ "--score": `${clamped}%` } as React.CSSProperties}>
      <strong>{clamped}</strong>
      <span>/100</span>
    </Box>
  );
}

function MetricCard({
  icon,
  title,
  value,
  tone,
  helper,
  valueTooltip,
  className,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  tone: Tone;
  helper?: string;
  valueTooltip?: string;
  className?: string;
}) {
  const valueNode = <Typography className={`ra-metric-value ra-tone-${tone}`}>{value}</Typography>;

  return (
    <Card className={`ra-metric-card${className ? ` ${className}` : ""}`}>
      <Box className={`ra-metric-icon ra-tone-box-${tone}`}>{icon}</Box>
      <Box>
        <Typography className="ra-card-kicker">{title}</Typography>
        {valueTooltip && valueTooltip !== "-" ? (
          <Tooltip title={valueTooltip} arrow placement="top">
            <span className="ra-tooltip-inline">{valueNode}</span>
          </Tooltip>
        ) : valueNode}
        {helper && helper !== "-" && <Typography className="ra-body-text ra-clamp-2">{helper}</Typography>}
      </Box>
    </Card>
  );
}

function DetailRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <Stack className="ra-detail-rows" spacing={0.8}>
      {rows.filter(([, value]) => value !== "-").map(([label, value]) => (
        <Stack key={label} direction="row" justifyContent="space-between" spacing={1.5}>
          <Typography className="ra-muted">{label}</Typography>
          <Box className="ra-detail-value">{value}</Box>
        </Stack>
      ))}
    </Stack>
  );
}

function InsightList({ title, items, tone }: { title: string; items: string[]; tone: Tone }) {
  return (
    <Box className={`ra-insight-panel ra-tone-box-${tone}`}>
      <Typography className="ra-label">{title}</Typography>
      <BulletList items={items} tone={tone} compact />
    </Box>
  );
}

function ScoreBreakdownRow({ item }: { item: NonNullable<ResumeAuditResponse["scoreBreakdown"]>[number] }) {
  const scorePercentage = normalizeScorePercentage(item.scorePercentage ?? item.ScorePercentage);
  const displayName = item.displayName || item.DisplayName || item.type || item.Type;
  const score = item.score ?? item.Score;
  const maxScore = getScoreBreakdownMaximum(item);
  const tone = getSeverityTone(item.severity || item.Severity);
  const message = item.message || item.Message;
  const tooltipTitle = (
    <Box className="ra-skill-tooltip">
      <Typography className="ra-skill-tooltip-heading">Score: {valueOrDash(score)}/{valueOrDash(maxScore)}</Typography>
      <Box>
        <Typography className="ra-skill-tooltip-heading">Message</Typography>
        <Typography>{valueOrDash(message)}</Typography>
      </Box>
    </Box>
  );

  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      <Box className="ra-score-row ra-score-row-tooltip">
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Typography className="ra-body-text">{valueOrDash(displayName)}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box className="ra-progress-track"><span className={`ra-progress-bar ra-progress-${tone}`} style={{ width: `${Math.max(0, Math.min(100, scorePercentage))}%` }} /></Box>
          <Typography className="ra-row-strong">{formatPercent(scorePercentage)}</Typography>
        </Stack>
      </Box>
    </Tooltip>
  );
}

function SkillTable({ items, compact = false, highlightingEnabled = false, activeSkillId, onSelectEvidence }: { items: ResumeAuditSkill[]; compact?: boolean; highlightingEnabled?: boolean; activeSkillId?: string; onSelectEvidence?: (item: ResumeAuditSkill) => void }) {
  const visibleItems = compact ? items.slice(0, 6) : items;

  if (!visibleItems.length) {
    return <Typography className="ra-muted">No skill coverage available.</Typography>;
  }

  return (
    <Box className={compact ? "ra-skill-table ra-skill-table-compact" : "ra-skill-table"}>
      <Box className="ra-skill-table-head">
        <span>Skill</span>
        <span>Match</span>
        <span>Exp</span>
        <span>LastUsed</span>
        <span>Confidence</span>
      </Box>
      {visibleItems.map((item) => (
        <SkillTableRow item={item} key={valueOrDash(item.skill)} highlightingEnabled={highlightingEnabled} active={activeSkillId === `audit-skill-${valueOrDash(item.skill)}`} onSelectEvidence={onSelectEvidence} />
      ))}
    </Box>
  );
}

function SkillTableRow({ item, highlightingEnabled = false, active = false, onSelectEvidence }: { item: ResumeAuditSkill; highlightingEnabled?: boolean; active?: boolean; onSelectEvidence?: (item: ResumeAuditSkill) => void }) {
  const evidence = compactStringArray(item.evidence);
  const resumeEvidenceTerms = compactStringArray(item.ResumeEvidenceTerms || item.resumeEvidenceTerms);
  const experience = formatSkillExperience(item.experience || item.Experience);
  const yearLastUsed = formatYearLastUsed(item.YearLastUsed ?? item.yearLastUsed);
  const categoryLabel = item.skillCategory?.replace(/\s+Skills$/, "") || "";
  const categoryTone = item.skillCategory === "Mandatory Skills" ? "red" : item.skillCategory === "Preferred Skills" ? "blue" : "gray";
  const tooltipTitle = (
    <Box className="ra-skill-tooltip">
      {(experience !== "-" || categoryLabel) && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography>{experience !== "-" ? experience : "Experience not specified"}</Typography>
          {categoryLabel && <Chip size="small" className={`ra-severity-chip ra-severity-${categoryTone}`} label={categoryLabel} />}
        </Stack>
      )}
      {evidence.length ? (
        <Box>
          <Typography className="ra-skill-tooltip-heading">Evidence</Typography>
          {evidence.map((entry) => (
            <Typography key={entry}>{entry}</Typography>
          ))}
        </Box>
      ) : (
        <Typography>No evidence found.</Typography>
      )}
      {resumeEvidenceTerms.length > 0 && (
        <Box>
          <Typography className="ra-skill-tooltip-heading">Resume evidence terms</Typography>
          {resumeEvidenceTerms.map((term) => <Typography key={term}>{term}</Typography>)}
        </Box>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      <Box
        className={`ra-skill-table-row ${highlightingEnabled && resumeEvidenceTerms.length ? "ra-skill-table-row-clickable" : ""} ${active ? "ra-skill-table-row-active" : ""}`}
        role={highlightingEnabled && resumeEvidenceTerms.length ? "button" : undefined}
        tabIndex={highlightingEnabled && resumeEvidenceTerms.length ? 0 : undefined}
        onClick={() => highlightingEnabled && resumeEvidenceTerms.length && onSelectEvidence?.(item)}
        onKeyDown={(event) => {
          if (highlightingEnabled && resumeEvidenceTerms.length && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onSelectEvidence?.(item);
          }
        }}
      >
        <Typography className="ra-row-strong">{valueOrDash(item.skill)}</Typography>
        <span className={`ra-match-dot ${item.matched ? "ra-match-yes" : "ra-match-no"}`}>{item.matched ? "Yes" : "No"}</span>
        <Typography className="ra-row-strong">{experience}</Typography>
        <Typography className="ra-row-strong">{yearLastUsed}</Typography>
        <Typography className="ra-row-strong">{formatPercent(item.confidence)}</Typography>
      </Box>
    </Tooltip>
  );
}

function ConcernItem({ item }: { item: NonNullable<ResumeAuditResponse["candidateConcerns"]>[number] }) {
  const tone = getSeverityTone(item.severity);
  return (
    <Box className={`ra-alert-row ra-alert-${tone}`}>
      <Stack direction="row" spacing={0.8} alignItems="flex-start">
        <ReportProblemOutlinedIcon />
        <Box className="ra-alert-copy">
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography className="ra-row-strong">{valueOrDash(item.message)}</Typography>
            <Chip size="small" className={`ra-severity-chip ra-severity-${tone}`} label={valueOrDash(item.severity)} />
          </Stack>
          <Typography className="ra-body-text">{valueOrDash(item.recommendation)}</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function ImprovementSections({ sections }: { sections: ReturnType<typeof getImprovementSections> }) {
  return (
    <Box className="ra-improvement-grid">
      {sections.map((section) => (
        <Box className="ra-improvement-panel" key={section.title}>
          <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="space-between">
            <Typography className="ra-row-strong">{section.title}</Typography>
            <Chip size="small" className={`ra-severity-chip ra-severity-${section.tone}`} label={section.items.length} />
          </Stack>
          {section.variant === "tags" ? (
            <Box className="ra-keyword-cloud">
              {section.items.map((item) => (
                <Chip className="ra-keyword-chip" size="small" label={item} key={item} />
              ))}
            </Box>
          ) : (
            <BulletList items={section.items} tone={section.tone} compact />
          )}
        </Box>
      ))}
    </Box>
  );
}

function BulletList({ items, tone, compact = false }: { items: string[]; tone: Tone; compact?: boolean }) {
  if (!items.length) return <Typography className="ra-muted">No details available.</Typography>;

  return (
    <Stack className={compact ? "ra-bullet-list ra-bullet-list-compact" : "ra-bullet-list"} spacing={0.7}>
      {items.map((item) => (
        <Stack className="ra-bullet-row" direction="row" spacing={0.7} alignItems="flex-start" key={item}>
          <span className={`ra-bullet-dot ra-bullet-${tone}`} />
          <Typography className="ra-body-text">{item}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function QuestionGroupDetail({ groups, sort }: { groups: QuestionGroup[]; sort: QuestionSort }) {
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});

  const showMore = (groupKey: string) => {
    setVisibleCounts((current) => ({
      ...current,
      [groupKey]: (current[groupKey] || QUESTION_PAGE_SIZE) + QUESTION_PAGE_SIZE,
    }));
  };

  return (
    <Stack spacing={groups.length > 1 ? 1.4 : 0.8}>
      {groups.map((group) => {
        const sortedItems = sortQuestions(group.items, sort);
        const visibleCount = visibleCounts[group.key] || QUESTION_PAGE_SIZE;
        const visibleItems = sortedItems.slice(0, visibleCount);

        return (
        <Box className="ra-popup-question-group" key={group.key}>
          {groups.length > 1 && <Typography className="ra-row-strong">{group.title}</Typography>}
          <Stack spacing={0.8} className={groups.length > 1 ? "ra-popup-question-list" : ""}>
            {visibleItems.map((item, index) => (
              <Box className="ra-popup-question-item" key={`${group.key}-${item.question || item.Question}-${index}`}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <span className="ra-question-number">{index + 1}</span>
                  <Box minWidth={0}>
                    <Typography className="ra-body-text">{valueOrDash(item.question || item.Question)}</Typography>
                    <Typography className="ra-muted">{valueOrDash(item.reason || item.Reason)}</Typography>
                    {valueOrDash(item.candidateResponseExpected || item.CandidateResponseExpected) !== "-" && (
                      <Box className="ra-question-expected">
                        <Typography className="ra-question-expected-label">Expected response</Typography>
                        <Typography className="ra-question-expected-text">
                          {valueOrDash(item.candidateResponseExpected || item.CandidateResponseExpected)}
                        </Typography>
                      </Box>
                    )}
                    <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap className="ra-question-badges">
                      <Tooltip title="Priority — possible values: Critical, High, Medium, Low" arrow placement="top">
                        <Chip
                          size="small"
                          className={`ra-severity-chip ra-priority-${normalizeQuestionValue(item.priority || item.Priority) || "unknown"}`}
                          label={valueOrDash(item.priority || item.Priority)}
                        />
                      </Tooltip>
                      <Tooltip title="Difficulty — possible values: Easy, Medium, Hard" arrow placement="top">
                        <Chip
                          size="small"
                          className={`ra-severity-chip ra-difficulty-${normalizeQuestionValue(item.difficulty || item.Difficulty) || "unknown"}`}
                          label={valueOrDash(item.difficulty || item.Difficulty)}
                        />
                      </Tooltip>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
          {visibleCount < sortedItems.length && (
            <Button className="ra-generate-more" variant="outlined" size="small" onClick={() => showMore(group.key)}>
              Generate More
            </Button>
          )}
        </Box>
        );
      })}
    </Stack>
  );
}
