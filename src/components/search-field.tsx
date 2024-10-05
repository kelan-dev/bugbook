"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";

// ################################################################################################

export default function SearchField() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Prevent the form submission from refreshing the page
    e.preventDefault();

    // Check that the user has entered a query
    const formData = new FormData(e.currentTarget);
    const query = formData.get("query")?.toString().trim();
    if (!query) return;

    // Redirect to the search page with the query
    router.push(`/search?query=${encodeURIComponent(query)}`);
  }

  return (
    // Use a server action as a fallback by defining `method` and `action`
    <div className="relative">
      <form onSubmit={handleSubmit} method="GET" action="/search">
        <Input name="query" placeholder="Search..." className="pe-10" />
        <MagnifyingGlassIcon className="absolute right-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
      </form>
    </div>
  );
}
