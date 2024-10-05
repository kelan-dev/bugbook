import TrendsSidebar from "@/components/trends-sidebar";
import { Metadata } from "next";
import SearchResultsFeed from "./search-results-feed";

// ################################################################################################

interface PageProps {
  searchParams: { query: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  return {
    title: `Search results for "${searchParams.query}"`,
  };
}

export default function Page({ searchParams }: PageProps) {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="line-clamp-2 break-all text-center text-2xl font-bold">
            Search results for &quot;{searchParams.query}&quot;
          </h1>
        </div>
        <SearchResultsFeed searchQuery={searchParams.query} />
      </div>
      <TrendsSidebar />
    </main>
  );
}
