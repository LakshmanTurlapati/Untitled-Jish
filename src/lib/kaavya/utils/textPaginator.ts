/** Default lines per page for the reader */
const DEFAULT_LINES_PER_PAGE = 20;

/**
 * Split kaavya text into pages, respecting shloka boundaries.
 * Splits on double danda (||) first, then single danda (|), then newlines.
 * Each page contains approximately `linesPerPage` lines.
 */
export function paginateText(text: string, linesPerPage = DEFAULT_LINES_PER_PAGE): string[] {
  if (!text.trim()) return [];

  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const pages: string[] = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    const pageLines = lines.slice(i, i + linesPerPage);
    pages.push(pageLines.join('\n'));
  }

  return pages.length > 0 ? pages : [text];
}
