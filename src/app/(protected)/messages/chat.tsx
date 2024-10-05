"use client";

import { Spinner } from "@/components/ui-custom/spinner";
import useInitializeChatClient from "./use-initialize-chat-client";
import { Chat as StreamChat } from "stream-chat-react";
import ChatSidebar from "./chat-sidebar";
import ChatChannel from "./chat-channel";
import { useTheme } from "next-themes";
import { useState } from "react";

// ################################################################################################

/**
 * The app uses StreamChat for real-time messaging.
 * Important to note that StreamChat maintains its own database of users, channels, messages, etc.
 * The user's profile data is passed to StreamChat every time the chat client is initialized.
 *
 * We can also manually update a user's profile data in StreamChat whenever relevant changes occur,
 * which is typically at account creation and any time the user makes changes on their profile page.
 */
export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  // Initialize the chat client
  const chatClient = useInitializeChatClient();
  if (!chatClient) return <Spinner className="mx-auto my-3" />;

  return (
    <main className="relative w-full overflow-hidden rounded-2xl bg-card shadow-sm">
      <div className="absolute bottom-0 top-0 flex w-full">
        <StreamChat
          client={chatClient}
          theme={
            resolvedTheme === "dark"
              ? "str-chat__theme-dark"
              : "str-chat__theme-light"
          }
        >
          <ChatSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <ChatChannel
            isOpen={!sidebarOpen}
            onOpen={() => setSidebarOpen(true)}
          />
        </StreamChat>
      </div>
    </main>
  );
}
