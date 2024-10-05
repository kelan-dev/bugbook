import { StreamChat } from "stream-chat";

// ################################################################################################

// Interacts with StreamChat services securely from our server (components, actions, endpoints).
const streamServerClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY!,
  process.env.STREAM_SECRET!,
);

export default streamServerClient;
