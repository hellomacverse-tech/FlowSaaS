import Link from "next/link";
import { Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-h2 text-ink">This workflow node isn&apos;t connected to anything.</h1>
        <p className="mt-4 text-ink-2">
          The page you&apos;re looking for doesn&apos;t exist, or the link may be out of date.
        </p>

        <form action="/workflows" className="mx-auto mt-8 flex max-w-md items-center gap-2">
          <label htmlFor="not-found-search" className="sr-only">
            Search workflows
          </label>
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="not-found-search"
              name="q"
              type="search"
              placeholder="Search workflows, apps, or outcomes…"
              className="h-11 w-full rounded-xl border border-line/70 pl-10 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="mt-10">
          <Link href="/workflows" className="text-sm font-medium text-violet-600 hover:underline">
            Browse the full workflow catalog →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
