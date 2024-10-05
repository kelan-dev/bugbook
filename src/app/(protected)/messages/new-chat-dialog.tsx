"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChatContext } from "stream-chat-react";
import { useAuth } from "@/app/(protected)/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import useDebounce from "@/hooks/use-debounce";
import { UserResponse } from "stream-chat";
import { DefaultStreamChatGenerics } from "stream-chat-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckIcon,
  Cross2Icon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/user-avatar";
import { Spinner } from "@/components/ui-custom/spinner";
import { LoadingButton } from "@/components/ui-custom/loading-button";

// ################################################################################################

interface NewChatDialogProps {
  onOpenChange: (isOpen: boolean) => void;
  onChatCreated: () => void;
}

export default function NewChatDialog({
  onOpenChange,
  onChatCreated,
}: NewChatDialogProps) {
  const auth = useAuth();
  const { toast } = useToast();

  const { client, setActiveChannel } = useChatContext();

  const [searchInput, setSearchInput] = useState("");
  const searchInputDebounced = useDebounce(searchInput, 500);

  const [selectedUsers, setSelectedUsers] = useState<
    UserResponse<DefaultStreamChatGenerics>[]
  >([]);

  // Query to search for users
  const query = useQuery({
    queryKey: ["stream-users", searchInputDebounced],
    queryFn: async () =>
      client.queryUsers(
        {
          id: { $ne: auth.user.id },
          role: { $ne: "admin" },
          ...(searchInputDebounced
            ? {
                $or: [
                  { name: { $autocomplete: searchInputDebounced } },
                  { username: { $autocomplete: searchInputDebounced } },
                ],
              }
            : {}),
        },
        {
          name: 1,
          username: 1,
        },
        {
          limit: 15,
        },
      ),
  });

  // Mutation to create a new chat
  const mutation = useMutation({
    mutationFn: async () => {
      const channel = client.channel("messaging", {
        members: [auth.user.id, ...selectedUsers.map((user) => user.id)],
        name:
          selectedUsers.length > 1
            ? auth.user.displayName +
              ", " +
              selectedUsers.map((user) => user.name).join(", ")
            : undefined,
      });
      await channel.create();
      return channel;
    },
    onSuccess: (channel) => {
      setActiveChannel(channel);
      onChatCreated();
    },
    onError: (error) => {
      console.error("Error creating chat", error);
      toast({
        description: "An error occurred while creating the chat",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="bg-card p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        <div>
          <div className="group relative">
            <MagnifyingGlassIcon className="absolute left-5 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground group-focus-within:text-primary" />
            <Input
              placeholder="Search users..."
              className="h-12 w-full pe-4 ps-14 focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <hr />
          {selectedUsers.length > 0 && (
            <div className="my-4 flex flex-wrap gap-2 p-2">
              {selectedUsers.map((user) => (
                <SelectedUserTag
                  key={user.id}
                  user={user}
                  onRemove={() => {
                    // Remove the user from the selected users array
                    setSelectedUsers((prev) =>
                      prev.filter((u) => u.id !== user.id),
                    );
                  }}
                />
              ))}
            </div>
          )}
          <div className="h-96 overflow-y-auto">
            {query.isSuccess &&
              query.data?.users.map((user) => (
                <UserSearchResult
                  key={user.id}
                  user={user}
                  isSelected={selectedUsers.some((u) => u.id === user.id)}
                  onClick={() => {
                    // Add or remove the user from the selected users array
                    setSelectedUsers((prev) =>
                      prev.some((u) => u.id === user.id)
                        ? prev.filter((u) => u.id !== user.id)
                        : [...prev, user],
                    );
                  }}
                />
              ))}
            {query.isSuccess && query.data?.users.length === 0 && (
              <p className="my-3 text-center text-muted-foreground">
                No users found
              </p>
            )}
            {query.isFetching && <Spinner className="mx-auto my-3" />}
            {query.isError && (
              <p className="my-3 text-center text-destructive">
                An error occurred while loading users
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="px-6 pb-6">
          <LoadingButton
            disabled={!selectedUsers.length}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Start Chat
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ################################################################################################

interface UserSearchResultProps {
  user: UserResponse<DefaultStreamChatGenerics>;
  isSelected: boolean;
  onClick: () => void;
}

function UserSearchResult({
  user,
  isSelected,
  onClick,
}: UserSearchResultProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-2">
        <UserAvatar avatarUrl={user.image} />
        <div className="flex flex-col text-start">
          <p className="font-bold">{user.name}</p>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      {isSelected && <CheckIcon className="size-5 text-green-500" />}
    </button>
  );
}

// ################################################################################################

interface SelectedUserTagProps {
  user: UserResponse<DefaultStreamChatGenerics>;
  onRemove: () => void;
}

function SelectedUserTag({ user, onRemove }: SelectedUserTagProps) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-2 rounded-full border p-1 hover:bg-muted/50"
    >
      <UserAvatar avatarUrl={user.image} size={24} />
      <p className="font-bold">{user.name}</p>
      <Cross2Icon className="mx-2 size-5 text-muted-foreground" />
    </button>
  );
}
