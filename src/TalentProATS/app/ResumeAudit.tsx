import { useEffect, useMemo, useState } from "react";
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
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
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
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  auditResume,
  type ResumeAuditQuestion,
  type ResumeAuditRequest,
  type ResumeAuditResponse,
  type ResumeAuditSkill,
} from "@/TalentProATS/api/resumeAudit";

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

type PopoverPosition = {
  left: number;
  top: number;
};

const emptyArray = <T,>(value?: T[] | null) => (Array.isArray(value) ? value : []);

const compactStringArray = (value?: Array<string | null | undefined> | null) =>
  emptyArray(value).map((item) => String(item || "").trim()).filter(Boolean);

const valueOrDash = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

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

const getPrimaryEmail = (data?: ResumeAuditResponse | null) =>
  emptyArray(data?.candidate?.ContactInfo?.Emails).find((item) => item.Primary)?.Email ||
  data?.candidate?.ContactInfo?.Emails?.[0]?.Email ||
  "-";

const getPrimaryPhone = (data?: ResumeAuditResponse | null) =>
  emptyArray(data?.candidate?.ContactInfo?.Phones).find((item) => item.Primary)?.Number ||
  data?.candidate?.ContactInfo?.Phones?.[0]?.Number ||
  "-";

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

const getImprovementRows = (data: ResumeAuditResponse["ResumeImprovement"]) => [
  ["Missing Information", compactStringArray(data?.MissingInformation).length],
  ["Keyword Suggestions", compactStringArray(data?.KeywordSuggestions).length],
  ["Achievement Suggestions", compactStringArray(data?.AchievementSuggestions).length],
  ["Project Suggestions", compactStringArray(data?.ProjectSuggestions).length],
  ["Improvement Suggestions", compactStringArray(data?.ImprovementSuggestions).length],
].filter(([, count]) => Number(count) > 0) as Array<[string, number]>;

export default function ResumeAudit() {
  const router = useRouter();
  const [data, setData] = useState<ResumeAuditResponse | null>(null);
  const [requestPayload, setRequestPayload] = useState<ResumeAuditRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [questionPopover, setQuestionPopover] = useState<QuestionPopover | null>(null);
  const [questionPopoverPosition, setQuestionPopoverPosition] = useState<PopoverPosition | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const request = parseResumeAuditRequest(router.query);
    console.log("[ResumeAudit Page] URL query received", router.query);
    console.log("[ResumeAudit Page] Parsed payload", maskRequest(request));

    setRequestPayload(request);
    setErrorMessage("");

    if (!request) {
      setData(null);
      setLoading(false);
      setErrorMessage("Missing resume audit request parameters.");
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
          setErrorMessage("Unable to load resume audit.");
          console.error("[ResumeAudit Page] API error", error);
          toast.error("Unable to load resume audit.");
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

  const view = useMemo(() => {
    const candidate = data?.candidate;
    const job = data?.job;
    const audit = data?.auditResult;
    const salary = candidate?.Salary;
    const hasCandidateSalary = Boolean(
      salary?.CurrentSalary?.Amount !== null && salary?.CurrentSalary?.Amount !== undefined ||
      salary?.ExpectedSalary?.Amount !== null && salary?.ExpectedSalary?.Amount !== undefined ||
      salary?.SalaryMatch?.Score !== null && salary?.SalaryMatch?.Score !== undefined
    );
    const location = [candidate?.location?.city, candidate?.location?.state, candidate?.location?.country].filter(Boolean).join(", ");

    return {
      candidateName: valueOrDash(candidate?.name),
      initials: getInitials(candidate?.name),
      currentTitle: valueOrDash(candidate?.currentTitle),
      currentCompany: valueOrDash(candidate?.currentCompany),
      experience: formatYears(candidate?.experienceYears),
      email: getPrimaryEmail(data),
      phone: getPrimaryPhone(data),
      education: valueOrDash(candidate?.education),
      location: location || "-",
      workAuthorization: compactStringArray(candidate?.WorkAuthorization).join(", ") || "-",
      coreSkills: compactStringArray(candidate?.coreSkills),
      jobTitle: valueOrDash(job?.jobTitle),
      jobId: valueOrDash(job?.jobId || requestPayload?.jobId),
      client: valueOrDash(job?.client),
      industry: valueOrDash(job?.industry),
      jobBudget: formatMoney(job?.salary?.amount, job?.salary?.currency, job?.salary?.type),
      hasCandidateSalary,
      overallScore: audit?.overallScore ?? 0,
      recommendation: formatRecommendation(audit?.recommendation),
      recommendationTone: getRecommendationTone(audit?.recommendation),
      confidence: valueOrDash(audit?.confidence),
      submissionPriority: valueOrDash(audit?.submissionPriority),
      interviewProbability: audit?.interviewProbability ?? 0,
      summary: valueOrDash(audit?.summary),
      decisionReason: valueOrDash(audit?.decisionReason),
      scoreBreakdown: emptyArray(data?.scoreBreakdown),
      mandatorySkills: emptyArray(data?.skillsAnalysis?.mandatorySkills),
      preferredSkills: emptyArray(data?.skillsAnalysis?.preferredSkills),
      softSkills: emptyArray(data?.skillsAnalysis?.softSkills),
      missingSkills: compactStringArray(data?.skillsAnalysis?.missingSkills),
      additionalStrengthSkills: compactStringArray(data?.skillsAnalysis?.additionalStrengthSkills),
      strengths: compactStringArray(data?.strengths),
      concerns: emptyArray(data?.candidateConcerns),
      questionGroups: getQuestionGroups(data),
      resumeImprovement: data?.ResumeImprovement,
      submissionSummary: data?.submissionSummary,
      clientConcerns: compactStringArray(data?.submissionSummary?.clientConcerns),
      executiveInsights: data?.executiveInsights,
      currentSalary: formatMoney(salary?.CurrentSalary?.Amount, salary?.CurrentSalary?.Currency, salary?.CurrentSalary?.Type),
      expectedSalary: formatMoney(salary?.ExpectedSalary?.Amount, salary?.ExpectedSalary?.Currency, salary?.ExpectedSalary?.Type),
      salaryMatchScore: salary?.SalaryMatch?.Score ?? 0,
      salaryMatchStatus: valueOrDash(salary?.SalaryMatch?.Status),
      salaryMatchSummary: valueOrDash(salary?.SalaryMatch?.Summary),
      availableFrom: formatDate(candidate?.Availability?.AvailableFrom),
      noticePeriod: valueOrDash(candidate?.Availability?.NoticePeriod),
      auditedOn: formatDate(data?.auditMetadata?.auditedOn),
    };
  }, [data, requestPayload]);

  const improvementRows = getImprovementRows(view.resumeImprovement);
  const sellingPoints = compactStringArray(view.submissionSummary?.sellingPoints);
  const hasCandidateSummary = valueOrDash(view.submissionSummary?.candidateSummary) !== "-";
  const hasSubmissionNotes = valueOrDash(view.submissionSummary?.submissionNotes) !== "-";
  const hasAuditSummary = view.summary !== "-";
  const hasDecisionReason = view.decisionReason !== "-";
  const hasExecutiveInsights =
    compactStringArray(view.executiveInsights?.whyRecommended).length > 0 ||
    compactStringArray(view.executiveInsights?.whyNotPerfect).length > 0 ||
    valueOrDash(view.executiveInsights?.nextRecommendedAction) !== "-";
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
          <Card className="ra-empty-card">
            <InfoTitle icon={<AutoAwesomeIcon />} title="Resume Audit" />
            <Typography className="ra-body-text">{errorMessage || "No resume audit data available."}</Typography>
            <Typography className="ra-muted">
              Use /resume-audit?CandID=2677682&CandInstance=RADIANT&JobID=209965&JobInstance=RADIANT&UserID=40&UserInstance=RADIANT.
            </Typography>
          </Card>
        </Box>
      </main>
    );
  }

  return (
    <main className="ra-page">
      <Box className="ra-shell ra-pdf-template">
        <Box className="ra-topbar">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography className="ra-page-title">Resume Assessment</Typography>
            <Chip size="small" className="ja-ai-chip ja-title-ai-chip ra-title-ai-chip" icon={<AutoAwesomeIcon />} label="RAD IQ" />
          </Stack>
          <Button className="ra-export-btn" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportPdf}>
            Export PDF
          </Button>
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
                  <InlineMeta icon={<BusinessCenterOutlinedIcon />} text={`${view.currentTitle} | ${view.experience}`} />
                  <InlineMeta icon={<MailOutlineOutlinedIcon />} text={view.email} />
                  <InlineMeta icon={<PhoneOutlinedIcon />} text={view.phone} />
                  <InlineMeta icon={<PlaceOutlinedIcon />} text={view.location} />
                  <InlineMeta icon={<WorkspacePremiumOutlinedIcon />} text={`Current: ${view.currentCompany}`} />
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
          {view.hasCandidateSalary && <MetricCard icon={<PaidOutlinedIcon />} title="Salary Match" value={`${view.salaryMatchScore}%`} tone={view.salaryMatchScore >= 80 ? "green" : "orange"} helper={view.salaryMatchStatus} />}
        </Box>

        {(hasCandidateSummary || hasSubmissionNotes) && (
          <Box className="ra-half-grid ra-note-grid">
            {hasCandidateSummary && (
              <Card className="ra-note-panel">
                <InfoTitle icon={<PersonOutlinedIcon />} title="Candidate Summary" />
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
                <InfoTitle icon={<AutoAwesomeIcon />} title="Audit Summary" />
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
              {valueOrDash(view.executiveInsights?.nextRecommendedAction) !== "-" && (
                <Box className="ra-action-panel">
                  <Typography className="ra-label">Next Recommended Action</Typography>
                  <Typography className="ra-action-title">{valueOrDash(view.executiveInsights?.nextRecommendedAction)}</Typography>
                </Box>
              )}
            </Box>
          </Card>
        )}

        {view.hasCandidateSalary && <Box className="ra-main-grid">
          <Card>
            <InfoTitle icon={<PaidOutlinedIcon />} title="Salary Details" />
            <DetailRows
              rows={[
                ["Current Salary", view.currentSalary],
                ["Expected Salary", view.expectedSalary],
                ["JD Budget", view.jobBudget],
              ]}
            />
            <Box className={`ra-salary-match ra-tone-box-${view.salaryMatchScore >= 80 ? "green" : "orange"}`}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography className="ra-label">Salary Match</Typography>
                <Typography className="ra-salary-score">{view.salaryMatchScore}%</Typography>
              </Stack>
              <Typography className="ra-body-text">{view.salaryMatchSummary}</Typography>
            </Box>
          </Card>
        </Box>}

        <Box className="ra-four-grid">
          {view.scoreBreakdown.length > 0 && <Card>
            <InfoTitle
              icon={<TrendingUpOutlinedIcon />}
              title="Score Breakdown"
              tooltip={
                <Stack spacing={0.7}>
                  {view.scoreBreakdown.map((item) => (
                    <Typography className="ra-tooltip-text" key={item.displayName || item.type || item.message || "score"}>
                      {valueOrDash(item.displayName || item.type)}: {valueOrDash(item.score)} / {valueOrDash(item.maxScore)}, Weight {valueOrDash(item.weight)}%
                    </Typography>
                  ))}
                </Stack>
              }
            />
            <Stack spacing={0.8}>
              {view.scoreBreakdown.map((item) => (
                <ScoreBreakdownRow key={item.displayName || item.type || item.message || Math.random()} item={item} />
              ))}
            </Stack>
          </Card>}

          {view.mandatorySkills.length > 0 && <Card>
            <InfoTitle icon={<PsychologyOutlinedIcon />} title="Mandatory Skills Coverage" />
            <SkillTable items={view.mandatorySkills} />
          </Card>}
          {[...view.mandatorySkills, ...view.preferredSkills].length > 0 && <Card>
            <InfoTitle icon={<WorkspacePremiumOutlinedIcon />} title="JD Requirements Coverage" />
            <SkillTable items={[...view.mandatorySkills, ...view.preferredSkills].slice(0, 6)} compact />
          </Card>}

          {view.questionGroups.length > 0 && <Card className="ra-screening-card">
            <InfoTitle icon={<ManageSearchOutlinedIcon />} title="AI Screening Questions" />
            <Stack spacing={0.8}>
              {view.questionGroups.map((group) => (
                <Stack className="ra-question-count-row" direction="row" justifyContent="space-between" alignItems="center" key={group.key}>
                  <Typography className="ra-body-text">{group.title}</Typography>
                  <button
                    className="ra-question-count-btn"
                    type="button"
                    onClick={(event) => openQuestionPopover(group.title, [group], event.currentTarget)}
                  >
                    {group.items.length}
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
                <QuestionGroupDetail groups={questionPopover.groups} />
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

        {improvementRows.length > 0 && <Card className="ra-full-section">
          <InfoTitle icon={<HelpOutlineOutlinedIcon />} title="Resume Improvement Suggestions" />
          <ImprovementList rows={improvementRows} />
        </Card>}

        {!isEmbedded && (
          <Dialog open={Boolean(questionPopover)} onClose={closeQuestionPopover} fullWidth maxWidth="md">
            <DialogTitle className="ra-dialog-title">
              {questionPopover?.title || "AI Screening Questions"}
              <IconButton aria-label="Close screening questions" onClick={closeQuestionPopover}>
                <CloseOutlinedIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {questionPopover && <QuestionGroupDetail groups={questionPopover.groups} />}
            </DialogContent>
          </Dialog>
        )}
      </Box>
    </main>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Paper className={`ra-card ${className}`} elevation={0}>{children}</Paper>;
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
}: {
  icon: ReactNode;
  title: string;
  value: string;
  tone: Tone;
  helper?: string;
  valueTooltip?: string;
}) {
  const valueNode = <Typography className={`ra-metric-value ra-tone-${tone}`}>{value}</Typography>;

  return (
    <Card className="ra-metric-card">
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
  const scorePercentage = item.scorePercentage ?? 0;
  const tone = getSeverityTone(item.severity);
  const tooltipTitle = (
    <Box className="ra-skill-tooltip">
      <Typography className="ra-skill-tooltip-heading">Score: {valueOrDash(item.score)}/{valueOrDash(item.maxScore)}</Typography>
      <Box>
        <Typography className="ra-skill-tooltip-heading">Message</Typography>
        <Typography>{valueOrDash(item.message)}</Typography>
      </Box>
    </Box>
  );

  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      <Box className="ra-score-row ra-score-row-tooltip">
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Typography className="ra-body-text">{valueOrDash(item.displayName || item.type)}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box className="ra-progress-track"><span className={`ra-progress-bar ra-progress-${tone}`} style={{ width: `${Math.max(0, Math.min(100, scorePercentage))}%` }} /></Box>
          <Typography className="ra-row-strong">{scorePercentage}%</Typography>
        </Stack>
      </Box>
    </Tooltip>
  );
}

function SkillTable({ items, compact = false }: { items: ResumeAuditSkill[]; compact?: boolean }) {
  const visibleItems = items.slice(0, compact ? 6 : 7);

  if (!visibleItems.length) {
    return <Typography className="ra-muted">No skill coverage available.</Typography>;
  }

  return (
    <Box className={compact ? "ra-skill-table ra-skill-table-compact" : "ra-skill-table"}>
      <Box className="ra-skill-table-head">
        <span>Skill</span>
        <span>Match</span>
        <span>Confidence</span>
      </Box>
      {visibleItems.map((item) => (
        <SkillTableRow item={item} key={valueOrDash(item.skill)} />
      ))}
    </Box>
  );
}

function SkillTableRow({ item }: { item: ResumeAuditSkill }) {
  const evidence = compactStringArray(item.evidence);
  const tooltipTitle = (
    <Box className="ra-skill-tooltip">
      {item.experience && <Typography>{item.experience}</Typography>}
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
    </Box>
  );

  return (
    <Tooltip title={tooltipTitle} arrow placement="top">
      <Box className="ra-skill-table-row">
        <Typography className="ra-row-strong">{valueOrDash(item.skill)}</Typography>
        <span className={`ra-match-dot ${item.matched ? "ra-match-yes" : "ra-match-no"}`}>{item.matched ? "Yes" : "No"}</span>
        <Typography className="ra-row-strong">{Math.round((item.confidence ?? 0) * 100)}%</Typography>
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

function ImprovementList({ rows }: { rows: Array<[string, number]> }) {
  return (
    <Stack spacing={0.8} className="ra-improvement-list">
      {rows.map(([label, count]) => (
        <Stack key={String(label)} className="ra-question-count-row" direction="row" justifyContent="space-between" alignItems="center">
          <Typography className="ra-body-text">{label}</Typography>
          <span>{count}</span>
        </Stack>
      ))}
    </Stack>
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

function QuestionGroupDetail({ groups }: { groups: QuestionGroup[] }) {
  return (
    <Stack spacing={groups.length > 1 ? 1.4 : 0.8}>
      {groups.map((group) => (
        <Box className="ra-popup-question-group" key={group.key}>
          {groups.length > 1 && <Typography className="ra-row-strong">{group.title}</Typography>}
          <Stack spacing={0.8} className={groups.length > 1 ? "ra-popup-question-list" : ""}>
            {group.items.map((item, index) => (
              <Box className="ra-popup-question-item" key={`${group.key}-${item.question}-${index}`}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <span className="ra-question-number">{index + 1}</span>
                  <Box>
                    <Typography className="ra-body-text">{valueOrDash(item.question)}</Typography>
                    <Typography className="ra-muted">{valueOrDash(item.reason)}</Typography>
                    <Chip size="small" className={`ra-severity-chip ra-severity-${getSeverityTone(item.priority)}`} label={valueOrDash(item.priority)} />
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
