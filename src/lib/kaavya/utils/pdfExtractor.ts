import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for Vite/Next.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

export type PdfErrorKind = 'password-protected' | 'corrupt' | 'no-text' | 'too-large' | 'unknown';

export class PdfExtractionError extends Error {
  kind: PdfErrorKind;
  constructor(kind: PdfErrorKind, message: string) {
    super(message);
    this.name = 'PdfExtractionError';
    this.kind = kind;
  }
}

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB

export async function extractTextFromPdf(file: File): Promise<string> {
  if (file.size > MAX_PDF_SIZE) {
    throw new PdfExtractionError('too-large', `PDF is ${Math.round(file.size / 1024 / 1024)}MB. Maximum supported size is 50MB.`);
  }

  const arrayBuffer = await file.arrayBuffer();

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('password')) {
      throw new PdfExtractionError('password-protected', 'This PDF is password-protected. Please remove the password and try again.');
    }
    throw new PdfExtractionError('corrupt', 'This file appears to be corrupted or is not a valid PDF.');
  }

  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }

  const result = textParts.join('\n\n');
  if (!result.trim()) {
    throw new PdfExtractionError('no-text', 'No extractable text found in this PDF. The file may contain only scanned images. Try pasting the text directly instead.');
  }
  return result;
}
