import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateReadingTime(
  text: string,
  wordsPerMinute = 220
): number {
  if (!text) {
    return 1;
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function formatReadingTimeLabel(minutes: number): string {
  return `${minutes} min čtení`;
}

interface PaginateArticleOptions {
  fontSize?: number;
  lineHeight?: number;
  charsPerLine?: number;
  linesPerPage?: number;
}

export function paginateArticleContent(
  text: string,
  options: PaginateArticleOptions = {}
): string[] {
  const { charsPerLine = 60, linesPerPage = 7 } = options;

  if (!text) {
    return [""];
  }

  const sanitized = text.replace(/\s+/g, " ").trim();
  if (!sanitized) {
    return [""];
  }

  const words = sanitized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine.length) {
      currentLine = word;
      continue;
    }

    const tentative = `${currentLine} ${word}`;
    if (tentative.length <= charsPerLine) {
      currentLine = tentative;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine.length) {
    lines.push(currentLine);
  }

  if (!lines.length) {
    return [""];
  }

  const pages: string[] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    const chunk = lines.slice(index, index + linesPerPage);
    pages.push(chunk.join("\n"));
  }

  return pages;
}
