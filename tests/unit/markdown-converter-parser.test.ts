import { describe, expect, it } from "vitest";
import { parseMarkdownToHtml } from "@/modules/tools/components/tools/markdown-converter-parser";

describe("parseMarkdownToHtml", () => {
  it("mengembalikan string kosong untuk input kosong atau whitespace", () => {
    expect(parseMarkdownToHtml("")).toBe("");
    expect(parseMarkdownToHtml("   \n\n  ")).toBe("");
  });

  it("merender heading, penekanan, blockquote, hr, list, dan paragraf", () => {
    const out = parseMarkdownToHtml(
      "# Judul\n## Sub\n### Kecil\n\nTeks **tebal**, *miring*, dan ~~coret~~.\n\n> Kutipan penting\n\n---\n\n- satu\n- dua\n\n1. pertama\n2. kedua",
    );

    expect(out).toContain("<h1>Judul</h1>");
    expect(out).toContain("<h2>Sub</h2>");
    expect(out).toContain("<h3>Kecil</h3>");
    expect(out).toContain(
      "<p>Teks <strong>tebal</strong>, <em>miring</em>, dan <del>coret</del>.</p>",
    );
    expect(out).toContain("<blockquote>Kutipan penting</blockquote>");
    expect(out).toContain("<hr />");
    expect(out).toContain("<ul>\n<li>satu</li>\n<li>dua</li>");
    expect(out).toContain("<li>pertama</li>\n<li>kedua</li>\n</ul>");
  });

  it("melindungi isi inline code dan code block multi-baris termasuk baris kosong", () => {
    const out = parseMarkdownToHtml(
      "Gunakan `*bintang*` atau `#tag`.\n\n```ts\nconst a = 1;\n\nconst b = '*tidak italic*';\n```",
    );

    expect(out).toContain("<p>Gunakan <code>*bintang*</code> atau <code>#tag</code>.</p>");
    expect(out).toContain(
      '<pre><code class="language-ts">const a = 1;\n\nconst b = &#39;*tidak italic*&#39;;</code></pre>',
    );
    // Blok <pre> tidak dibungkus <p>.
    expect(out).not.toContain("<p><pre>");
  });

  it("menetralisir tag HTML, event handler, dan XSS attribute breakout", () => {
    const out = parseMarkdownToHtml(
      `<script>alert(1)</script><img src=x onerror="alert('xss')" />`,
    );

    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(out).toContain("&quot;alert(&#39;xss&#39;)&quot;");
  });

  it("menolak URL berbahaya dan attribute breakout di tautan maupun bahasa kode", () => {
    const jsLink = parseMarkdownToHtml(`[klik](javascript:alert(1))`);
    expect(jsLink).not.toContain("<a ");
    expect(jsLink).not.toContain('href="javascript:');

    const dataLink = parseMarkdownToHtml(`[data](data:text/html,<script>alert(1)</script>)`);
    expect(dataLink).not.toContain("<a ");

    const quoteBreakout = parseMarkdownToHtml(
      `[xss](https://example.com"onclick="alert(1)) [xss2](https://example.com'onmouseover='alert(1))`,
    );
    expect(quoteBreakout).not.toContain('onclick="alert');
    expect(quoteBreakout).not.toContain("onmouseover='alert");

    const codeLangBreakout = parseMarkdownToHtml('```js" onclick="alert(1)\nconsole.log(1)\n```');
    expect(codeLangBreakout).not.toContain('onclick="alert(1)"');
  });

  it("merender tautan aman dan mempertahankan * di URL", () => {
    const out = parseMarkdownToHtml(
      `[**Dokumentasi**](https://example.com/a*b*c) atau [Email](mailto:halo@example.com)`,
    );

    expect(out).toContain(
      '<a href="https://example.com/a*b*c" target="_blank" rel="noopener noreferrer"><strong>Dokumentasi</strong></a>',
    );
    expect(out).toContain(
      '<a href="mailto:halo@example.com" target="_blank" rel="noopener noreferrer">Email</a>',
    );
  });

  it("tetap aman saat input mengandung string sentinel internal", () => {
    const out = parseMarkdownToHtml("Teks \uE000RK dengan `kode` aman");
    expect(out).toContain("<code>kode</code>");
    expect(out).toContain("\uE000RK");
  });
});
