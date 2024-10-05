import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActivityLogIcon } from "@radix-ui/react-icons";
import {
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  ChannelHeaderProps,
} from "stream-chat-react";

// ################################################################################################

interface ChatChannelProps {
  isOpen: boolean;
  onOpen: () => void;
}

export default function ChatChannel({ isOpen, onOpen }: ChatChannelProps) {
  return (
    <div className={cn("w-full md:block", !isOpen && "hidden")}>
      <Channel>
        <Window>
          <CustomChannelHeader onOpen={onOpen} />
          <MessageList />
          <MessageInput />
        </Window>
      </Channel>
    </div>
  );
}

// ################################################################################################

interface CustomChannelHeaderProps extends ChannelHeaderProps {
  onOpen: () => void;
}

function CustomChannelHeader({ onOpen, ...props }: CustomChannelHeaderProps) {
  return (
    <div className="flex items-center">
      <div className="p-2 md:hidden">
        <Button size="icon" variant="ghost" onClick={onOpen}>
          <ActivityLogIcon className="size-5" />
        </Button>
      </div>
      <ChannelHeader {...props} />
    </div>
  );
}
