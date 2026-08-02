// Note bodies are authored in the rich text editor, so they arrive as HTML. The
// cards show a plain-text preview instead of rendering that markup: block-level
// tags become newlines, everything else is dropped, and entities are decoded.
const BLOCK_TAGS =
  /<\/(?:p|div|li|h[1-6]|blockquote|pre|tr|section|article)>|<br\s*\/?>/gi;

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export function noteBodyToPlainText(html: string): string {
  if (!html) {
    return "";
  }

  return html
    .replace(BLOCK_TAGS, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(
      /&[a-z]+;|&#\d+;/gi,
      (entity) => ENTITIES[entity.toLowerCase()] ?? " ",
    )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

// The card shows the first three lines. When there is more note than that, the
// ellipsis is appended to the third line rather than rendered separately, so it
// trails the text instead of sitting on a line of its own. `hasMore` also drives
// the read-more button, so a note that already fits gets neither.
export function noteExcerpt(html: string, lines = 3) {
  const text = noteBodyToPlainText(html);
  const allLines = text.split("\n");
  const shown = allLines.slice(0, lines).join("\n");
  const hasMore = allLines.length > lines || shown.length < text.length;

  return {
    excerpt: hasMore ? `${shown}…` : shown,
    hasMore,
  };
}
