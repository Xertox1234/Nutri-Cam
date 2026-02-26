/**
 * Pure formatting utilities for SavedItemCard.
 * Extracted for testability — no React or RN dependencies.
 */

interface ShareableItem {
  title: string;
  description: string | null;
  instructions: string | null;
  sourceProductName: string | null;
}

/** Build the share message content for a saved item. */
export function buildShareContent(item: ShareableItem): string {
  let content = `${item.title}\n`;

  if (item.description) {
    content += `\n${item.description}\n`;
  }

  if (item.instructions) {
    content += `\nInstructions:\n${item.instructions}\n`;
  }

  if (item.sourceProductName) {
    content += `\nSuggested for: ${item.sourceProductName}`;
  }

  return content;
}
