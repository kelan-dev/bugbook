import ky from "@/lib/ky";
import { FollowerData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

// ################################################################################################

export default function useFollowerData(
  userId: string,
  initialData: FollowerData,
) {
  const endpoint = `/api/users/${userId}/followers`;

  // Query to get the follower data for the user
  const query = useQuery({
    queryKey: ["follower-data", userId],
    queryFn: () => ky.get(endpoint).json<FollowerData>(),
    staleTime: Infinity,
    initialData,
  });

  return query;
}
