"use client";

import { useAuth } from "@/app/(protected)/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ChannelList,
  ChannelPreviewMessenger,
  ChannelPreviewUIComponentProps,
  useChatContext,
} from "stream-chat-react";
import NewChatDialog from "./new-chat-dialog";
import { useQueryClient } from "@tanstack/react-query";

// ################################################################################################

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const auth = useAuth();

  const queryClient = useQueryClient();
  const { channel } = useChatContext();

  // Invalidate the unread messages count when the channel changes to get the latest count
  useEffect(() => {
    if (channel?.id) {
      queryClient.invalidateQueries({
        queryKey: ["unread-messages-count"],
      });
    }
  }, [channel?.id, queryClient]);

  // Memoized to create a stable reference and prevent component recreation on every render
  const ChannelPreviewCustom = useCallback(
    (props: ChannelPreviewUIComponentProps) => {
      return (
        <ChannelPreviewMessenger
          {...props}
          onSelect={() => {
            props.setActiveChannel?.(props.channel, props.watchers);
            onClose();
          }}
        />
      );
    },
    [onClose],
  );

  return (
    <div
      className={cn(
        "size-full flex-col border-e md:flex md:w-72",
        isOpen ? "flex" : "hidden",
      )}
    >
      <MenuHeader onClose={onClose} />
      <ChannelList
        showChannelSearch
        filters={{
          type: "messaging",
          members: { $in: [auth.user.id] },
        }}
        options={{
          state: true,
          presence: true,
          limit: 8,
        }}
        sort={{
          last_message_at: -1,
        }}
        additionalChannelSearchProps={{
          searchForChannels: true,
          searchQueryParams: {
            channelFilters: {
              filters: { members: { $in: [auth.user.id] } },
            },
          },
        }}
        Preview={ChannelPreviewCustom}
      />
    </div>
  );
}

// ################################################################################################

interface MenuHeaderProps {
  onClose: () => void;
}

function MenuHeader({ onClose }: MenuHeaderProps) {
  // We handle the open state here because the dialog fetches data
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  return (
    <>
      <div className="flex items-center gap-3 p-2">
        <div className="h-full md:hidden">
          <Button size="icon" variant="ghost" onClick={onClose}>
            <Cross2Icon className="size-5" />
          </Button>
        </div>
        <h1 className="me-auto text-xl font-bold md:ms-2">Messages</h1>
        <Button
          size="icon"
          variant="ghost"
          title="Start a new conversation"
          onClick={() => setShowNewChatDialog(true)}
        >
          <PlusIcon className="size-5" />
        </Button>
      </div>
      {showNewChatDialog && (
        <NewChatDialog
          onOpenChange={setShowNewChatDialog}
          onChatCreated={() => {
            setShowNewChatDialog(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
