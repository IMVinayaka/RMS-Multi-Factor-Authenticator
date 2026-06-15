import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
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
import ChecklistRtlOutlinedIcon from "@mui/icons-material/ChecklistRtlOutlined";
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
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
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
};

const emptyArray = <T,>(value?: T[] | null) => (Array.isArray(value) ? value : []);

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
      experience: item?.skillExperienceRequirement || undefined,
    };
  }).filter((item) => item.label !== "-");

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
    const sendHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );

      if (window.parent !== window) {
        window.parent.postMessage(
          {
            type: "jobAnalysisHeight",
            height,
          },
          "*"
        );
      }
    };

    sendHeight();

    const timer = setTimeout(sendHeight, 500);

    window.addEventListener("resize", sendHeight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", sendHeight);
    };
  }, [data]);

  const view = useMemo(
    () => ({
      jobId: data?.jobId || requestPayload?.jobId || "-",
      title: data?.jobInfo?.jobTitle || data?.jobInfo?.primaryTitle || "-",
      department: valueOrDash(data?.jobInfo?.department),
      level: valueOrDash(data?.jobInfo?.seniorityLevel),
      employment: valueOrDash(data?.jobInfo?.employmentType),
      workModel: valueOrDash(data?.location?.workModel),
      location: [data?.location?.city, data?.location?.state, data?.location?.zipCode].filter(Boolean).join(", ") || "-",
      remoteAllowed: toYesNo(data?.location?.remoteAllowed),
      experienceDisplay: formatYears(data?.experience?.minimumYears),
      salaryDisplay: formatSalaryRange(
        data?.compensation?.salaryMin,
        data?.compensation?.salaryMax,
        data?.compensation?.currency,
        data?.compensation?.salaryType
      ),
      booleanSearch: valueOrDash(data?.searchOptimization?.booleanSearchString),
      educationQualification: emptyArray(data?.education?.educationQualification || data?.education?.degrees),
      certifications: emptyArray(data?.education?.certifications),
      mandatorySkills: normalizeSkills(data?.skills?.mandatorySkills),
      preferredSkills: normalizeSkills(data?.skills?.preferredSkills),
      softSkills: normalizeSkills(data?.skills?.softSkills),
      prioritySkills: emptyArray(data?.skills?.prioritySkills),
      relatedTitles: emptyArray(data?.jobInfo?.relatedTitles),
      industryDomains: emptyArray(data?.industryDomains),
      technologies: emptyArray(data?.technologies),
      keywords: emptyArray(data?.searchOptimization?.keywords),
      summary: valueOrDash(data?.summary?.jdSummary || data?.summary?.jobDiscriptionSummary),
      recruiterNotes: valueOrDash(data?.summary?.recruiterNotes),
      skillExperienceRequirements: emptyArray(data?.skillExperienceRequirements),
    }),
    [data, requestPayload]
  );

  const copyBooleanSearch = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(view.booleanSearch);
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
        <Stack className="ja-topbar" direction={{ xs: "column", md: "row" }}>
          <Stack className="ja-header-line" direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography className="ja-kicker">Job Analysis ID: {view.jobId}</Typography>
            <Chip size="small" className="ja-ai-chip" icon={<AutoAwesomeIcon />} label="AI Powered" />
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
                    <Typography className="ja-title-subtitle">
                      at {view.location} <span className="ja-work-model">({view.workModel})</span>
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Stack>

            <Box className="ja-meta-grid">
              {view.remoteAllowed !== "-" && <Meta label="Remote Allowed" value={view.remoteAllowed} icon={<WifiOutlinedIcon />} chipTone={(val) => val === "No" ? "orange" : "green"} />}
              {view.experienceDisplay !== "-" && <Meta label="Experience" value={view.experienceDisplay} icon={<TimelineOutlinedIcon />} />}
              {view.educationQualification.length > 0 && <Meta label="Education" value={view.educationQualification.join(", ")} icon={<SchoolOutlinedIcon />} />}
              {view.certifications.length > 0 && <Meta label="Certifications" value={view.certifications.join(", ")} icon={<WorkspacePremiumOutlinedIcon />} />}
              {view.salaryDisplay !== "-" && <Meta label="Salary" value={view.salaryDisplay} icon={<AttachMoneyOutlinedIcon />} />}
              {view.department !== "-" && <Meta label="Department" value={view.department} icon={<CorporateFareOutlinedIcon />} />}
              {view.employment !== "-" && <Meta label="Employment" value={view.employment} icon={<PersonOutlinedIcon />} />}
              {view.level !== "-" && <Meta label="Level" value={view.level} icon={<TrendingUpOutlinedIcon />} />}
            </Box>

            <Box className="ja-hero-summary-grid">
              <Box className="ja-note-panel">
                <InfoTitle icon={<AutoAwesomeIcon />} title="Summary" />
                <Typography className="ja-body-text" sx={{ whiteSpace: "pre-line" }}>{view.summary}</Typography>
              </Box>
              <Box className="ja-note-panel">
                <InfoTitle icon={<ChecklistRtlOutlinedIcon />} title="Recruitment Notes" />
                <Typography className="ja-body-text" sx={{ whiteSpace: "pre-line" }}>{view.recruiterNotes}</Typography>
              </Box>
            </Box>
          </Card>
        </Box>

        <Card>
          <Box className="ja-four-grid">
            <Section className="ja-wide-section" icon={<PsychologyOutlinedIcon />} title="Skills">
              <Box className="ja-skill-grid">
                <SkillGroup title="Must Have" tone="green" items={view.mandatorySkills} />
                <SkillGroup title="Nice To Have" tone="orange" items={view.preferredSkills} />
                <SkillGroup title="Soft Skills" tone="purple" items={view.softSkills} />
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

        <Box className="ja-grid">
          <Card>
            <Stack direction="row" spacing={0.5} alignItems="baseline" className="ja-section-title" style={{ marginBottom: "8px" }}>
              <span className="ja-icon-bubble"><ManageSearchOutlinedIcon /></span>
              <Typography style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                Boolean Search String <span className="ja-muted">(Optimized search string for candidate discovery)</span>
              </Typography>
            </Stack>
            <Box className="ja-code-box">
              <Typography component="pre">{view.booleanSearch}</Typography>
              <IconButton className="ja-copy-btn" onClick={copyBooleanSearch} aria-label="Copy boolean search">
                <ContentCopyOutlinedIcon />
              </IconButton>
            </Box>
          </Card>
        </Box>

        <Box className="ja-grid ja-detail-grid">

          <Card>
            <InfoTitle icon={<AutoAwesomeIcon />} title="Related Job Titles" />
            <Stack direction="row" gap={0.8} flexWrap="wrap">
              <Pill tone="blue">{view.title}</Pill>
              {view.relatedTitles.map((title) => (
                <Pill key={title} tone="purple">
                  {title}
                </Pill>
              ))}
            </Stack>
          </Card>

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
          {/*<Card>
            <InfoTitle icon={<LocationOnOutlinedIcon />} title="Location & Work Details" />
            <DetailRows
              rows={[
                ["City", valueOrDash(data?.location?.city)],
                ["State", valueOrDash(data?.location?.state)],
                ["Country", valueOrDash(data?.location?.country)],
                ["ZIP Code", valueOrDash(data?.location?.zipCode)],
                ["Work Model", <Pill key="work-model" tone="green">{view.workModel}</Pill>],
                ["Remote", <Pill key="remote" tone="green">{view.remoteAllowed}</Pill>],
              ]}
            />
          </Card> */}
        </Box>
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

function Meta({
  label,
  value,
  icon,
  chipTone,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  chipTone?: PillTone | ((val: string) => PillTone);
}) {
  const resolvedTone = typeof chipTone === "function" ? chipTone(value) : chipTone;
  return (
    <Box className="ja-meta">
      <Typography className="ja-meta-label">
        {icon}
        {label}
      </Typography>
      {resolvedTone ? <Pill tone={resolvedTone}>{value}</Pill> : <Typography className="ja-meta-value">{value}</Typography>}
    </Box>
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

  return (
    <Tooltip title={label} arrow placement="top">
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
  return (
    <Stack className={divided ? "ja-detail-rows ja-detail-divided" : "ja-detail-rows"} spacing={0.7}>
      {rows.map(([label, value]) => (
        <Stack key={label} direction="row" justifyContent="space-between" spacing={2}>
          <Typography className="ja-muted">{label}</Typography>
          <Box className="ja-detail-value">{value}</Box>
        </Stack>
      ))}
    </Stack>
  );
}
