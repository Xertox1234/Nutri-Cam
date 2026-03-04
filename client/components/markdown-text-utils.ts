export interface InlineSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/** Parse inline bold/italic markers into styled segments. */
export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  // Match **bold**, *italic* (but not ** inside bold).
  // Note: nested bold+italic (e.g. ***text***) is not supported — the outer
  // ** match consumes the content, leaving a stray *. This is an acceptable
  // limitation for a lightweight chat renderer.
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push text before this match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    if (match[2]) {
      // **bold**
      segments.push({ text: match[2], bold: true });
    } else if (match[3]) {
      // *italic*
      segments.push({ text: match[3], italic: true });
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments;
}

/**
 * Match a bullet list line (- item or * item).
 * Note: `* text` (asterisk + space) is treated as a bullet per standard
 * markdown rules, not as italic emphasis. `*text*` (no space) is italic.
 */
export const BULLET_REGEX = /^(\s*)[-*]\s+(.+)/;

/** Match a numbered list line (1. item). */
export const NUMBERED_REGEX = /^(\s*)(\d+)\.\s+(.+)/;
