import type { NextApiRequest, NextApiResponse } from "next";

const MAX_RESUME_BYTES = 25 * 1024 * 1024;

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "Method not allowed." });
  }
  const rawUrl = Array.isArray(request.query.url) ? request.query.url[0] : request.query.url;
  if (!rawUrl) return response.status(400).json({ message: "Resume URL is required." });
  let resumeUrl: URL;
  try {
    resumeUrl = new URL(rawUrl);
    if (!/^https?:$/.test(resumeUrl.protocol)) throw new Error("Invalid protocol");
  } catch {
    return response.status(400).json({ message: "Invalid resume URL." });
  }
  try {
    const upstream = await fetch(resumeUrl, { redirect: "follow" });
    if (!upstream.ok || !upstream.body) return response.status(upstream.status || 502).json({ message: "Unable to download resume." });
    const declaredSize = Number(upstream.headers.get("content-length") || 0);
    if (declaredSize > MAX_RESUME_BYTES) return response.status(413).json({ message: "Resume file is too large." });
    const data = Buffer.from(await upstream.arrayBuffer());
    if (data.byteLength > MAX_RESUME_BYTES) return response.status(413).json({ message: "Resume file is too large." });
    response.setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
    response.setHeader("Cache-Control", "private, max-age=300");
    return response.status(200).send(data);
  } catch {
    return response.status(502).json({ message: "Unable to download resume." });
  }
}
