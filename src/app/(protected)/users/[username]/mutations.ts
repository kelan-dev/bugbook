import { useToast } from "@/components/ui/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { UpdateUserProfileValues } from "@/lib/validation";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { updateUserProfile } from "./actions";
import { PostFeedResult } from "@/lib/types";

// ################################################################################################

type MutationParams = {
  values: UpdateUserProfileValues;
  avatar?: File;
};

export function useUpdateUserProfileMutation() {
  const { toast } = useToast();
  const router = useRouter();
  const { startUpload, isUploading } = useUploadThing("avatar");
  const queryClient = useQueryClient();
  const queryFilter: QueryFilters = {
    queryKey: ["post-feed"],
  };

  // Mutation to update the user's profile
  const mutation = useMutation({
    mutationFn: async ({ values, avatar }: MutationParams) => {
      // We can run multiple async functions in parallel with `Promise.all`
      return Promise.all([
        // Update the user's profile in the database
        updateUserProfile(values),
        // Upload the avatar to Uploadthing
        avatar && startUpload([avatar]),
      ]);
    },
    onSuccess: async ([updatedUser, uploadResult]) => {
      // The uploadResult contains any data we returned from Uploadthing's `onUploadComplete`
      const newAvatarUrl = uploadResult?.[0].serverData.avatarUrl;

      // Cancel any running queries that match the query filter to prevent race conditions
      await queryClient.cancelQueries(queryFilter);

      // Update the post feed caches with the new user data
      queryClient.setQueriesData<InfiniteData<PostFeedResult, string | null>>(
        queryFilter,
        (data) => {
          if (!data) return;

          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              posts: page.records.map((post) =>
                post.user.id === updatedUser.id
                  ? {
                      ...post,
                      user: {
                        ...updatedUser,
                        avatarUrl: newAvatarUrl || updatedUser.avatarUrl,
                      },
                    }
                  : post,
              ),
            })),
          };
        },
      );

      // Re-renders the current route without losing any client-side state or hard refreshing the page.
      // In other words, it ensures that our server components are re-rendered with the new user data.
      router.refresh();

      toast({
        description: "Your profile has been updated",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        description: "Failed to update your profile",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Invalidate the post feed caches
      queryClient.invalidateQueries(queryFilter);
    },
  });

  return mutation;
}
