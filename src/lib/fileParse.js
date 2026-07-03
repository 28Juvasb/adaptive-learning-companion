// Client-side text extraction from uploaded PDF and DOCX/TXT files.
// Extracted text is used to ground the tutor (same channel as pasted resources).

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_CHARS = 20_000; // keep grounding text within a sane token budget

export const ACCEPTED = ".pdf,.docx,.txt,.md";

function truncate(text) {
  const clean = text.replace(/\n{3,}/g, "\n\n").trim();
  return clean.length > MAX_CHARS ? clean.slice(0, MAX_CHARS) + "\n…[truncated]" : clean;
}

async function extractPdf(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let out = "";
  const pageCount = Math.min(pdf.numPages, 40);
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it) => it.str).join(" ") + "\n\n";
    if (out.length > MAX_CHARS) break;
  }
  return out;
}

async function extractDocx(file) {
  // mammoth ships a browser bundle
  const mammoth = (await import("mammoth/mammoth.browser.js")).default;
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}

async function extractText(file) {
  return file.text();
}

/**
 * Parse one File into plain text. Returns { name, chars, text }.
 * Throws a friendly Error for unsupported or unreadable files.
 */
export async function parseFile(file) {
  const name = file.name.toLowerCase();
  let text = "";
  try {
    if (name.endsWith(".pdf")) text = await extractPdf(file);
    else if (name.endsWith(".docx")) text = await extractDocx(file);
    else if (name.endsWith(".txt") || name.endsWith(".md")) text = await extractText(file);
    else throw new Error(`Unsupported file type. Use PDF, DOCX, TXT, or MD.`);
  } catch (err) {
    if (err.message.startsWith("Unsupported")) throw err;
    throw new Error(`Couldn't read "${file.name}". It may be scanned images or corrupted.`);
  }

  const clean = truncate(text);
  if (clean.length < 20) {
    throw new Error(`"${file.name}" had no extractable text (scanned image PDFs aren't supported).`);
  }
  return { name: file.name, chars: clean.length, text: clean };
}
