import CryptoJS from "crypto-js";
import type { JobAnalysisRequest } from "@/TalentProATS/api/jobAnalysis";

const URL_SECRET = process.env.NEXT_PUBLIC_SECRET_KEY || "TalentProATS-JD-Analysis";

const toBase64Url = (value: string) =>
  value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  return `${normalized}${padding}`;
};

export const encryptJobAnalysisRequest = (payload: JobAnalysisRequest) => {
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), URL_SECRET).toString();
  return toBase64Url(encrypted);
};

export const decryptJobAnalysisToken = (token: string): JobAnalysisRequest | null => {
  try {
    const encrypted = fromBase64Url(token);
    const bytes = CryptoJS.AES.decrypt(encrypted, URL_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;

    const parsed = JSON.parse(decrypted) as Partial<JobAnalysisRequest>;
    if (!parsed.jobId || !parsed.jobInstance || !parsed.clientReference) return null;

    return {
      jobId: parsed.jobId,
      jobInstance: parsed.jobInstance,
      clientReference: parsed.clientReference,
    };
  } catch (error) {
    console.error("[JobAnalysis URL] Token decrypt failed", error);
    return null;
  }
};
