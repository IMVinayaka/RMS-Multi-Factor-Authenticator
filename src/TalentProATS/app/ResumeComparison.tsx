import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, CircularProgress, IconButton, Paper, Snackbar, Tooltip, Typography } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { useRouter } from "next/router";
import { analyseJobDescription, type JobAnalysisRequest, type JobAnalysisResponse, type SkillValue } from "@/TalentProATS/api/jobAnalysis";
import { auditResume, type ResumeAuditRequest, type ResumeAuditResponse } from "@/TalentProATS/api/resumeAudit";

export type ResumeHighlightSelection = { id: string; label: string; aliases: string[] };
type SearchItem = ResumeHighlightSelection;
type Section = { title: string; items: SearchItem[] };
type RenderState = { status: "idle" | "loading" | "ready" | "fallback"; html: string; message?: string };
const renderedResumeCache = new Map<string, RenderState>();

const queryValue = (query: Record<string, string | string[] | undefined>, ...keys: string[]) => {
  for (const key of keys) {
    const value = query[key];
    if (value) return Array.isArray(value) ? value[0] : value;
  }
};

const parseRequests = (query: Record<string, string | string[] | undefined>) => {
  const candidateId = queryValue(query, "CandID", "candId", "candidateId", "candidateid");
  const candidateInstance = queryValue(query, "CandInstance", "candInstance", "candidateInstance", "candidateinstance");
  const jobId = queryValue(query, "JobID", "jobId", "jobid");
  const jobInstance = queryValue(query, "JobInstance", "jobInstance", "jobinstance");
  const userId = queryValue(query, "UserID", "userId", "userid");
  const userInstance = queryValue(query, "UserInstance", "userInstance", "userinstance");
  const clientReference = queryValue(query, "ClientReference", "clientReference", "clientreference", "ClientRef", "clientRef", "clientref", "ClientID", "clientId", "clientid") || jobInstance;
  if (!candidateId || !candidateInstance || !jobId || !jobInstance || !userId || !userInstance || !clientReference) return null;
  return {
    audit: { candidateId, candidateInstance, jobId, jobInstance, userId, userInstance } satisfies ResumeAuditRequest,
    job: { jobId, jobInstance, clientReference, userId, userInstance } satisfies JobAnalysisRequest,
  };
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
const fileExtension = (url: string) => (url.split(/[?#]/)[0].match(/\.([^.\/]+)$/)?.[1] || "").toLowerCase();
const fallbackUrl = (url: string) => ["doc", "docx"].includes(fileExtension(url)) ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}` : encodeURI(url);

const normalizeSkill = (value: SkillValue, id: string): SearchItem | null => {
  if (typeof value === "string") return value.trim() ? { id, label: value.trim(), aliases: [value.trim()] } : null;
  const label = String(value?.skill || value?.Skill || "").trim();
  if (!label) return null;
  const skillRecord = value as {
    resumeSynonyms?: string[] | string | null;
    ResumeSynonyms?: string[] | string | null;
    synonyms?: string[] | string | null;
    Synonyms?: string[] | string | null;
    commonResumeTerms?: string[] | string | null;
    CommonResumeTerms?: string[] | string | null;
  };
  const synonymValue = skillRecord.resumeSynonyms || skillRecord.ResumeSynonyms || skillRecord.synonyms || skillRecord.Synonyms || skillRecord.commonResumeTerms || skillRecord.CommonResumeTerms || [];
  const synonyms = Array.isArray(synonymValue) ? synonymValue : String(synonymValue).split(/[,;|]/);
  return { id, label, aliases: Array.from(new Set([label, ...synonyms].map(String).map((item) => item.trim()).filter(Boolean))) };
};

const makeItems = (values: SkillValue[] | undefined, prefix: string) => (values || []).map((value, index) => normalizeSkill(value, `${prefix}-${index}`)).filter(Boolean) as SearchItem[];
const stringItems = (values: string[] | undefined, prefix: string) => (values || []).map((label, index) => ({ id: `${prefix}-${index}`, label, aliases: [label] })).filter((item) => item.label.trim());

async function renderPdf(buffer: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.25 });
    const content = await page.getTextContent();
    const spans = content.items.map((raw) => {
      const item = raw as { str?: string; transform?: number[]; width?: number; height?: number };
      if (!item.str || !item.transform) return "";
      const x = item.transform[4] * 1.25;
      const fontSize = Math.max(8, Math.abs(item.transform[3]) * 1.25);
      const top = viewport.height - item.transform[5] * 1.25 - fontSize;
      return `<span style="left:${x}px;top:${top}px;font-size:${fontSize}px;line-height:1.1">${escapeHtml(item.str)}</span>`;
    }).join("");
    pages.push(`<section class="rc-pdf-page" style="width:${viewport.width}px;height:${viewport.height}px">${spans}</section>`);
  }
  return pages.join("");
}

// The highlighter intentionally mutates this subtree. Memoization prevents
// counter/navigation state updates in ResumeDocument from asking React to
// restore the original dangerouslySetInnerHTML and erase those marks.
const RenderedResumeHtml = memo(forwardRef<HTMLDivElement, { html: string; extension: string }>(function RenderedResumeHtml({ html, extension }, ref) {
  return <div ref={ref} className={`rc-document rc-document-${extension}`} dangerouslySetInnerHTML={{ __html: html }} />;
}));

export function InteractiveResumeViewer({
  url,
  selection,
  evidenceTerms = [],
  onClearSelection,
}: {
  url: string;
  selection: ResumeHighlightSelection | null;
  evidenceTerms?: string[];
  onClearSelection?: () => void;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const matchesRef = useRef<HTMLElement[]>([]);
  const [render, setRender] = useState<RenderState>({ status: "idle", html: "" });
  const [activeMatch, setActiveMatch] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [noMatch, setNoMatch] = useState(false);
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [suppressSelection, setSuppressSelection] = useState(false);

  const allEvidenceSelection = useMemo<ResumeHighlightSelection | null>(() => {
    const aliases = Array.from(new Set(evidenceTerms.map((term) => term.trim()).filter(Boolean)));
    return aliases.length ? { id: "all-evidence", label: "All evidence", aliases } : null;
  }, [evidenceTerms]);
  const activeSelection = showAllEvidence ? allEvidenceSelection : suppressSelection ? null : selection;

  const scrollToMatch = useCallback((match: HTMLElement) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const matchRect = match.getBoundingClientRect();
    const top = container.scrollTop + matchRect.top - containerRect.top - container.clientHeight / 2 + matchRect.height / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!url) return;
    const cachedRender = renderedResumeCache.get(url);
    if (cachedRender) {
      setRender(cachedRender);
      return;
    }
    let live = true;
    setRender({ status: "loading", html: "" });
    (async () => {
      try {
        const extension = fileExtension(url);
        if (extension === "doc") throw new Error("Legacy DOC uses the document viewer fallback.");
        if (extension !== "pdf" && extension !== "docx") throw new Error("Unsupported document format.");
        const response = await fetch(`/api/resume-document?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`Document download failed (${response.status}).`);
        const buffer = await response.arrayBuffer();
        let html = "";
        if (extension === "pdf") html = await renderPdf(buffer);
        else {
          const mammoth = await import("mammoth/mammoth.browser");
          html = (await mammoth.convertToHtml({ arrayBuffer: buffer })).value;
        }
        const nextRender: RenderState = { status: "ready", html };
        renderedResumeCache.set(url, nextRender);
        if (live) setRender(nextRender);
      } catch (error) {
        const nextRender: RenderState = { status: "fallback", html: "", message: error instanceof Error ? error.message : "Conversion failed." };
        renderedResumeCache.set(url, nextRender);
        if (live) setRender(nextRender);
      }
    })();
    return () => { live = false; };
  }, [url]);

  useEffect(() => {
    if (!selection) return;
    setShowAllEvidence(false);
    setSuppressSelection(false);
  }, [selection]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root || render.status !== "ready") return;
    matchesRef.current = [];
    setMatchCount(0);
    setActiveMatch(0);
    setNoMatch(false);
    let cancelled = false;
    let marker: import("mark.js") | null = null;
    import("mark.js").then(({ default: Mark }) => {
      if (cancelled) return;
      marker = new Mark(root);
      marker.unmark({
        done: () => {
          if (cancelled || !activeSelection) return;
          const aliases = Array.from(new Set(activeSelection.aliases.map((alias) => alias.trim()).filter(Boolean))).sort((a, b) => b.length - a.length);
          if (!aliases.length) return;
          const phrasePattern = aliases.map((alias) => alias
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("\\s+")
          ).join("|");
          const wholeTermPattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${phrasePattern})(?=$|[^\\p{L}\\p{N}_])`, "giu");
          marker?.markRegExp(wholeTermPattern, {
            acrossElements: true,
            ignoreGroups: 1,
            className: "rc-highlight",
            each: (element) => {
              const match = element as HTMLElement;
              match.style.setProperty("background-color", "#ffeb3b", "important");
              match.style.setProperty("color", "#111827", "important");
              matchesRef.current.push(match);
            },
            done: () => {
              if (cancelled) return;
              const count = matchesRef.current.length;
              setMatchCount(count);
              if (!count) setNoMatch(true);
              else {
                matchesRef.current[0].classList.add("rc-highlight-active");
                scrollToMatch(matchesRef.current[0]);
              }
            },
          });
        },
      });
    });
    return () => {
      cancelled = true;
      marker?.unmark();
    };
  }, [activeSelection, render, scrollToMatch]);

  const navigate = useCallback((direction: number) => {
    const matches = matchesRef.current;
    if (!matches.length) return;
    matches[activeMatch]?.classList.remove("rc-highlight-active");
    const next = (activeMatch + direction + matches.length) % matches.length;
    setActiveMatch(next);
    matches[next].classList.add("rc-highlight-active");
    matches[next].style.setProperty("background-color", "#ffeb3b", "important");
    scrollToMatch(matches[next]);
  }, [activeMatch, scrollToMatch]);

  return <Box className="rc-resume-panel">
    <Box className="rc-panel-header rc-resume-header">
      <Box className="rc-resume-title-actions">
        <Typography variant="h6">Interactive Resume</Typography>
        {allEvidenceSelection && (
          <Button
            className={showAllEvidence ? "rc-evidence-toggle rc-evidence-toggle-active" : "rc-evidence-toggle"}
            variant="outlined"
            size="small"
            aria-pressed={showAllEvidence}
            onClick={() => {
              onClearSelection?.();
              if (showAllEvidence) {
                setShowAllEvidence(false);
                setSuppressSelection(true);
              } else {
                setShowAllEvidence(true);
                setSuppressSelection(false);
              }
            }}
          >
            {showAllEvidence ? "Hide Evidence" : "Show Evidence"}
          </Button>
        )}
      </Box>
      {matchCount > 1 && <Box className="rc-nav"><IconButton size="small" onClick={() => navigate(-1)} aria-label="Previous occurrence"><ArrowBackIosNewRoundedIcon /></IconButton><span>{activeMatch + 1} of {matchCount}</span><IconButton size="small" onClick={() => navigate(1)} aria-label="Next occurrence"><ArrowForwardIosRoundedIcon /></IconButton></Box>}
    </Box>
    <Box className="rc-document-scroll" ref={scrollContainerRef}>
      {render.status === "loading" && <Box className="rc-centered"><CircularProgress size={28} /><Typography>Converting resume…</Typography></Box>}
      {render.status === "ready" && <RenderedResumeHtml ref={contentRef} html={render.html} extension={fileExtension(url)} />}
      {render.status === "fallback" && <><Box className="rc-fallback-note">Interactive conversion was unavailable. Showing the original document viewer.</Box><iframe className="rc-fallback-frame" src={fallbackUrl(url)} title="Resume document" /></>}
    </Box>
    <Snackbar open={noMatch} autoHideDuration={2600} onClose={() => setNoMatch(false)} message="No occurrences found in the resume." anchorOrigin={{ vertical: "bottom", horizontal: "right" }} />
  </Box>;
}

export default function ResumeComparison() {
  const router = useRouter();
  const [job, setJob] = useState<JobAnalysisResponse | null>(null);
  const [audit, setAudit] = useState<ResumeAuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<SearchItem | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const requests = parseRequests(router.query);
    if (!requests) { setError("Missing comparison request parameters."); setLoading(false); return; }
    let live = true;
    setLoading(true);
    Promise.all([analyseJobDescription(requests.job), auditResume(requests.audit)])
      .then(([jobResult, auditResult]) => { if (live) { setJob(jobResult); setAudit(auditResult); } })
      .catch(() => { if (live) setError("Unable to load JD analysis and resume audit."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [router.isReady, router.asPath]);

  const sections = useMemo<Section[]>(() => {
    if (!job) return [];
    const primaryTitle = job.jobInfo?.primaryTitle || job.searchOptimization?.searchTitles?.primaryTitle || job.jobInfo?.jobTitle;
    const relatedTitles = Array.from(new Set([...(job.jobInfo?.relatedTitles || []), ...(job.searchOptimization?.searchTitles?.relatedTitles || [])].filter(Boolean)));
    const allTitles = Array.from(new Set([primaryTitle, ...relatedTitles].filter(Boolean))) as string[];
    const addSearchSynonyms = (items: SearchItem[]) => items.map((item) => {
      const synonymMap = job.searchOptimization?.searchSynonyms || {};
      const extra = Object.entries(synonymMap).find(([key]) => key.trim().toLowerCase() === item.label.trim().toLowerCase())?.[1] || [];
      return { ...item, aliases: Array.from(new Set([...item.aliases, ...extra].map(String).map((value) => value.trim()).filter(Boolean))) };
    });
    return [
      { title: "Job Title", items: allTitles.map((label, index) => ({ id: `job-title-${index}`, label, aliases: allTitles })) },
      { title: "Mandatory Skills", items: addSearchSynonyms(makeItems(job.skills?.mandatorySkills, "mandatory")) },
      { title: "Preferred Skills", items: addSearchSynonyms(makeItems(job.skills?.preferredSkills, "preferred")) },
      { title: "Technical Skills", items: addSearchSynonyms(stringItems(job.technologies, "technical")) },
      { title: "Domain Skills", items: addSearchSynonyms(stringItems(job.industryDomains, "domain")) },
      { title: "Soft Skills", items: addSearchSynonyms(makeItems(job.skills?.softSkills, "soft")) },
    ].filter((section) => section.items.length);
  }, [job]);
  const allEvidenceTerms = useMemo(
    () => Array.from(new Set(sections.flatMap((section) => section.items.flatMap((item) => item.aliases)))),
    [sections]
  );

  const resumeUrl = String(audit?.candidate?.ResumeFileURL || audit?.candidate?.resumeFileURL || audit?.candidate?.resumeFileUrl || "");
  if (loading) return <Box className="rc-page rc-centered"><CircularProgress /><Typography>Loading comparison…</Typography></Box>;
  if (error) return <Box className="rc-page rc-centered"><Typography color="error">{error}</Typography></Box>;
  return <Box className="rc-page">
    <Box className="rc-titlebar"><Box><Typography className="rc-eyebrow">JD Analyse vs Resume</Typography><Typography variant="h5">Skill & job title comparison</Typography></Box><DescriptionOutlinedIcon /></Box>
    <Box className="rc-grid">
      <Paper className="rc-jd-panel" elevation={0}><Box className="rc-panel-header"><Box><Typography className="rc-eyebrow">JD Analyse</Typography><Typography variant="h6">{job?.jobInfo?.jobTitle || "Job requirements"}</Typography></Box></Box><Box className="rc-jd-scroll">{sections.map((section) => <Box className="rc-section" key={section.title}><Typography className="rc-section-title">{section.title}</Typography><Box className="rc-chips">{section.items.map((item) => { const synonyms = item.aliases.filter((alias) => alias.toLowerCase() !== item.label.toLowerCase()); return <Tooltip key={item.id} arrow placement="top" title={<Box><Typography sx={{ fontSize: 12, fontWeight: 700 }}>Resume synonyms</Typography><Typography sx={{ fontSize: 12 }}>{synonyms.length ? synonyms.join(", ") : "No synonyms provided"}</Typography></Box>}><Chip label={item.label} clickable onClick={() => setSelection({ ...item })} className={selection?.id === item.id ? "rc-chip rc-chip-active" : "rc-chip"} /></Tooltip>; })}</Box></Box>)}</Box></Paper>
      <Paper className="rc-resume-wrap" elevation={0}>{resumeUrl ? <InteractiveResumeViewer url={resumeUrl} selection={selection} evidenceTerms={allEvidenceTerms} onClearSelection={() => setSelection(null)} /> : <Box className="rc-centered"><Typography>No resume document is available.</Typography></Box>}</Paper>
    </Box>
  </Box>;
}
