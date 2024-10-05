"use client";

import { PostData } from "@/lib/types";
import { useState } from "react";
import { useSubmitCommentMutation } from "./mutations";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Spinner } from "../ui-custom/spinner";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

// ################################################################################################

interface CommentInputProps {
  post: PostData;
}

export default function CommentInput({ post }: CommentInputProps) {
  const [input, setInput] = useState("");

  // Mutation to submit a comment
  const mutation = useSubmitCommentMutation(post.id);

  async function onSubmit(e: React.FormEvent) {
    // Prevent page refresh
    e.preventDefault();

    if (!input.trim()) return;

    mutation.mutate(
      { post, content: input },
      { onSuccess: () => setInput("") },
    );
  }

  return (
    <form className="flex w-full items-center gap-2" onSubmit={onSubmit}>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add a comment"
        autoFocus
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={!input.trim() || mutation.isPending}
      >
        {mutation.isPending ? <Spinner /> : <PaperPlaneIcon />}
      </Button>
    </form>
  );
}
