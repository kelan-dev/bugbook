"use client";

import useFollowerData from "@/hooks/use-follower-data";
import { FollowerData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import React from "react";

// ################################################################################################

interface FollowerCountProps {
  userId: string;
  initialData: FollowerData;
}

export default function FollowerCount({
  userId,
  initialData,
}: FollowerCountProps) {
  const { data } = useFollowerData(userId, initialData);
  return (
    <span>
      Followers:{" "}
      <span className="font-semibold">{formatNumber(data?.followerCount)}</span>
    </span>
  );
}
