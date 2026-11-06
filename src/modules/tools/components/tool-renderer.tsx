"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { ToolPanel } from "@/modules/tools/components/tool-shell";

function ToolLoading() {
  return (
    <ToolPanel>
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </ToolPanel>
  );
}

/**
 * Peta slug → komponen tool. Setiap tool di-code-split otomatis
 * sehingga hanya dimuat saat halaman tool terkait dikunjungi.
 */
const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "word-counter": dynamic(() => import("@/modules/tools/components/tools/word-counter"), {
    loading: ToolLoading,
  }),
  "case-converter": dynamic(() => import("@/modules/tools/components/tools/case-converter"), {
    loading: ToolLoading,
  }),
  "lorem-ipsum": dynamic(() => import("@/modules/tools/components/tools/lorem-ipsum"), {
    loading: ToolLoading,
  }),
  "json-formatter": dynamic(() => import("@/modules/tools/components/tools/json-formatter"), {
    loading: ToolLoading,
  }),
  "json-validator": dynamic(() => import("@/modules/tools/components/tools/json-validator"), {
    loading: ToolLoading,
  }),
  "uuid-generator": dynamic(() => import("@/modules/tools/components/tools/uuid-generator"), {
    loading: ToolLoading,
  }),
  "base64-encoder": dynamic(() => import("@/modules/tools/components/tools/base64-encoder"), {
    loading: ToolLoading,
  }),
  "url-encoder": dynamic(() => import("@/modules/tools/components/tools/url-encoder"), {
    loading: ToolLoading,
  }),
  "qr-code-generator": dynamic(
    () => import("@/modules/tools/components/tools/qr-code-generator"),
    { loading: ToolLoading },
  ),
  "password-generator": dynamic(
    () => import("@/modules/tools/components/tools/password-generator"),
    { loading: ToolLoading },
  ),
  "percentage-calculator": dynamic(
    () => import("@/modules/tools/components/tools/percentage-calculator"),
    { loading: ToolLoading },
  ),
  "age-calculator": dynamic(() => import("@/modules/tools/components/tools/age-calculator"), {
    loading: ToolLoading,
  }),
  "date-calculator": dynamic(() => import("@/modules/tools/components/tools/date-calculator"), {
    loading: ToolLoading,
  }),
  "unit-converter": dynamic(() => import("@/modules/tools/components/tools/unit-converter"), {
    loading: ToolLoading,
  }),
  "pomodoro-timer": dynamic(() => import("@/modules/tools/components/tools/pomodoro-timer"), {
    loading: ToolLoading,
  }),
  checklist: dynamic(() => import("@/modules/tools/components/tools/checklist"), {
    loading: ToolLoading,
  }),
  "color-picker": dynamic(() => import("@/modules/tools/components/tools/color-picker"), {
    loading: ToolLoading,
  }),
  "gradient-generator": dynamic(
    () => import("@/modules/tools/components/tools/gradient-generator"),
    { loading: ToolLoading },
  ),
  "image-compressor": dynamic(
    () => import("@/modules/tools/components/tools/image-compressor"),
    { loading: ToolLoading },
  ),
  "pdf-merge": dynamic(() => import("@/modules/tools/components/tools/pdf-merge"), {
    loading: ToolLoading,
  }),
  "pdf-split": dynamic(() => import("@/modules/tools/components/tools/pdf-split"), {
    loading: ToolLoading,
  }),
};

export function ToolRenderer({ slug }: { slug: string }) {
  const Component = TOOL_COMPONENTS[slug];

  if (!Component) {
    return (
      <ToolPanel>
        <p className="py-8 text-center text-sm text-ink-secondary">
          Antarmuka tool ini sedang dalam pengembangan.
        </p>
      </ToolPanel>
    );
  }

  return <Component />;
}
