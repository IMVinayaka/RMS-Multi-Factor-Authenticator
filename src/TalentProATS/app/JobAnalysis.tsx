import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import ChecklistRtlOutlinedIcon from "@mui/icons-material/ChecklistRtlOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { analyseJobDescription, type JobAnalysisRequest, type JobAnalysisResponse } from "@/TalentProATS/api/jobAnalysis";

type PillTone = "blue" | "green" | "purple" | "orange" | "gray";

const emptyArray = <T,>(value?: T[] | null) => (Array.isArray(value) ? value : []);

const valueOrDash = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const formatMoney = (value: number | null | undefined, currency?: string | null) => {
  if (value === null || value === undefined || !currency) return "-";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

const toYesNo = (value?: boolean | string) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return valueOrDash(value);
};

const formatYears = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  return `${value} Years`;
};

const hasValue = (value?: string | number | null) => value !== null && value !== undefined && value !== "";

const parseJobAnalysisRequest = (query: Record<string, string | string[] | undefined>): JobAnalysisRequest | null => {
  const requestValue = Array.isArray(query.request) ? query.request[0] : query.request;
  const tildeParts = requestValue?.split("~").map((part) => part.trim()).filter(Boolean);

  if (tildeParts?.length === 3) {
    return {
      jobId: tildeParts[0],
      jobInstance: tildeParts[1],
      clientReference: tildeParts[2],
    };
  }

  const jobId = Array.isArray(query.jobId) ? query.jobId[0] : query.jobId;
  const jobInstance = Array.isArray(query.jobInstance) ? query.jobInstance[0] : query.jobInstance;
  const clientReference = Array.isArray(query.clientReference) ? query.clientReference[0] : query.clientReference;

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
    console.log("[JobAnalysis Page] URL query", router.query);
    console.log("[JobAnalysis Page] Parsed payload", request);

    setRequestPayload(request);
    setErrorMessage("");

    if (!request) {
      setData(null);
      setLoading(false);
      setErrorMessage("Missing job analysis request parameters.");
      console.warn("[JobAnalysis Page] Missing parameters. Use ?request=jobId~jobInstance~clientReference");
      return;
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
  }, [router.isReady, router.query.clientReference, router.query.jobId, router.query.jobInstance, router.query.request]);

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
      salaryMin: formatMoney(data?.compensation?.salaryMin, data?.compensation?.currency),
      salaryMax: formatMoney(data?.compensation?.salaryMax, data?.compensation?.currency),
      salaryType: valueOrDash(data?.compensation?.salaryType),
      salaryCurrency: valueOrDash(data?.compensation?.currency),
      booleanSearch: valueOrDash(data?.searchOptimization?.booleanSearchString),
      educationQualification: emptyArray(data?.education?.educationQualification || data?.education?.degrees),
      certifications: emptyArray(data?.education?.certifications),
      mandatorySkills: emptyArray(data?.skills?.mandatorySkills),
      preferredSkills: emptyArray(data?.skills?.preferredSkills),
      softSkills: emptyArray(data?.skills?.softSkills),
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

    const previousTitle = document.title;
    const exportTitle = `Job-Analysis-${view.jobId}`;

    console.log("[JobAnalysis Export] Preparing PDF template", {
      jobId: view.jobId,
      title: view.title,
    });
   // toast.info("Preparing PDF export");
    document.title = exportTitle;

    window.setTimeout(() => {
      window.print();
      document.title = previousTitle;
      console.log("[JobAnalysis Export] Print dialog opened", exportTitle);
    }, 120);
  };

  const hasMinimumExperience = hasValue(data?.experience?.minimumYears);
  const hasPreferredExperience = hasValue(data?.experience?.preferredYears);
  const hasExperience = hasMinimumExperience || hasPreferredExperience;
  const hasEducation = view.educationQualification.length > 0 || view.certifications.length > 0;

  if (loading) {
    return (
      <main className="ja-page ja-loader-page">
        <Box className="ja-ai-loader-card">
          <Box className="ja-ai-loader-icon">
            <AutoAwesomeIcon />
          </Box>
          <Typography className="ja-loader-title">Job Analysis ID: {view.jobId}</Typography>
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
              Use /job-analysis?request=jobId~jobInstance~clientReference or pass jobId, jobInstance, and clientReference as query parameters.
            </Typography>
          </Card>
        </Box>
      </main>
    );
  }

  return (
    <main className="ja-page">
      <Box className="ja-shell">
        <Stack className="ja-topbar" direction={{ xs: "column", md: "row" }}>
          <Stack className="ja-header-line" direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography className="ja-kicker">Job Analysis ID: {view.jobId}</Typography>
            <Chip size="small" className="ja-ai-chip" icon={<AutoAwesomeIcon />} label="AI Powered" />
          </Stack>

          <Stack className="ja-export-controls" direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button className="ja-action-btn ja-export-btn" startIcon={<FileDownloadOutlinedIcon />} endIcon={<ExpandMoreOutlinedIcon />} onClick={exportPdf} variant="outlined">
              Export
            </Button>
          </Stack>
        </Stack>

        <Box className="ja-grid ja-hero-grid">
          <Card className="ja-hero-card">
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Box className="ja-job-icon">
                <BusinessCenterOutlinedIcon />
              </Box>

              <Box flex={1} minWidth={0}>
                <Box className="ja-title-row">
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography className="ja-title">{view.title}</Typography>
                    <Pill tone="green">Active</Pill>
                  </Stack>
                </Box>

                <Box className="ja-meta-grid">
                  <Meta label="Department" value={view.department} />
                  <Meta label="Level" value={view.level} />
                  <Meta label="Employment" value={view.employment} />
                  <Meta label="Work Model" value={view.workModel} />
                  <Meta label="Location" value={view.location} icon={<LocationOnOutlinedIcon />} />
                  <Meta label="Remote Allowed" value={view.remoteAllowed} icon={<WifiOutlinedIcon />} chipTone="green" />
                </Box>

              </Box>
            </Stack>
            <Box className="ja-hero-summary-grid">
              <Box className="ja-note-panel">
                <InfoTitle icon={<AutoAwesomeIcon />} title="AI JD Summary" />
                <Typography className="ja-body-text">{view.summary}</Typography>
              </Box>
              <Box className="ja-note-panel">
                <InfoTitle icon={<ChecklistRtlOutlinedIcon />} title="Recruiter Notes" />
                <Typography className="ja-body-text">{view.recruiterNotes}</Typography>
              </Box>
            </Box>
          </Card>

          <Card className="ja-related-card">
            <InfoTitle icon={<AutoAwesomeIcon />} title="Related Job Titles" />
            <Box className="ja-related-grid">
              <Pill tone="blue">{view.title}</Pill>
              {view.relatedTitles.map((title) => (
                <Pill key={title} tone="purple">
                  {title}
                </Pill>
              ))}
            </Box>
          </Card>
        </Box>

        <Card>
          <Box className="ja-four-grid">
            <Section className="ja-wide-section" icon={<ChecklistRtlOutlinedIcon />} title="Skills">
              <Box className="ja-skill-grid">
                <SkillGroup title="Must Have" tone="green" items={view.mandatorySkills} />
                <SkillGroup title="Nice To Have" tone="orange" items={view.preferredSkills} />
                <SkillGroup title="Soft Skills" tone="purple" items={view.softSkills} />
              </Box>
            </Section>

            {view.skillExperienceRequirements.length > 0 && (
              <Section className="ja-wide-section" icon={<WorkspacePremiumOutlinedIcon />} title="Skill Experience Requirements">
                <Box className="ja-exp-grid">
                  <Typography className="ja-exp-head">Skill</Typography>
                  <Typography className="ja-exp-head">Minimum Years Required</Typography>
                  {view.skillExperienceRequirements.map((item) => (
                    <Box className="ja-exp-row" key={item.skill}>
                      <Typography className="ja-row-value">{valueOrDash(item.skill)}</Typography>
                      <Pill tone="blue">{valueOrDash(item.minimumYears)} Years</Pill>
                    </Box>
                  ))}
                </Box>
              </Section>
            )}

            {hasExperience && (
              <Section icon={<TimelineOutlinedIcon />} title="Experience">
                {hasMinimumExperience && <Metric label="Minimum" value={formatYears(data?.experience?.minimumYears)} />}
                {hasPreferredExperience && <Metric label="Preferred" value={formatYears(data?.experience?.preferredYears)} />}
              </Section>
            )}

            {hasEducation && (
              <Section icon={<SchoolOutlinedIcon />} title="Education & Certifications">
                {view.educationQualification.length > 0 && (
                  <Metric label="Degree" value={view.educationQualification.join(", ")} />
                )}
                {view.certifications.length > 0 && (
                  <>
                    <Typography className="ja-muted ja-cert-label">Certification</Typography>
                    <Stack direction="row" gap={0.8} flexWrap="wrap">
                      {view.certifications.map((item) => (
                        <Pill key={item} tone="blue">
                          {item}
                        </Pill>
                      ))}
                    </Stack>
                  </>
                )}
              </Section>
            )}

            {view.industryDomains.length > 0 && (
              <Section icon={<AccountBalanceOutlinedIcon />} title="Industry / Domain">
                <Stack direction="row" gap={0.8} flexWrap="wrap">
                  {view.industryDomains.map((item) => (
                    <Pill key={item} tone="purple">
                      {item}
                    </Pill>
                  ))}
                </Stack>
              </Section>
            )}
          </Box>
        </Card>

        <Box className="ja-grid ja-detail-grid">
          <Card>
            <InfoTitle icon={<ManageSearchOutlinedIcon />} title="Boolean Search String" />
            <Typography className="ja-muted">Optimized search string for candidate discovery.</Typography>
            <Box className="ja-code-box">
              <Typography component="pre">{view.booleanSearch}</Typography>
              <IconButton className="ja-copy-btn" onClick={copyBooleanSearch} aria-label="Copy boolean search">
                <ContentCopyOutlinedIcon />
              </IconButton>
            </Box>
          </Card>

          <Card>
            <InfoTitle icon={<FlagOutlinedIcon />} title="Key Skills by Priority" />
            <Stack spacing={1.1}>
              {view.prioritySkills.map((skill, index) => (
                <Stack key={skill} direction="row" alignItems="center" spacing={1}>
                  <span className="ja-rank">{index + 1}</span>
                  <Typography className="ja-row-value">{skill}</Typography>
                </Stack>
              ))}
            </Stack>
          </Card>

          <Card>
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
          </Card>

          <Card>
            <InfoTitle icon={<PaymentsOutlinedIcon />} title="Salary Details" />
            <DetailRows
              rows={[
                ["Salary Type", view.salaryType],
                ["Currency", view.salaryCurrency],
                ["Minimum", view.salaryMin],
                ["Maximum", view.salaryMax],
              ]}
              divided
            />
          </Card>
        </Box>

        <Box className="ja-grid ja-bottom-grid">
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

          <Card>
            <InfoTitle icon={<RocketLaunchOutlinedIcon />} title="Quick Actions" />
            <Box className="ja-actions-grid">
              <Button className="ja-gradient-btn" startIcon={<SearchOutlinedIcon />} onClick={() => showActionToast("Create Candidate Search")} variant="outlined">
                Create Candidate Search
              </Button>
              <Button className="ja-gradient-btn" startIcon={<AddCircleOutlineOutlinedIcon />} onClick={() => showActionToast("Add to Job")} variant="outlined">
                Add to Job
              </Button>
            </Box>
          </Card>
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
  chipTone?: PillTone;
}) {
  return (
    <Box className="ja-meta">
      <Typography className="ja-meta-label">
        {icon}
        {label}
      </Typography>
      {chipTone ? <Pill tone={chipTone}>{value}</Pill> : <Typography className="ja-meta-value">{value}</Typography>}
    </Box>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box className="ja-metric">
      <Typography className="ja-muted">{label}</Typography>
      <Typography className="ja-row-value">{value}</Typography>
    </Box>
  );
}

function SkillGroup({ title, items, tone }: { title: string; items: string[]; tone: PillTone }) {
  return (
    <Box className="ja-skill-group">
      <Typography className="ja-label">{title}</Typography>
      <Stack direction="row" gap={0.7} flexWrap="wrap">
        {items.map((item) => (
          <Pill key={item} tone={tone}>
            {item}
          </Pill>
        ))}
      </Stack>
    </Box>
  );
}

function Pill({ children, tone }: { children: ReactNode; tone: PillTone }) {
  return <Chip size="small" className={`ja-pill ja-pill-${tone}`} label={children} />;
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
