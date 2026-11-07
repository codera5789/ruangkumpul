/**
 * Konversi markdown sederhana ke blok JSONB yang dirender ArticleContent.
 * Mendukung: ## heading, ### heading, ``` kode, > kutipan, - / 1. list, paragraf.
 * Dipakai bersama oleh server action (simpan) dan editor klien (pratinjau).
 */

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string; level?: 2 | 3 }
  | { type: "code"; text: string; language?: string }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt?: string }
  | { type: "list"; ordered?: boolean; items: string[] };

export function markdownToBlocks(md: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");

  let paragraph: string[] = [];
  const listItems: string[] = [];
  let listOrdered = false;
  let codeLines: string[] | null = null;
  let codeLang = "";

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", ordered: listOrdered, items: listItems.splice(0) });
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (codeLines !== null) {
      if (line.trim().startsWith("```")) {
        blocks.push({ type: "code", text: codeLines.join("\n"), language: codeLang || undefined });
        codeLines = null;
        codeLang = "";
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();
      codeLang = line.trim().slice(3).trim();
      codeLines = [];
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: line.slice(4).trim(), level: 3 });
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: line.slice(3).trim(), level: 2 });
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", text: line.slice(2).trim() });
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (olMatch || ulMatch) {
      flushParagraph();
      const ordered = Boolean(olMatch);
      if (listItems.length > 0 && ordered !== listOrdered) flushList();
      listOrdered = ordered;
      listItems.push((olMatch ?? ulMatch)![1].trim());
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  if (codeLines !== null) {
    blocks.push({ type: "code", text: codeLines.join("\n"), language: codeLang || undefined });
  }
  flushParagraph();
  flushList();

  return blocks;
}

/** Kembalikan blok JSONB menjadi markdown (untuk mengisi editor saat edit). */
export function blocksToMarkdown(content: unknown): string {
  if (!Array.isArray(content)) {
    return typeof content === "string" ? content : "";
  }

  const out: string[] = [];
  for (const raw of content) {
    const block = raw as ContentBlock;
    switch (block?.type) {
      case "paragraph":
        out.push(block.text, "");
        break;
      case "heading":
        out.push(`${block.level === 3 ? "###" : "##"} ${block.text}`, "");
        break;
      case "code":
        out.push("```" + (block.language ?? ""), block.text, "```", "");
        break;
      case "quote":
        out.push(`> ${block.text}`, "");
        break;
      case "image":
        out.push(`![${block.alt ?? ""}](${block.src})`, "");
        break;
      case "list":
        out.push(
          ...(block.items ?? []).map((item, i) =>
            block.ordered ? `${i + 1}. ${item}` : `- ${item}`,
          ),
          "",
        );
        break;
      default:
        break;
    }
  }
  return out.join("\n").trimEnd();
}
