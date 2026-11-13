/**
 * Konverter Markdown sederhana ke HTML aman (XSS-safe).
 * Mengekstrak logika murni parser agar dapat diuji langsung di Node/Vitest.
 */
export function parseMarkdownToHtml(md: string): string {
  if (!md.trim()) return "";

  // Sentinel unik agar placeholder internal tidak bertabrakan dengan teks input.
  let sentinel = "\uE000RK";
  while (md.includes(sentinel)) {
    sentinel += "_";
  }

  const protectedChunks: string[] = [];
  const protect = (htmlFragment: string): string => {
    const idx = protectedChunks.length;
    protectedChunks.push(htmlFragment);
    return `${sentinel}${idx}${sentinel}`;
  };

  // 1. Amankan seluruh karakter HTML berbahaya, termasuk kutip ganda & tunggal
  //    agar atribut href/class tidak bisa ditembus (attribute breakout).
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // 2. Blok kode (dilindungi sebelum aturan heading/emphasis agar isi tidak berubah)
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
    const cleanLang = lang.trim();
    const langAttr = cleanLang ? ` class="language-${cleanLang}"` : "";
    return protect(`<pre><code${langAttr}>${code.trim()}</code></pre>`);
  });

  // 3. Inline code (dilindungi agar * atau # di dalam backtick tidak diformat)
  html = html.replace(/`([^`]+)`/g, (_match, code: string) => protect(`<code>${code}</code>`));

  // 4. Headings
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // 5. Blockquote (kembalikan &gt; yang sebelumnya di-escape pada awal baris)
  html = html.replace(/^&gt; (.*$)/gim, "<blockquote>$1</blockquote>");

  // 6. Horizontal rule
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gim, "<hr />");

  // 7. Tautan aman (hanya http, https, atau mailto; tolak entitas kutip di URL
  //    dan lindungi sebelum bold/italic agar `*` di URL tidak jadi `<em>`)
  html = html.replace(
    /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)(?:(?!&quot;|&#39;)[^\s)])+)\)/g,
    (_match, text: string, url: string) => {
      const formattedText = text
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/~~([^~]+)~~/g, "<del>$1</del>");
      return protect(
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${formattedText}</a>`,
      );
    },
  );

  // 8. Bold, Italic & Strikethrough
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  // 9. Unordered list & ordered list
  html = html.replace(/^\s*[-*]\s+(.*)$/gim, "<li>$1</li>");
  html = html.replace(/^\s*\d+\.\s+(.*)$/gim, "<li>$1</li>");

  // 10. Bungkus baris sisa menjadi paragraf
  const lines = html.split("\n");
  const processed: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        processed.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith("<li>")) {
      if (!inList) {
        processed.push("<ul>");
        inList = true;
      }
      processed.push(trimmed);
      continue;
    }

    if (inList) {
      processed.push("</ul>");
      inList = false;
    }

    const isBlockPlaceholder = new RegExp(`^${sentinel}(\\d+)${sentinel}$`).exec(trimmed);
    const isProtectedBlock =
      isBlockPlaceholder && protectedChunks[Number(isBlockPlaceholder[1])]?.startsWith("<pre>");

    if (
      isProtectedBlock ||
      trimmed.startsWith("<h1") ||
      trimmed.startsWith("<h2") ||
      trimmed.startsWith("<h3") ||
      trimmed.startsWith("<blockquote") ||
      trimmed.startsWith("<hr")
    ) {
      processed.push(trimmed);
    } else {
      processed.push(`<p>${trimmed}</p>`);
    }
  }

  if (inList) {
    processed.push("</ul>");
  }

  return processed
    .join("\n")
    .replace(new RegExp(`${sentinel}(\\d+)${sentinel}`, "g"), (_m, i: string) => protectedChunks[Number(i)] ?? "");
}
