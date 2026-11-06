/** Favicon SVG: kotak indigo dengan ikon "orang berkumpul". */
export default function icon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#3730A3"/>
  <circle cx="24" cy="26" r="6" fill="#fff"/>
  <circle cx="40" cy="26" r="6" fill="#fff"/>
  <path d="M14 46c0-6 4.5-10 10-10s10 4 10 10v2H14v-2z" fill="#fff"/>
  <path d="M30 46c0-6 4.5-10 10-10s10 4 10 10v2H30v-2z" fill="#A5B4FC"/>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
