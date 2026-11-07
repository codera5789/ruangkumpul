import { describe, expect, it } from "vitest";
import { blocksToMarkdown, markdownToBlocks } from "@/modules/knowledge/markdown";
import { formatCompactId, slugify, truncate } from "@/lib/utils";

describe("slugify", () => {
  it("mengubah judul menjadi slug url-safe", () => {
    expect(slugify("Cara Cepat Belajar!")).toBe("cara-cepat-belajar");
  });

  it("menangani karakter Indonesia (ejaan beraksen dipecah)", () => {
    expect(slugify("Kafé & Co — Bagian #1")).toBe("kafe-co-bagian-1");
  });

  it("menghasilkan string kosong untuk input non-alfanumerik", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("memadatkan spasi dan tanda hubung berlebih", () => {
    expect(slugify("a   -  b")).toBe("a-b");
  });
});

describe("formatCompactId", () => {
  it("memformat angka gaya Indonesia", () => {
    expect(formatCompactId(1200)).toMatch(/1,2|1\.2/); // locale-dependent, keduanya sah
    expect(formatCompactId(5)).toBe("5");
  });
});

describe("truncate", () => {
  it("tidak memotong teks pendek", () => {
    expect(truncate("halo", 10)).toBe("halo");
  });

  it("memotong dengan elipsis", () => {
    const out = truncate("abcdefghij", 5);
    expect(out.length).toBeLessThanOrEqual(6);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("markdownToBlocks", () => {
  it("mengubah heading, paragraf, list, quote, dan kode", () => {
    const blocks = markdownToBlocks(
      "Paragraf pembuka.\n\n## Bagian\n\n- satu\n- dua\n\n> kutipan\n\n```js\nconst x = 1;\n```",
    );

    expect(blocks).toEqual([
      { type: "paragraph", text: "Paragraf pembuka." },
      { type: "heading", text: "Bagian", level: 2 },
      { type: "list", ordered: false, items: ["satu", "dua"] },
      { type: "quote", text: "kutipan" },
      { type: "code", text: "const x = 1;", language: "js" },
    ]);
  });

  it("list berurutan menjadi ordered", () => {
    const blocks = markdownToBlocks("1. pertama\n2. kedua");
    expect(blocks).toEqual([{ type: "list", ordered: true, items: ["pertama", "kedua"] }]);
  });

  it("baris tunggal tanpa format menjadi satu paragraf", () => {
    expect(markdownToBlocks("halo dunia")).toEqual([
      { type: "paragraph", text: "halo dunia" },
    ]);
  });
});

describe("blocksToMarkdown (round-trip)", () => {
  it("mengembalikan markdown setara dari blok", () => {
    const md = "## Judul\n\nIsi paragraf.\n\n- a\n- b";
    const roundTrip = blocksToMarkdown(markdownToBlocks(md));
    expect(roundTrip).toContain("## Judul");
    expect(roundTrip).toContain("Isi paragraf.");
    expect(roundTrip).toContain("- a");
  });
});
