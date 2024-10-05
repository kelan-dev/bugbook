"use client";

import "./styles.css";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import UserAvatar from "@/components/user-avatar";
import { EditorContent, useEditor } from "@tiptap/react";
import { useAuth } from "@/app/(protected)/auth-provider";
import { Button } from "@/components/ui/button";
import { useSubmitPostMutation } from "./mutations";
import { LoadingButton } from "@/components/ui-custom/loading-button";
import useMediaUpload, { Attachment } from "./use-media-upload";
import { ClipboardEvent, useRef } from "react";
import { Cross2Icon, ImageIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Spinner } from "../ui-custom/spinner";
import { useDropzone } from "@uploadthing/react";

// ################################################################################################

export default function PostEditor() {
  const auth = useAuth();

  // Mutation to submit the post to the database
  const mutation = useSubmitPostMutation();

  // Contains the logic related to uploading media like images and videos
  const {
    attachments,
    startUpload,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset: resetMediaUploads,
  } = useMediaUpload();

  // Allows the user to drop files into the editor to upload them
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: startUpload,
  });

  // We don't want the hook's onClick functionality, so we destructure it and ignore it
  const { onClick, ...rootProps } = getRootProps();

  // Create and configure a Tiptap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
      }),
      Placeholder.configure({
        placeholder: "What's on your mind?",
      }),
    ],
    editorProps: { attributes: { class: "prose" } },
    immediatelyRender: false,
  });

  // Get the current content of the editor
  const input =
    editor?.getText({
      blockSeparator: "\n",
    }) || "";

  // Submit the post to the database and update the front end
  function onSubmit() {
    mutation.mutate(
      {
        content: input,
        mediaIds: attachments
          .map((a) => a.mediaId)
          .filter((id): id is string => id !== undefined),
      },
      {
        onSuccess: () => {
          editor?.commands.clearContent();
          resetMediaUploads();
        },
      },
    );
  }

  // Handle pasting images and videos into the editor
  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    // Get the items from the clipboard data
    const items = event.clipboardData?.items;
    if (!items) return;

    // Filter out the files from the items
    const files = Array.from(items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    // Start the upload process for the files
    if (!files.length) return;
    startUpload(files);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm",
        isDragActive && "outline-dashed outline-2",
      )}
      {...rootProps}
    >
      <input {...getInputProps()} />
      <div className="flex gap-5">
        <UserAvatar
          avatarUrl={auth.user.avatarUrl}
          className="hidden sm:inline"
        />
        <EditorContent
          editor={editor}
          onPaste={onPaste}
          className="max-h-[20rem] w-full overflow-y-auto rounded-2xl bg-background px-5 py-3"
        />
      </div>
      {attachments.length > 0 && (
        <AttachmentPreviews
          attachments={attachments}
          removeAttachment={removeAttachment}
        />
      )}
      <div className="flex items-center justify-end gap-3">
        {isUploading && (
          <>
            <span className="text-sm">{uploadProgress ?? 0}%</span>
            <Spinner />
          </>
        )}
        <AddAttachmentsButton
          disabled={isUploading || attachments.length >= 5}
          onFilesSelected={startUpload}
        />
        <LoadingButton
          onClick={onSubmit}
          loading={mutation.isPending}
          disabled={!input.trim() || isUploading}
          className="min-w-20"
        >
          Post
        </LoadingButton>
      </div>
    </div>
  );
}

// ################################################################################################

interface AddAttachmentsButtonProps {
  disabled: boolean;
  onFilesSelected: (files: File[]) => void;
}

function AddAttachmentsButton({
  disabled,
  onFilesSelected,
}: AddAttachmentsButtonProps) {
  // We need a reference to the file input to be able to trigger a click on it
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*, video/*"
        multiple
        className="sr-only hidden"
        onChange={(e) => {
          if (e.target.files) {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            onFilesSelected(files);
            e.target.value = "";
          }
        }}
      />
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="text-primary hover:text-primary"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon />
      </Button>
    </>
  );
}

// ################################################################################################

interface AttachmentPreviewsProps {
  attachments: Attachment[];
  removeAttachment: (fileName: string) => void;
}

function AttachmentPreviews({
  attachments,
  removeAttachment,
}: AttachmentPreviewsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        attachments.length > 1 && "sm:grid sm:grid-cols-2",
      )}
    >
      {attachments.map((attachment) => (
        <AttachmentPreview
          key={attachment.file.name}
          attachment={attachment}
          onRemoveClick={() => removeAttachment(attachment.file.name)}
        />
      ))}
    </div>
  );
}

// ################################################################################################

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemoveClick: () => void;
}

function AttachmentPreview({
  attachment,
  onRemoveClick,
}: AttachmentPreviewProps) {
  const src = URL.createObjectURL(attachment.file);

  return (
    <div
      className={cn(
        "relative mx-auto size-fit",
        attachment.isUploading && "opacity-50",
      )}
    >
      {attachment.file.type.startsWith("image") ? (
        <Image
          src={src}
          alt="Attachment preview"
          width={500}
          height={500}
          className="size-fit max-h-[30rem] rounded-2xl"
        />
      ) : (
        <video controls className="size-fit max-h-[30rem] rounded-2xl">
          <source src={src} type={attachment.file.type} />
        </video>
      )}
      {!attachment.isUploading && (
        <button
          onClick={onRemoveClick}
          className="absolute right-3 top-3 rounded-full bg-foreground/60 p-1.5 text-background transition-colors hover:bg-foreground"
        >
          <Cross2Icon />
        </button>
      )}
    </div>
  );
}
