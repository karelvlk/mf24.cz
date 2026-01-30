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
  totalPages?: number;
  containerWidth?: number;
  containerHeight?: number;
  fontFamily?: string;
}

export function paginateArticleContent(
  text: string,
  options: PaginateArticleOptions = {}
): string[] {
  const {
    charsPerLine = 60,
    linesPerPage = 7,
    fontSize = 16,
    lineHeight = 1.5,
    containerWidth,
    containerHeight,
    totalPages,
    fontFamily
  } = options;

  if (!text) {
    return [""];
  }

  const sanitized = text.replace(/\s+/g, " ").trim();
  if (!sanitized) {
    return [""];
  }

  const segments =
    sanitized
      .split(/(?<=[.,])\s+/)
      .map((piece) => piece.trim())
      .filter(Boolean) ?? [sanitized];

  if (typeof totalPages === "number" && Number.isFinite(totalPages) && totalPages > 0) {
    const targetPages = Math.max(1, Math.floor(totalPages));
    const segmentsPerPage = Math.max(1, Math.ceil(segments.length / targetPages));
    const pages: string[] = [];

    for (let index = 0; index < segments.length; index += segmentsPerPage) {
      pages.push(segments.slice(index, index + segmentsPerPage).join(" ").trim());
    }

    if (pages.length < targetPages) {
      pages.push(...Array.from({ length: targetPages - pages.length }, () => ""));
    }

    return pages;
  }

  const canMeasure =
    typeof document !== "undefined" &&
    typeof containerWidth === "number" &&
    containerWidth > 0 &&
    typeof containerHeight === "number" &&
    containerHeight > 0;

  if (canMeasure) {
    const measureEl = document.createElement("div");
    measureEl.style.position = "absolute";
    measureEl.style.visibility = "hidden";
    measureEl.style.pointerEvents = "none";
    measureEl.style.width = `${containerWidth}px`;
    measureEl.style.fontSize = `${fontSize}px`;
    measureEl.style.lineHeight = `${lineHeight}`;
    measureEl.style.whiteSpace = "pre-wrap";
    measureEl.style.wordBreak = "break-word";
    measureEl.style.top = "0";
    measureEl.style.left = "0";
    measureEl.style.padding = "0";
    measureEl.style.margin = "0";
    measureEl.style.boxSizing = "border-box";
    measureEl.style.fontFamily = fontFamily ?? "inherit";

    document.body.appendChild(measureEl);

    const pages: string[] = [];
    let currentSegments: string[] = [];

    const attemptToAdd = (segment: string) => {
      const tentativeSegments = [...currentSegments, segment];
      const tentativeContent = tentativeSegments.join(" ").trim();
      if (fitsWithinHeight(tentativeContent) || currentSegments.length === 0) {
        currentSegments = tentativeSegments;
        return true;
      }
      return false;
    };

    const pushPage = () => {
      if (currentSegments.length) {
        pages.push(currentSegments.join(" ").trim());
        currentSegments = [];
      }
    };

    const fitsWithinHeight = (content: string) => {
      measureEl.textContent = content;
      return measureEl.scrollHeight <= containerHeight;
    };

    for (const segment of segments) {
      if (attemptToAdd(segment)) {
        continue;
      }

      // Segment doesn't fit after current content; finalize current page if it has content
      pushPage();

      // Try segment on a fresh page
      if (attemptToAdd(segment)) {
        continue;
      }

      // If it still doesn't fit, start a new page and place it regardless
      pushPage();
      currentSegments = [segment.trim()];
    }

    if (currentSegments.length) {
      pages.push(currentSegments.join(" ").trim());
    }

    document.body.removeChild(measureEl);

    return pages.length ? pages : [""];
  }

  const estimatedLinesPerPage =
    typeof containerHeight === "number" && Number.isFinite(containerHeight) && fontSize > 0
      ? Math.max(1, Math.floor(containerHeight / (fontSize * lineHeight)))
      : linesPerPage;

  const averageCharWidthFactor =
    typeof fontFamily === "string" && fontFamily.toLowerCase().includes("mono") ? 0.6 : 0.55;
  const estimatedCharsPerLine =
    typeof containerWidth === "number" && Number.isFinite(containerWidth) && fontSize > 0
      ? Math.max(20, Math.floor(containerWidth / (fontSize * averageCharWidthFactor)))
      : charsPerLine;

  const pages: string[] = [];
  let currentSegments: string[] = [];
  let currentCharCount = 0;

  for (const segment of segments) {
    const separator = currentSegments.length ? 1 : 0;
    const tentativeCharCount = currentCharCount + segment.length + separator;
    const estimatedLines = Math.ceil(tentativeCharCount / estimatedCharsPerLine);

    if (estimatedLines <= estimatedLinesPerPage || currentSegments.length === 0) {
      currentSegments.push(segment);
      currentCharCount = tentativeCharCount;
    } else {
      pages.push(currentSegments.join(" ").trim());
      currentSegments = [segment];
      currentCharCount = segment.length;
    }
  }

  if (currentSegments.length) {
    pages.push(currentSegments.join(" ").trim());
  }

  return pages.length ? pages : [""];
}
