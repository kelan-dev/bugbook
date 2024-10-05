import { useAuth } from "@/app/(protected)/auth-provider";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import ky from "@/lib/ky";

// ################################################################################################

export default function useInitializeChatClient() {
  const auth = useAuth();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    // Create the chat client
    const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY!);

    // Connect the user with their current profile data.
    // The token is used to authenticate the user in the StreamChat client.
    client
      .connectUser(
        {
          id: auth.user.id,
          username: auth.user.username,
          name: auth.user.displayName,
          image: auth.user.avatarUrl,
        },
        async () =>
          ky
            .get("/api/get-token")
            .json<{ token: string }>()
            .then((data) => data.token),
      )
      .catch((error) => {
        console.error("Failed to connect to chat", error);
      })
      .then(() => setChatClient(client));

    // Disconnect the user when the component unmounts
    return () => {
      setChatClient(null);
      client
        .disconnectUser()
        .catch((error) => console.error("Failed to disconnect user", error))
        .then(() => console.log("Connection closed"));
    };
  }, [
    auth.user.id,
    auth.user.username,
    auth.user.displayName,
    auth.user.avatarUrl,
  ]);

  return chatClient;
}
