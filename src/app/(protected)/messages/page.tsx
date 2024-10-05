import { Metadata } from "next";
import Chat from "./chat";

// ################################################################################################

export const metadata: Metadata = {
  title: "Messages",
};

export default function Page() {
  return <Chat />;
}
