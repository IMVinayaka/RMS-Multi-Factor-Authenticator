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
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ChecklistRtlOutlinedIcon from "@mui/icons-material/ChecklistRtlOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import CorporateFareOutlinedIcon from "@mui/icons-material/CorporateFareOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { analyseJobDescription, type JobAnalysisRequest, type JobAnalysisResponse, type SkillValue } from "@/TalentProATS/api/jobAnalysis";
import { decryptJobAnalysisToken, encryptJobAnalysisRequest } from "@/TalentProATS/utils/jobAnalysisUrl";

type PillTone = "blue" | "green" | "purple" | "orange" | "gray";
type SkillDisplayItem = {
  label: string;
  experience?: string;
  tooltip?: string;
  synonyms?: string[];
};

type QuestionGroup = {
  key: string;
  title: string;
  items: string[];
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

const getCurrencySymbol = (currency?: string | null) => {
  const normalized = currency?.trim().toLowerCase();

  if (!normalized) return "";
  if (["usd", "us dollar", "dollar", "dollars", "$"].includes(normalized)) return "$";
  if (["inr", "rupee", "rupees", "ruppee", "ruppess", "₹", "rs"].includes(normalized)) return "₹";

  return `${currency} `;
};

const formatMoney = (value: number | null | undefined, currency?: string | null) => {
  if (value === null || value === undefined) return "-";

  const symbol = getCurrencySymbol(currency);
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

  return `${symbol}${amount}`;
};

const toYesNo = (value?: boolean | string) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return valueOrDash(value);
};

const formatYears = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  return `${value} Years`;
};

const formatSkillYears = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return undefined;
  const normalized = String(value).trim();
  if (/years?|yrs?/i.test(normalized)) return normalized;
  return `${normalized} Years`;
};

const formatSalaryRange = (
  minimum?: number | null,
  maximum?: number | null,
  currency?: string | null,
  salaryType?: string | null
) => {
  const min = formatMoney(minimum, currency);
  const max = formatMoney(maximum, currency);
  const type = salaryType ? `/${salaryType}` : "";

  if (min === "-" && max === "-") return "-";
  if (min !== "-" && (max === "-" || min === max)) return `${min}${type}`;
  if (min === "-") return `${max}${type}`;
  return `${min} - ${max}${type}`;
};

const normalizeSkills = (items?: SkillValue[] | null): SkillDisplayItem[] =>
  emptyArray(items).map((item) => {
    if (typeof item === "string") return { label: item };

    return {
      label: valueOrDash(item?.skill),
      experience: item?.skillExperienceRequirement || formatSkillYears(item?.minimumYears),
      tooltip: item?.tooltip || undefined,
      synonyms: compactStringArray(item?.resumeSynonyms),
    };
  }).filter((item) => item.label !== "-");

const getBooleanSearchString = (data?: JobAnalysisResponse | null) =>
  valueOrDash(
    data?.booleanSearch?.eliteTightBoolean ||
    data?.booleanSearch?.corePrecisionBoolean ||
    data?.booleanSearch?.broadMustHaveBoolean ||
    data?.searchOptimization?.booleanSearchString
  );

const getBooleanSearchCards = (data?: JobAnalysisResponse | null) => [
  {
    title: "Best Match Search",
    value: valueOrDash(data?.booleanSearch?.eliteTightBoolean || data?.searchOptimization?.booleanSearchString),
  },
  {
    title: "Balanced Search",
    value: valueOrDash(data?.booleanSearch?.corePrecisionBoolean),
  },
  {
    title: "Expanded Talent Search",
    value: valueOrDash(data?.booleanSearch?.broadMustHaveBoolean),
  },
].filter((item) => item.value !== "-");

const getQuestionGroups = (data?: JobAnalysisResponse | null): QuestionGroup[] => {
  const questions = data?.ScreeningQuestionsInfo || data?.screeningQuestionsInfo || data?.screeningQuestions;

  return [
    {
      key: "technical",
      title: "Technical Questions",
      items: compactStringArray(questions?.TechnicalQuestions || questions?.technicalQuestions),
    },
    {
      key: "experience",
      title: "Experience Questions",
      items: compactStringArray(questions?.ExperienceQuestions || questions?.experienceQuestions),
    },
    {
      key: "domain",
      title: "Domain Questions",
      items: compactStringArray(questions?.DomainQuestions || questions?.domainQuestions),
    },
    {
      key: "risk",
      title: "Risk Questions",
      items: compactStringArray(questions?.RiskQuestions || questions?.riskQuestions),
    },
    {
      key: "softSkill",
      title: "Soft Skill Questions",
      items: compactStringArray(questions?.SoftSkillQuestions || questions?.softSkillQuestions),
    },
  ];
};

const maskRequest = (request: JobAnalysisRequest | null) => {
  if (!request) return null;

  return {
    jobId: request.jobId,
    jobInstance: request.jobInstance,
    clientReference: request.clientReference ? "********" : "",
  };
};

const getQueryParam = (query: Record<string, string | string[] | undefined>, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = query[key];
    if (value) return Array.isArray(value) ? value[0] : value;
  }
  return undefined;
};

const parseJobAnalysisRequest = (query: Record<string, string | string[] | undefined>): JobAnalysisRequest | null => {
  const token = Array.isArray(query.token) ? query.token[0] : query.token;
  if (token) return decryptJobAnalysisToken(token);

  const requestValue = Array.isArray(query.request) ? query.request[0] : query.request;
  const tildeParts = requestValue?.split("~").map((part) => part.trim()).filter(Boolean);

  if (tildeParts?.length === 3) {
    return {
      jobId: tildeParts[0],
      jobInstance: tildeParts[1],
      clientReference: tildeParts[2],
    };
  }

  // Support both camelCase and lowercase parameter names
  const jobId = getQueryParam(query, "jobId", "jobid");
  const jobInstance = getQueryParam(query, "jobInstance", "jobinstance");
  const clientReference = getQueryParam(query, "clientReference", "clientreference");

  if (!jobId || !jobInstance || !clientReference) return null;

  return {
    jobId,
    jobInstance,
    clientReference,
  };
};

export default function JobAnalysis() {
  const router = useRouter();
  const [data, setData] = useState<JobAnalysisResponse | null>(null);
  const [requestPayload, setRequestPayload] = useState<JobAnalysisRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [activeQuestionGroup, setActiveQuestionGroup] = useState<string | null>(null);
  const [questionPopoverPosition, setQuestionPopoverPosition] = useState<PopoverPosition | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const request = parseJobAnalysisRequest(router.query);
    console.log("[JobAnalysis Page] URL query received", router.query.token ? { token: "encrypted" } : { legacyQuery: "plain" });
    console.log("[JobAnalysis Page] Parsed payload", maskRequest(request));

    setRequestPayload(request);
    setErrorMessage("");

    if (!request) {
      setData(null);
      setLoading(false);
      setErrorMessage("Missing job analysis request parameters.");
      console.warn("[JobAnalysis Page] Missing parameters. Use ?token=<encrypted-request>");
      return;
    }

    if (!router.query.token) {
      const token = encryptJobAnalysisRequest(request);
      console.log("[JobAnalysis Page] Replacing plain URL with encrypted token");
      router.replace(
        {
          pathname: router.pathname,
          query: { talentproRoute: router.query.talentproRoute, token },
        },
        `/job-analysis?token=${encodeURIComponent(token)}`,
        { shallow: true }
      );
    }

    let active = true;

    async function loadJobAnalysis() {
      try {
        setLoading(true);
        const response = await analyseJobDescription(request);
        if (active) setData(response);
      } catch (error) {
        if (active) {
          setData(null);
          setErrorMessage("Unable to load job analysis.");
          console.error("[JobAnalysis Page] API error", error);
          toast.error("Unable to load job analysis.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadJobAnalysis();

    return () => {
      active = false;
    };
  }, [router.isReady, router.query.clientReference, router.query.jobId, router.query.jobInstance, router.query.request, router.query.token]);
  

  // Added this for handling height changes on iframe embedding, on RMS
  useEffect(() => {
    const embedded = window.parent !== window;
    setIsEmbedded(embedded);

    const sendHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );

      if (embedded) {
        window.parent.postMessage(
          {
            type: "jobAnalysisHeight",
            height,
          },
          "*"
        );
      }
    };

    const scheduleHeight = () => {
      sendHeight();
      requestAnimationFrame(sendHeight);
    };

    scheduleHeight();

    const timers = [100, 300, 700, 1200].map((delay) => setTimeout(sendHeight, delay));
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleHeight) : null;
    resizeObserver?.observe(document.body);
    resizeObserver?.observe(document.documentElement);
    window.addEventListener("resize", sendHeight);

    return () => {
      timers.forEach(clearTimeout);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", sendHeight);
    };
  }, [data, loading, questionsOpen, activeQuestionGroup]);

  const view = useMemo(
    () => ({
      jobId: data?.jobId || requestPayload?.jobId || "-",
      title: data?.jobInfo?.jobTitle || data?.jobInfo?.primaryTitle || "-",
      department: valueOrDash(data?.jobInfo?.department),
      level: valueOrDash(data?.jobInfo?.seniorityLevel),
      employment: valueOrDash(data?.jobInfo?.employmentType),
      workModel: valueOrDash(data?.location?.workModel),
      location: [data?.location?.city, data?.location?.state, data?.location?.zipCode].filter(Boolean).join(", ") || "-",
      experienceDisplay: formatYears(data?.experience?.minimumYears),
      salaryDisplay: formatSalaryRange(
        data?.compensation?.salaryMin,
        data?.compensation?.salaryMax,
        data?.compensation?.currency,
        data?.compensation?.salaryType
      ),
      booleanSearch: getBooleanSearchString(data),
      booleanSearchCards: getBooleanSearchCards(data),
      educationQualification: compactStringArray(data?.education?.educationQualifications || data?.education?.educationQualification || data?.education?.degrees),
      certifications: compactStringArray(data?.education?.certifications),
      mandatorySkills: normalizeSkills(data?.skills?.mandatorySkills),
      preferredSkills: normalizeSkills(data?.skills?.preferredSkills),
      softSkills: normalizeSkills(data?.skills?.softSkills),
      prioritySkills: compactStringArray(data?.skills?.prioritySkills),
      dealBreakerSkills: compactStringArray(data?.skills?.dealBreakerSkills),
      hiringManagerPriority: valueOrDash(data?.skills?.hiringManagerPriority),
      relatedTitles: compactStringArray(data?.jobInfo?.relatedTitles),
      industryDomains: compactStringArray(data?.industryDomains),
      technologies: compactStringArray(data?.technologies),
      keywords: compactStringArray(data?.searchOptimization?.keywords),
      summary: valueOrDash(data?.summary?.jobDescriptionSummary || data?.summary?.jdSummary || data?.summary?.jobDiscriptionSummary),
      recruiterNotes: valueOrDash(data?.summary?.recruiterNotes),
      candidateAvoidPoints: compactStringArray(data?.summary?.candidateAvoidPoints),
      clientName: valueOrDash(data?.clientInfo?.clientName),
      clientIndustry: valueOrDash(data?.clientInfo?.industry),
      workAuthorization: compactStringArray(data?.workAuthorization?.requirements),
      keyResponsibilities: compactStringArray(data?.responsibilities?.keyResponsibilities),
      competitorCompanies: compactStringArray(data?.marketIntelligence?.competitorCompanies),
      similarEnvironments: compactStringArray(data?.marketIntelligence?.similarEnvironments),
      talentMarketDifficulty: valueOrDash(data?.marketIntelligence?.talentMarketDifficulty),
      hiddenExpectations: emptyArray(data?.hiddenExpectations)
        .map((item) => ({
          expectation: valueOrDash(item?.expectation),
          reason: valueOrDash(item?.reason),
        }))
        .filter((item) => item.expectation !== "-"),
      questionGroups: getQuestionGroups(data),
      skillExperienceRequirements: emptyArray(data?.skillExperienceRequirements),
    }),
    [data, requestPayload]
  );

  const copyBooleanSearch = async (value = view.booleanSearch) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(value);
      toast.success("Boolean search copied");
      return;
    }
    toast.info("Copy is not available in this browser");
  };

  const showActionToast = (label: string) => {
    toast.info(`${label} clicked`);
  };

  const exportPdf = () => {
    if (typeof window === "undefined") return;

    async function generatePdf() {
      const originalTarget = document.querySelector<HTMLElement>(".ja-pdf-template");
      const fileName = `JD-${view.jobId}.pdf`;

      if (!originalTarget) {
        toast.error("PDF template is not available.");
        return;
      }

      let clone: HTMLElement | null = null;

      try {
        toast.info("Generating PDF");
        document.body.classList.add("ja-exporting-pdf");

        await document.fonts?.ready;

        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
          import("html2canvas"),
          import("jspdf"),
        ]);

        clone = originalTarget.cloneNode(true) as HTMLElement;
        clone.classList.add("ja-export-clone");
        clone.style.position = "absolute";
        clone.style.left = "-99999px";
        clone.style.top = "0";
        clone.style.width = "1440px";
        clone.style.maxWidth = "1440px";
        clone.style.minWidth = "1440px";
        clone.style.transform = "none";

        clone.querySelectorAll(".MuiChip-root").forEach((chip) => {
          const label = chip.querySelector(".MuiChip-label")?.textContent || chip.textContent || "";
          const textValue = document.createElement("span");
          textValue.className = "ja-pdf-text-value";
          textValue.textContent = label.trim();
          chip.replaceWith(textValue);
        });

        document.body.appendChild(clone);

        await document.fonts?.ready;
        await new Promise((resolve) => setTimeout(resolve, 250));

        const canvas = await html2canvas(clone, {
          backgroundColor: "#f6f8fc",
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          width: clone.scrollWidth,
          height: clone.scrollHeight,
          windowWidth: 1440,
          windowHeight: clone.scrollHeight,
          scrollX: 0,
          scrollY: 0,
        });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 7;
      const imageWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;

      const sourcePageHeight = Math.floor(
        (printableHeight * canvas.width) / imageWidth
      );

      const pageCanvas = document.createElement("canvas");
      const pageContext = pageCanvas.getContext("2d");

      if (!pageContext) {
        throw new Error("Unable to create PDF canvas context.");
      }

      pageCanvas.width = canvas.width;

      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(
          sourcePageHeight,
          canvas.height - renderedHeight
        );

        pageCanvas.height = sliceHeight;

        pageContext.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageContext.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        if (pageIndex > 0) pdf.addPage();

        pdf.addImage(
          pageCanvas.toDataURL("image/png"),
          "PNG",
          margin,
          margin,
          imageWidth,
          (sliceHeight * imageWidth) / canvas.width
        );

        renderedHeight += sliceHeight;
        pageIndex += 1;
      }

        pdf.save(fileName);
        toast.success("PDF downloaded");
      } catch (error) {
        console.error("[JobAnalysis Export] PDF generation failed", error);
        toast.error("Unable to generate PDF.");
      } finally {
        if (clone && clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }

        document.body.classList.remove("ja-exporting-pdf");
      }
    }

    generatePdf();
  };

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  const hasJobOverview = view.summary !== "-";
  const hasRecruiterNotes = view.recruiterNotes !== "-";
  const hasSkills =
    view.mandatorySkills.length > 0 ||
    view.preferredSkills.length > 0 ||
    view.softSkills.length > 0 ||
    view.prioritySkills.length > 0;
  const hasMarketIntelligence =
    view.competitorCompanies.length > 0 ||
    view.similarEnvironments.length > 0;
  const visibleQuestionGroups = view.questionGroups.filter((group) => group.items.length > 0);
  const dialogQuestionGroups = activeQuestionGroup
    ? visibleQuestionGroups.filter((group) => group.key === activeQuestionGroup)
    : visibleQuestionGroups;
  const activeQuestionTitle = activeQuestionGroup
    ? visibleQuestionGroups.find((group) => group.key === activeQuestionGroup)?.title || "Screening Questions"
    : "All Screening Questions";
  const totalQuestionCount = visibleQuestionGroups.reduce((total, group) => total + group.items.length, 0);
  const hasClientInfo = view.clientName !== "-" || view.clientIndustry !== "-";

  const openQuestions = (groupKey: string | null, anchor: HTMLElement) => {
    setActiveQuestionGroup(groupKey);

    if (isEmbedded) {
      const card = anchor.closest(".ja-question-card") as HTMLElement | null;
      const cardRect = card?.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();

      if (cardRect) {
        setQuestionPopoverPosition({
          left: anchorRect.left - cardRect.left + anchorRect.width / 2,
          top: anchorRect.bottom - cardRect.top + 8,
        });
      }
    }

    setQuestionsOpen(true);
  };

  const closeQuestions = () => {
    setQuestionsOpen(false);
    setQuestionPopoverPosition(null);
  };

  if (loading) {
    return (
      <main className="ja-page ja-loader-page">
        <Box className="ja-ai-loader-card">
          <Box className="ja-ai-loader-icon">
            <AutoAwesomeIcon />
          </Box>
          <Typography className="ja-loader-title">Job ID: {view.jobId}</Typography>
          <Chip size="small" className="ja-ai-chip ja-loader-chip" icon={<AutoAwesomeIcon />} label="AI Powered" />
        </Box>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="ja-page">
        <Box className="ja-shell">
          <Card className="ja-empty-card">
            <InfoTitle icon={<AutoAwesomeIcon />} title="Job Analysis" />
            <Typography className="ja-body-text">{errorMessage || "No job analysis data available."}</Typography>
            <Typography className="ja-muted">
              Use /job-analysis?token=encryptedRequest.
            </Typography>
          </Card>
        </Box>
      </main>
    );
  }

  return (
    <main className="ja-page">
      <Box className="ja-shell ja-pdf-template">
        {!isEmbedded && (
          <Stack className="ja-topbar" direction={{ xs: "column", md: "row" }}>
            <Stack className="ja-header-line" direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography className="ja-kicker">Job ID: {view.jobId}</Typography>
            </Stack>

            {/* <Stack className="ja-export-controls" direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button className="ja-back-btn" startIcon={<ArrowBackOutlinedIcon />} onClick={goBack} variant="outlined">
                Back
              </Button>
              <Button className="ja-action-btn ja-export-btn" startIcon={<FileDownloadOutlinedIcon />} endIcon={<ExpandMoreOutlinedIcon />} onClick={exportPdf} variant="outlined">
                Export
              </Button>
            </Stack> */}
          </Stack>
        )}

        <Box className="ja-grid ja-hero-grid">
          <Card className="ja-hero-card">
            <Stack className="ja-hero-heading" direction="row" spacing={2} alignItems="center">
              <Box className="ja-job-icon">
                <BusinessCenterOutlinedIcon />
              </Box>

              <Box flex={1} minWidth={0}>
                <Box className="ja-title-row">
                  <Stack direction="column" spacing={0.5} flex={1} minWidth={0}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography className="ja-title">{view.title}</Typography>
                      {/*<Pill tone="green">Active</Pill> */}
                    </Stack>
                    <Stack className="ja-title-location" direction="row" alignItems="center" flexWrap="wrap" useFlexGap>
                      {view.location !== "-" && (
                        <Typography className="ja-title-subtitle">
                          <LocationOnOutlinedIcon />
                          {view.location}
                        </Typography>
                      )}
                      {view.workModel !== "-" && <Pill tone="green">{view.workModel}</Pill>}
                    </Stack>
                  </Stack>
                  <Chip size="small" className="ja-ai-chip ja-title-ai-chip" icon={<AutoAwesomeIcon />} label="AI Powered" />
                </Box>
              </Box>
            </Stack>

            <Box className="ja-summary-badge-grid">
              {view.experienceDisplay !== "-" && <SummaryBadge label="Experience" value={view.experienceDisplay} />}
              {view.salaryDisplay !== "-" && <SummaryBadge label="Salary" value={view.salaryDisplay} />}
              {view.employment !== "-" && <SummaryBadge label="Employment" value={view.employment} />}
              {view.level !== "-" && <SummaryBadge label="Level" value={view.level} />}
              {/*{view.talentMarketDifficulty !== "-" && <SummaryBadge label="Talent Availability" value={view.talentMarketDifficulty} tone="orange" />}*/}
            </Box>

            <Box className="ja-info-grid">
              {view.department !== "-" && <InfoMeta label="Department" value={view.department} icon={<CorporateFareOutlinedIcon />} />}
              {view.educationQualification.length > 0 && <InfoMeta label="Education" value={view.educationQualification.join(", ")} icon={<SchoolOutlinedIcon />} />}
              {view.certifications.length > 0 && <InfoMeta label="Certifications" value={view.certifications.join(", ")} icon={<WorkspacePremiumOutlinedIcon />} />}
              {view.workAuthorization.length > 0 && <InfoMeta label="Work Authorization" value={view.workAuthorization.join(", ")} icon={<FlagOutlinedIcon />} />}
              {hasClientInfo && (
                <InfoMeta
                  label="Client Information"
                  value={(
                    <>
                      {view.clientName !== "-" && <span>{view.clientName}</span>}
                      {view.clientIndustry !== "-" && <span>{view.clientIndustry}</span>}
                    </>
                  )}
                  icon={<BusinessCenterOutlinedIcon />}
                />
              )}
            </Box>

            {(hasJobOverview || hasRecruiterNotes) && (
              <Box className="ja-hero-summary-grid">
                {hasJobOverview && (
                  <Box className="ja-note-panel ja-overview-panel">
                    <InfoTitle icon={<AutoAwesomeIcon />} title="Job Overview" />
                    <Typography className="ja-body-text" sx={{ whiteSpace: "pre-line" }}>{view.summary}</Typography>
                  </Box>
                )}
                {hasRecruiterNotes && (
                  <Box className="ja-note-panel ja-recruiter-panel">
                    <InfoTitle icon={<ChecklistRtlOutlinedIcon />} title="Recruitment Notes" />
                    <Typography className="ja-body-text" sx={{ whiteSpace: "pre-line" }}>{view.recruiterNotes}</Typography>
                    {view.hiringManagerPriority !== "-" && (
                      <Box className="ja-manager-priority">
                        <Typography className="ja-label ja-manager-priority-label">
                          <FlagOutlinedIcon />
                          Manager Priority
                        </Typography>
                        <Typography className="ja-body-text">{view.hiringManagerPriority}</Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Card>
        </Box>

        {hasSkills && (
          <Card>
            <Box className="ja-four-grid">
              <Section className="ja-wide-section" icon={<PsychologyOutlinedIcon />} title="Skills">
                <Box className="ja-skill-grid">
                  {view.mandatorySkills.length > 0 && <SkillGroup title="Must Have" tone="green" items={view.mandatorySkills} />}
                  {view.preferredSkills.length > 0 && <SkillGroup title="Nice To Have" tone="orange" items={view.preferredSkills} />}
                  {view.softSkills.length > 0 && <SkillGroup title="Soft Skills" tone="purple" items={view.softSkills} />}
                  {view.prioritySkills.length > 0 && (
                    <Box className="ja-skill-group">
                      <Typography className="ja-label">Key Skills by Priority</Typography>
                      <Stack spacing={1.1}>
                        {view.prioritySkills.map((skill, index) => (
                          <Stack key={skill} direction="row" alignItems="center" spacing={1}>
                            <span className="ja-rank">{index + 1}</span>
                            <Typography className="ja-row-value">{skill}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              </Section>
            </Box>
          </Card>
        )}

        {view.booleanSearchCards.length > 0 && (
          <Box className="ja-grid">
            <Section className="ja-wide-section ja-plain-section" icon={<ManageSearchOutlinedIcon />} title="Boolean Search">
              <Box className="ja-boolean-grid">
                {view.booleanSearchCards.map((item) => (
                  <BooleanSearchCard key={item.title} title={item.title} value={item.value} onCopy={() => copyBooleanSearch(item.value)} />
                ))}
              </Box>
            </Section>
          </Box>
        )}

        <Box className="ja-grid ja-detail-grid">

          {(view.title !== "-" || view.relatedTitles.length > 0) && (
            <Card>
              <InfoTitle icon={<AutoAwesomeIcon />} title="Related Job Titles" />
              <Stack direction="row" gap={0.8} flexWrap="wrap">
                {view.title !== "-" && <Pill tone="blue">{view.title}</Pill>}
                {view.relatedTitles.map((title) => (
                  <Pill key={title} tone="purple">
                    {title}
                  </Pill>
                ))}
              </Stack>
            </Card>
          )}

          {view.industryDomains.length > 0 && (
            <Card>
              <InfoTitle icon={<BusinessCenterOutlinedIcon />} title="Industry / Domain" />
              <Stack direction="row" gap={0.8} flexWrap="wrap">
                {view.industryDomains.map((item) => (
                  <Pill key={item} tone="purple">
                    {item}
                  </Pill>
                ))}
              </Stack>
            </Card>
          )}

          {view.technologies.length > 0 && (
            <Card>
              <InfoTitle icon={<LightbulbOutlinedIcon />} title="Technologies" />
              <Stack direction="row" gap={0.8} flexWrap="wrap">
                {view.technologies.map((item) => (
                  <Pill key={item} tone="blue">
                    {item}
                  </Pill>
                ))}
              </Stack>
            </Card>
          )}

          {view.keywords.length > 0 && (
            <Card>
              <InfoTitle icon={<LocalOfferOutlinedIcon />} title="Additional Keywords" />
              <Stack direction="row" gap={0.8} flexWrap="wrap">
                {view.keywords.map((item) => (
                  <Pill key={item} tone="gray">
                    {item}
                  </Pill>
                ))}
              </Stack>
            </Card>
          )}

          {totalQuestionCount > 0 && (
            <Card className="ja-question-card">
              <InfoTitle icon={<ManageSearchOutlinedIcon />} title="Screening Questions" />
              <Typography className="ja-question-helper">
                Use these questions to qualify fit, risk, and domain depth before submission.
              </Typography>
              <Box className="ja-question-count-grid">
                {view.questionGroups.map((group) => (
                  <Box className={`ja-question-count ${group.items.length === 0 ? "ja-question-count-empty" : ""}`} key={group.key}>
                    <Typography className="ja-question-count-label">{group.title.replace(" Questions", "")}</Typography>
                    {group.items.length > 0 ? (
                      <button
                        className="ja-question-count-link"
                        onClick={(event) => openQuestions(group.key, event.currentTarget)}
                        type="button"
                      >
                        {group.items.length}
                      </button>
                    ) : (
                      <Typography className="ja-question-count-value">0</Typography>
                    )}
                  </Box>
                ))}
              </Box>
              <Button
                className="ja-question-btn"
                variant="outlined"
                onClick={(event) => openQuestions(null, event.currentTarget)}
              >
                View All Questions ({totalQuestionCount})
              </Button>
              {isEmbedded && questionsOpen && questionPopoverPosition && (
                <Box
                  className="ja-embedded-questions-panel"
                  style={{
                    left: questionPopoverPosition.left,
                    top: questionPopoverPosition.top,
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} className="ja-embedded-questions-title">
                    <Typography className="ja-row-value">{activeQuestionTitle}</Typography>
                    <IconButton aria-label="Close screening questions" onClick={closeQuestions}>
                      <CloseOutlinedIcon />
                    </IconButton>
                  </Stack>
                  <QuestionsContent groups={dialogQuestionGroups} />
                </Box>
              )}
            </Card>
          )}

          {hasMarketIntelligence && (
            <Card>
              <InfoTitle icon={<TrendingUpOutlinedIcon />} title="Market Intelligence" />
              {view.competitorCompanies.length > 0 && (
                <Box className="ja-chip-section">
                  <Typography className="ja-label">Competitor Companies</Typography>
                  <Stack direction="row" gap={0.8} flexWrap="wrap">
                    {view.competitorCompanies.map((item) => (
                      <Pill key={item} tone="blue">{item}</Pill>
                    ))}
                  </Stack>
                </Box>
              )}
              {view.similarEnvironments.length > 0 && (
                <Box className="ja-chip-section">
                  <Typography className="ja-label">Similar Environments</Typography>
                  <Stack direction="row" gap={0.8} flexWrap="wrap">
                    {view.similarEnvironments.map((item) => (
                      <Pill key={item} tone="purple">{item}</Pill>
                    ))}
                  </Stack>
                </Box>
              )}
            </Card>
          )}
          {/*<Card>
            <InfoTitle icon={<LocationOnOutlinedIcon />} title="Location & Work Details" />
            <DetailRows
              rows={[
                ["City", valueOrDash(data?.location?.city)],
                ["State", valueOrDash(data?.location?.state)],
                ["Country", valueOrDash(data?.location?.country)],
                ["ZIP Code", valueOrDash(data?.location?.zipCode)],
                ["Work Model", <Pill key="work-model" tone="green">{view.workModel}</Pill>],
                ["Remote", <Pill key="remote" tone="green">{toYesNo(data?.location?.remoteAllowed)}</Pill>],
              ]}
            />
          </Card> */}
        </Box>

        {(view.keyResponsibilities.length > 0 || view.hiddenExpectations.length > 0 || view.candidateAvoidPoints.length > 0) && (
          <Box className="ja-grid ja-bottom-full-grid">
            {view.keyResponsibilities.length > 0 && (
              <Card className="ja-overview-style-card">
                <InfoTitle icon={<ChecklistRtlOutlinedIcon />} title="Key Responsibilities" />
                <Stack spacing={0.8}>
                  {view.keyResponsibilities.map((item) => (
                    <Stack key={item} direction="row" spacing={0.8} alignItems="flex-start" className="ja-check-row">
                      <CheckCircleOutlineOutlinedIcon />
                      <Typography className="ja-body-text">{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Card>
            )}

            {view.hiddenExpectations.length > 0 && (
              <Card className="ja-overview-style-card">
                <InfoTitle icon={<LightbulbOutlinedIcon />} title="Hidden Expectations" />
                <Stack spacing={0.8}>
                  {view.hiddenExpectations.map((item) => (
                    <Stack key={`${item.expectation}-${item.reason}`} direction="row" spacing={0.8} alignItems="flex-start" className="ja-check-row">
                      <CheckCircleOutlineOutlinedIcon />
                      <Box minWidth={0}>
                        <Typography className="ja-body-text"><strong>{item.expectation}</strong></Typography>
                        {item.reason !== "-" && <Typography className="ja-muted">{item.reason}</Typography>}
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Card>
            )}

            {view.candidateAvoidPoints.length > 0 && (
              <Card className="ja-warning-card">
                <InfoTitle icon={<FlagOutlinedIcon />} title="Candidate Avoid Points" />
                <Stack spacing={0.8}>
                  {view.candidateAvoidPoints.map((item) => (
                    <Stack key={item} direction="row" spacing={0.8} alignItems="flex-start" className="ja-avoid-row">
                      <CancelOutlinedIcon />
                      <Typography className="ja-body-text">{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Card>
            )}
          </Box>
        )}

        {!isEmbedded && (
          <Dialog open={questionsOpen} onClose={closeQuestions} fullWidth maxWidth="md">
            <DialogTitle className="ja-dialog-title">
              {activeQuestionTitle}
              <IconButton aria-label="Close screening questions" onClick={closeQuestions}>
                <CloseOutlinedIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <QuestionsContent groups={dialogQuestionGroups} />
            </DialogContent>
          </Dialog>
        )}
      </Box>
    </main>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <Paper className={`ja-card ${className}`} elevation={0}>{children}</Paper>;
}

function InfoTitle({
  icon,
  title,
  animated,
}: {
  icon: ReactNode;
  title: string;
  animated?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" className="ja-section-title">
      <span className="ja-icon-bubble">{icon}</span>
      <Typography>{title}</Typography>
    </Stack>
  );
}

function Section({
  icon,
  title,
  children,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Box className={`ja-section ${className}`}>
      <InfoTitle icon={icon} title={title} />
      <Box className="ja-section-body">{children}</Box>
    </Box>
  );
}

function SummaryBadge({ label, value, tone = "blue" }: { label: string; value: string; tone?: PillTone }) {
  return (
    <Box className={`ja-summary-badge ja-summary-badge-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </Box>
  );
}

function InfoMeta({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <Box className="ja-info-meta">
      <Typography className="ja-meta-label">{icon}{label}</Typography>
      <Typography component="div" className="ja-meta-value">{value}</Typography>
    </Box>
  );
}

function BooleanSearchCard({ title, value, onCopy }: { title: string; value: string; onCopy: () => void }) {
  return (
    <Box className="ja-boolean-card">
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Typography className="ja-label">{title}</Typography>
        <IconButton className="ja-copy-btn" onClick={onCopy} aria-label={`Copy ${title}`}>
          <ContentCopyOutlinedIcon />
        </IconButton>
      </Stack>
      <Typography component="pre">{value}</Typography>
    </Box>
  );
}

function QuestionsContent({ groups }: { groups: QuestionGroup[] }) {
  return (
    <Stack spacing={2}>
      {groups.map((group) => (
        <Box className="ja-question-dialog-group" key={group.key}>
          <Typography className="ja-row-value">{group.title}</Typography>
          <Stack component="ol" className="ja-question-list" spacing={0.8}>
            {group.items.map((question) => (
              <Typography component="li" className="ja-body-text" key={question}>
                {question}
              </Typography>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

function SkillGroup({ title, items, tone }: { title: string; items: SkillDisplayItem[]; tone: PillTone }) {
  return (
    <Box className="ja-skill-group">
      <Typography className="ja-label">{title}</Typography>
      <Box className="ja-skill-block-grid">
        {items.map((item) => (
          <SkillBlock key={`${item.label}-${item.experience || ""}`} item={item} tone={tone} />
        ))}
      </Box>
    </Box>
  );
}

function SkillBlock({ item, tone }: { item: SkillDisplayItem; tone: PillTone }) {
  const label = item.experience ? `${item.label} (${item.experience})` : item.label;
  const hasTooltip = Boolean(item.tooltip || item.synonyms?.length);
  const tooltipTitle = hasTooltip ? (
    <Box className="ja-skill-tooltip">
      {item.tooltip && <Typography>{item.tooltip}</Typography>}
      {item.synonyms?.length ? (
        <Box>
          <Typography className="ja-skill-tooltip-heading">Common resume terms</Typography>
          {item.synonyms.map((synonym) => (
            <Typography key={synonym}>{synonym}</Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  ) : "";

  return (
    <Tooltip title={tooltipTitle} arrow placement="top" disableHoverListener={!hasTooltip}>
      <span className={`ja-skill-block ja-skill-block-${tone}`}>
        {label}
      </span>
    </Tooltip>
  );
}

function Pill({ children, tone }: { children: ReactNode; tone: PillTone }) {
  const tooltipTitle = typeof children === "string" || typeof children === "number" ? String(children) : "";

  return (
    <Tooltip title={tooltipTitle} arrow placement="top" disableHoverListener={!tooltipTitle}>
      <Chip size="small" className={`ja-pill ja-pill-${tone}`} label={children} />
    </Tooltip>
  );
}

function DetailRows({ rows, divided = false }: { rows: Array<[string, ReactNode]>; divided?: boolean }) {
  const visibleRows = rows.filter(([, value]) => value !== "-");

  return (
    <Stack className={divided ? "ja-detail-rows ja-detail-divided" : "ja-detail-rows"} spacing={0.7}>
      {visibleRows.map(([label, value]) => (
        <Stack key={label} direction="row" justifyContent="space-between" spacing={2}>
          <Typography className="ja-muted">{label}</Typography>
          <Box className="ja-detail-value">{value}</Box>
        </Stack>
      ))}
    </Stack>
  );
}
