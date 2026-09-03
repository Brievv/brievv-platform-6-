import { getAIProvider } from "@/server/services/ai";
import { createDownloadUrl } from "@/server/services/storage/s3-storage";
import { z } from "zod";

/**
 * Document analysis (spec §11), distinct from the brief estimator
 * (src/server/services/ai/estimator.ts): the estimator reasons about the
 * *text* the client typed; this reasons about the *contents* of what they
 * uploaded. Today that means PDFs — the AEC-specific binary formats (DWG,
 * RVT, IFC) don't have a text-extractable layer this cheaply, and the
 * spec is explicit that BRIEVV should not attempt to build a full
 * CAD/BIM viewer (§19), so those formats are recorded with file-level
 * metadata (name, size, type) only, not content-analyzed.
 *
 * Like the estimator, this never claims to replace professional judgment
 * (spec §11: "Do not claim engineering or architectural professional
 * judgment is replaced by AI") — its output is framed as things for a
 * human reviewer to check, not a verdict.
 */

const analysisResultSchema = z.object({
  documentType: z.string(),
  identifiedDiscipline: z.string().nullable(),
  approximateScope: z.string(),
  missingInformation: z.array(z.string()),
  inconsistencies: z.array(z.string()),
  requiredSpecialists: z.array(z.string()),
  expectedDeliverables: z.array(z.string()),
});
export type DocumentAnalysisResult = z.infer<typeof analysisResultSchema>;

const TEXT_EXTRACTABLE_MIME_TYPES = new Set(["application/pdf"]);

export function isContentAnalyzable(mimeType: string): boolean {
  return TEXT_EXTRACTABLE_MIME_TYPES.has(mimeType);
}

/** Extracts raw text from a PDF's bytes. Throws on non-PDF or corrupt input — callers should catch and fall back to metadata-only handling. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // Lazy import: pdf-parse has a debug code path that tries to read a
  // local test file at module-load time in some versions, which is slow
  // and unnecessary for every request — only pay for it when actually
  // analyzing a PDF.
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text;
}

export async function analyzeDocumentText(text: string, projectContext: { title: string; disciplines: string[] }): Promise<DocumentAnalysisResult> {
  const provider = getAIProvider();
  const truncated = text.slice(0, 15_000); // keep prompts bounded; most drawing-set text sheets don't need more to classify

  const response = await provider.complete({
    system:
      "You are BRIEVV's document analysis assistant for AEC (architecture, engineering, construction) project files. " +
      "You identify what a document is and flag gaps or inconsistencies for a qualified professional to review — " +
      "you do not make engineering, architectural, or code-compliance judgments yourself. " +
      "Respond with ONLY a raw JSON object, no prose, no markdown fences.",
    prompt: `Return ONLY a JSON object with exactly this shape:
{
  "documentType": string (e.g. "architectural floor plan", "structural calculations", "site survey"),
  "identifiedDiscipline": string | null,
  "approximateScope": string (2-3 sentences),
  "missingInformation": string[],
  "inconsistencies": string[],
  "requiredSpecialists": string[],
  "expectedDeliverables": string[]
}

Project: ${projectContext.title}
Project's stated disciplines: ${projectContext.disciplines.join(", ") || "not specified"}

Document text (extracted from an uploaded PDF, may include OCR artifacts or partial sheet content):
"""
${truncated}
"""`,
  });

  const cleaned = response.text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return analysisResultSchema.parse(JSON.parse(cleaned));
}

/**
 * Full pipeline for one ProjectFile: fetch it from storage via a signed
 * URL, extract text if it's a PDF, run the AI pass, return the result.
 * Returns null (not an error) for non-analyzable file types — that's an
 * expected, common case (a DWG upload), not a failure.
 */
export async function analyzeProjectFile(params: {
  storageKey: string;
  mimeType: string;
  projectTitle: string;
  projectDisciplines: string[];
}): Promise<DocumentAnalysisResult | null> {
  if (!isContentAnalyzable(params.mimeType)) return null;

  const downloadUrl = await createDownloadUrl(params.storageKey, 60);
  const fileResponse = await fetch(downloadUrl);
  if (!fileResponse.ok) throw new Error(`Could not fetch file from storage (${fileResponse.status})`);
  const buffer = Buffer.from(await fileResponse.arrayBuffer());

  const text = await extractPdfText(buffer);
  if (!text.trim()) return null; // scanned/image-only PDF with no extractable text layer

  return analyzeDocumentText(text, { title: params.projectTitle, disciplines: params.projectDisciplines });
}
