import { notFound } from "next/navigation";

/**
 * Renderer konten artikel (JSONB block format).
 * Blok tidak dikenal diabaikan dengan aman.
 */

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string; level?: 2 | 3 }
  | { type: "code"; text: string; language?: string }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt?: string }
  | { type: "list"; ordered?: boolean; items: string[] };

function isSafeImageSrc(src: unknown): src is string {
  if (typeof src !== "string" || src.length === 0) return false;
  return (src.startsWith("/") && !src.startsWith("//")) || /^https?:\/\//i.test(src);
}

function isBlock(value: unknown): value is ContentBlock {
  if (typeof value !== "object" || value === null) return false;
  const block = value as Record<string, unknown>;
  switch (block.type) {
    case "paragraph":
    case "quote":
      return typeof block.text === "string";
    case "heading":
      return (
        typeof block.text === "string" &&
        (block.level === undefined || block.level === 2 || block.level === 3)
      );
    case "code":
      return (
        typeof block.text === "string" &&
        (block.language === undefined || typeof block.language === "string")
      );
    case "image":
      return (
        isSafeImageSrc(block.src) &&
        (block.alt === undefined || typeof block.alt === "string")
      );
    case "list":
      return (
        Array.isArray(block.items) &&
        (block.ordered === undefined || typeof block.ordered === "boolean")
      );
    default:
      return false;
  }
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-pretty leading-relaxed text-ink-secondary">{block.text}</p>
      );
    case "heading":
      return block.level === 3 ? (
        <h3 className="pt-2 text-xl font-bold text-ink">{block.text}</h3>
      ) : (
        <h2 className="pt-4 text-2xl font-extrabold tracking-tight text-ink">
          {block.text}
        </h2>
      );
    case "code":
      return (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          {block.language ? (
            <div className="border-b border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400">
              {block.language}
            </div>
          ) : null}
          <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-100">
            <code>{block.text}</code>
          </pre>
        </div>
      );
    case "quote":
      return (
        <blockquote className="rounded-r-xl border-l-4 border-brand-600 bg-brand-50 px-5 py-3.5 text-pretty italic leading-relaxed text-brand-900">
          {block.text}
        </blockquote>
      );
    case "image":
      if (!isSafeImageSrc(block.src)) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.src}
          alt={block.alt ?? ""}
          loading="lazy"
          className="rounded-xl border border-slate-200"
        />
      );
    case "list": {
      const items = block.items.filter((i) => typeof i === "string" && i.length > 0);
      if (items.length === 0) return null;
      return block.ordered ? (
        <ol className="list-decimal space-y-1.5 pl-6 leading-relaxed text-ink-secondary">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc space-y-1.5 pl-6 leading-relaxed text-ink-secondary">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    default:
      return null;
  }
}

export function ArticleContent({ content }: { content: unknown }) {
  // Format didukung: array blok. Teks polos juga diterima (dipecah per baris kosong).
  let blocks: ContentBlock[];

  if (Array.isArray(content)) {
    blocks = content.filter(isBlock);
  } else if (typeof content === "string" && content.trim().length > 0) {
    blocks = content
      .split(/\n{2,}/)
      .map((text) => ({ type: "paragraph", text: text.trim() }) as ContentBlock);
  } else {
    blocks = [];
  }

  if (blocks.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-5 text-base">
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  );
}
