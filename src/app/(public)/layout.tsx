import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { HeaderSkeleton } from "@/components/layout/header-skeleton";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Header membaca sesi (cookies) — di-stream agar sisa halaman tetap statis. */}
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      <main id="main-content" tabIndex={-1} className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      {/* MobileNav membaca usePathname (runtime) — aman setelah shell statis. */}
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </>
  );
}
