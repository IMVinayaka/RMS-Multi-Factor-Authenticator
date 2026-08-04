import axios from "axios";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";

export type AnalysisErrorDetails = {
  message: string;
  status?: number;
};

const extractApiMessage = (data: unknown): string => {
  if (typeof data === "string") return data.trim();
  if (!data || typeof data !== "object") return "";

  const payload = data as Record<string, unknown>;
  for (const key of ["message", "Message", "detail", "Detail", "title", "Title", "error", "Error"]) {
    if (typeof payload[key] === "string" && payload[key].trim()) return payload[key].trim();
  }

  const validationErrors = payload.errors || payload.Errors;
  if (validationErrors && typeof validationErrors === "object") {
    const messages = Object.values(validationErrors as Record<string, unknown>)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
    if (messages.length) return messages.join(" ");
  }

  return "";
};

export const getAnalysisErrorDetails = (error: unknown, fallback: string): AnalysisErrorDetails => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const apiMessage = extractApiMessage(error.response?.data);
    if (apiMessage) return { message: apiMessage, status };
    if (!error.response) {
      return {
        message: error.code === "ECONNABORTED"
          ? "The request timed out before the service responded."
          : "The analysis service could not be reached. Check your connection and try again.",
      };
    }
    return { message: error.response.statusText || error.message || fallback, status };
  }

  if (error instanceof Error && error.message) return { message: error.message };
  return { message: fallback };
};

export function AnalysisErrorState({
  title,
  error,
  onRetry,
  guidance,
}: {
  title: string;
  error: AnalysisErrorDetails;
  onRetry?: () => void;
  guidance?: string;
}) {
  return (
    <Paper className="analysis-error-card" elevation={0} role="alert">
      <Box className="analysis-error-icon"><ReportProblemOutlinedIcon /></Box>
      <Stack spacing={0.7} alignItems="center">
        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" justifyContent="center" useFlexGap>
          <Typography className="analysis-error-title">Unable to load {title}</Typography>
          {error.status && <Chip size="small" className="analysis-error-status" label={`HTTP ${error.status}`} />}
        </Stack>
        <Typography className="analysis-error-message">{error.message}</Typography>
        {guidance && <Typography className="analysis-error-guidance">{guidance}</Typography>}
      </Stack>
      {onRetry && (
        <Button className="analysis-error-retry" variant="contained" startIcon={<RefreshOutlinedIcon />} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </Paper>
  );
}
