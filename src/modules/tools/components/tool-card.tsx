import {
  Binary,
  Blend,
  Braces,
  Cake,
  CalendarDays,
  CaseSensitive,
  Files,
  FileText,
  Fingerprint,
  ImageDown,
  KeyRound,
  Link2,
  ListChecks,
  Palette,
  Percent,
  QrCode,
  Ruler,
  Scissors,
  ShieldCheck,
  TextQuote,
  Timer,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ToolDefinition } from "@/modules/tools/tools-registry/registry";

/**
 * Map statis ikon registry → komponen. Import eksplisit (bukan `import *`)
 * supaya tree-shaking lucide-react bekerja: hanya 21 ikon ini yang masuk
 * bundle client, bukan seluruh library (ribuan ikon).
 */
const TOOL_ICONS: Record<string, LucideIcon> = {
  FileText,
  CaseSensitive,
  TextQuote,
  Braces,
  ShieldCheck,
  Fingerprint,
  Binary,
  Link2,
  QrCode,
  KeyRound,
  Percent,
  Cake,
  CalendarDays,
  Ruler,
  Timer,
  ListChecks,
  Palette,
  Blend,
  ImageDown,
  Files,
  Scissors,
};

function ToolIcon({ name, className }: { name: string; className?: string }) {
  const Icon = TOOL_ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden />;
}

export function ToolCard({ tool, className }: { tool: ToolDefinition; className?: string }) {
  return (
    <Link
      href={tool.route}
      className={cn(
        "group flex flex-col gap-3 rounded-card border border-slate-200/80 bg-surface p-5 shadow-card transition-all duration-300 ease-out-expo",
        "hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover focus-visible:-translate-y-1",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-all duration-300 ease-out-expo group-hover:scale-110 group-hover:bg-brand-800 group-hover:text-white group-hover:shadow-md group-hover:shadow-brand-800/25">
        <ToolIcon name={tool.icon} className="size-5.5" />
      </span>
      <div className="space-y-1">
        <h3 className="font-bold text-ink transition-colors group-hover:text-brand-800">
          {tool.name}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-secondary">
          {tool.description}
        </p>
      </div>
    </Link>
  );
}
