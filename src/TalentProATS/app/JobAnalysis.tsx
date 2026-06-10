import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
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
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PsychologyAltOutlinedIcon from "@mui/icons-material/PsychologyAltOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import type { ReactNode } from "react";
import { toast } from "react-toastify";
import jdAnalysis from "@/TalentProATS/data/JDanalysis.json";

type JobAnalysisData = typeof jdAnalysis;

type PillTone = "blue" | "green" | "purple" | "orange" | "gray";

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const toYesNo = (value: boolean | string) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
};

export default function JobAnalysis() {
  const data = jdAnalysis as JobAnalysisData;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  const view = useMemo(
    () => ({
      jobId: data.jobId,
      title: data.jobInfo.jobTitle || data.jobInfo.primaryTitle,
      department: data.jobInfo.department,
      level: data.jobInfo.seniorityLevel,
      employment: data.jobInfo.employmentType,
      workModel: data.location.workModel,
      location: `${data.location.city}, ${data.location.state} ${data.location.zipCode}`,
      remoteAllowed: toYesNo(data.location.remoteAllowed),
      salaryMin: formatMoney(data.compensation.salaryMin, data.compensation.currency),
      salaryMax: formatMoney(data.compensation.salaryMax, data.compensation.currency),
      booleanSearch: data.searchOptimization.booleanSearchString,
      educationQualification:
        "educationQualification" in data.education
          ? data.education.educationQualification
          : (data.education as { degrees?: string[] }).degrees || [],
    }),
    [data]
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

  return (
    <main className="ja-page">
      <Box className="ja-shell">
        <Stack className="ja-topbar" direction={{ xs: "column", md: "row" }}>
          <Stack className="ja-header-line" direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography className="ja-kicker">Job Analysis ID: {view.jobId}</Typography>
            <Chip size="small" className="ja-ai-chip" icon={<AutoAwesomeIcon />} label="AI Powered" />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button className="ja-action-btn" startIcon={<EditOutlinedIcon />} onClick={() => showActionToast("Edit JD")} variant="outlined">
              Edit JD
            </Button>
            <Button className="ja-action-btn" endIcon={<ExpandMoreOutlinedIcon />} onClick={() => showActionToast("Export")} variant="outlined">
              Export
            </Button>
            <Button className="ja-primary-btn" onClick={() => showActionToast("View Full JD")} variant="contained">
              View Full JD
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
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography className="ja-title">{view.title}</Typography>
                  <Pill tone="green">Active</Pill>
                </Stack>

                <Box className="ja-meta-grid">
                  <Meta label="Department" value={view.department} />
                  <Meta label="Level" value={view.level} />
                  <Meta label="Employment" value={view.employment} />
                  <Meta label="Work Model" value={view.workModel} />
                  <Meta label="Location" value={view.location} icon={<LocationOnOutlinedIcon />} />
                  <Meta label="Remote Allowed" value={view.remoteAllowed} icon={<WifiOutlinedIcon />} chipTone="green" />
                </Box>

                <Divider className="ja-divider" />

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography className="ja-label">Related Titles</Typography>
                  {data.jobInfo.relatedTitles.map((title) => (
                    <Pill key={title} tone="purple">
                      {title}
                    </Pill>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Card>

          <Card className="ja-summary-card">
            <InfoTitle icon={<AutoAwesomeIcon />} title="AI JD Summary" />
            <Typography className="ja-body-text">{data.summary.jdSummary}</Typography>
            <Divider className="ja-divider" />
            <InfoTitle icon={<PsychologyAltOutlinedIcon />} title="Recruiter Notes" />
            <Typography className="ja-body-text">{data.summary.recruiterNotes}</Typography>
          </Card>
        </Box>

        <Card>
          <Box className="ja-four-grid">
            <Section className="ja-wide-section" icon={<ChecklistRtlOutlinedIcon />} title="Skills">
              <Box className="ja-skill-grid">
                <SkillGroup title="Must Have" tone="green" items={data.skills.mandatorySkills} />
                <SkillGroup title="Nice To Have" tone="orange" items={data.skills.preferredSkills} />
                <SkillGroup title="Soft Skills" tone="purple" items={data.skills.softSkills} />
              </Box>
            </Section>

            <Section icon={<TimelineOutlinedIcon />} title="Experience">
              <Metric label="Minimum" value={`${data.experience.minimumYears} Years`} />
              <Metric label="Preferred" value={`${data.experience.preferredYears} Years`} />
            </Section>

            <Section icon={<SchoolOutlinedIcon />} title="Education & Certifications">
              <Metric label="Degree" value={view.educationQualification.join(", ")} />
              <Typography className="ja-muted ja-cert-label">Certification</Typography>
              <Stack direction="row" gap={0.8} flexWrap="wrap">
                {data.education.certifications.map((item) => (
                  <Pill key={item} tone="blue">
                    {item}
                  </Pill>
                ))}
              </Stack>
            </Section>

            <Section icon={<AccountBalanceOutlinedIcon />} title="Industry / Domain">
              <Stack direction="row" gap={0.8} flexWrap="wrap">
                {data.industryDomains.map((item) => (
                  <Pill key={item} tone="purple">
                    {item}
                  </Pill>
                ))}
              </Stack>
            </Section>
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
              {data.skills.prioritySkills.map((skill, index) => (
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
                ["City", data.location.city],
                ["State", data.location.state],
                ["Country", data.location.country],
                ["ZIP Code", data.location.zipCode],
                ["Work Model", <Pill key="work-model" tone="green">{data.location.workModel}</Pill>],
                ["Remote", <Pill key="remote" tone="green">{view.remoteAllowed}</Pill>],
              ]}
            />
          </Card>

          <Card>
            <InfoTitle icon={<PaymentsOutlinedIcon />} title="Salary Details" />
            <DetailRows
              rows={[
                ["Salary Type", data.compensation.salaryType],
                ["Currency", data.compensation.currency],
                ["Minimum", view.salaryMin],
                ["Maximum", view.salaryMax],
              ]}
              divided
            />
          </Card>
        </Box>

        <Box className="ja-grid ja-bottom-grid">
          <Card>
            <InfoTitle icon={<WorkspacePremiumOutlinedIcon />} title="Skill Experience Requirements" />
            <Box className="ja-exp-grid">
              <Typography className="ja-exp-head">Skill</Typography>
              <Typography className="ja-exp-head">Minimum Years Required</Typography>
              {data.skillExperienceRequirements.map((item) => (
                <Box className="ja-exp-row" key={item.skill}>
                  <Typography className="ja-row-value">{item.skill}</Typography>
                  <Pill tone="blue">{item.minimumYears} Years</Pill>
                </Box>
              ))}
            </Box>
          </Card>

          <Card>
            <InfoTitle icon={<LocalOfferOutlinedIcon />} title="Additional Keywords" />
            <Stack direction="row" gap={0.8} flexWrap="wrap">
              {data.searchOptimization.keywords.map((item) => (
                <Pill key={item} tone="gray">
                  {item}
                </Pill>
              ))}
            </Stack>
          </Card>

          <Card>
            <InfoTitle icon={<RocketLaunchOutlinedIcon />} title="Quick Actions" />
            <Box className="ja-actions-grid">
              <Button className="ja-action-btn" startIcon={<SearchOutlinedIcon />} onClick={() => showActionToast("Create Candidate Search")} variant="outlined">
                Create Candidate Search
              </Button>
              <Button className="ja-action-btn" startIcon={<AddCircleOutlineOutlinedIcon />} onClick={() => showActionToast("Add to Job")} variant="outlined">
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
