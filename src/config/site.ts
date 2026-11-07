export const siteConfig = {
  name: "RuangKumpul",
  tagline: "Satu ruang untuk tools, ilmu, dan komunitas.",
  description:
    "RuangKumpul adalah satu tempat untuk menemukan tools, mendapatkan informasi, belajar, berbagi ide, membangun komunitas, dan menemukan berbagai peluang digital.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ruangkumpul.my.id",
  locale: "id_ID",
  ogImage: "/images/og-default.png",
  links: {
    github: "https://github.com/ruangkumpul",
  },
} as const;

export type SiteConfig = typeof siteConfig;
