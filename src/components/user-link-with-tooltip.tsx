"use client";

import ky from "@/lib/ky";
import { UserData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { HTTPError } from "ky";
import Link from "next/link";
import { PropsWithChildren } from "react";
import UserTooltip from "./user-tooltip";

// ################################################################################################

interface UserLinkWithTooltipProps extends PropsWithChildren {
  username: string;
}

export default function UserLinkWithTooltip({
  children,
  username,
}: UserLinkWithTooltipProps) {
  // Query to get the user data from the database based on the username
  const query = useQuery({
    queryKey: ["user-data", username],
    queryFn: () => ky.get(`/api/users/username/${username}`).json<UserData>(),
    retry: (failureCount, error) => {
      // If the user is not found, we don't need to retry
      if (error instanceof HTTPError && error.response.status === 404) {
        return false;
      }
      // For any other error, retry up to 3 times
      return failureCount < 3;
    },
    staleTime: Infinity,
  });

  // If the user data is not found, return a basic link to the user's profile page
  if (!query.data) {
    return (
      <Link
        href={`/users/${username}`}
        className="text-primary hover:underline"
      >
        {children}
      </Link>
    );
  }

  // Otherwise, return a link to the user's profile page wrapped in a tooltip
  return (
    <UserTooltip user={query.data}>
      <Link
        href={`/users/${username}`}
        className="text-primary hover:underline"
      >
        {children}
      </Link>
    </UserTooltip>
  );
}
