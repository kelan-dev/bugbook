import { useState } from "react";
import { useToast } from "../ui/use-toast";
import { useUploadThing } from "@/lib/uploadthing";

// ################################################################################################

export interface Attachment {
  file: File;
  mediaId?: string;
  isUploading: boolean;
}

export default function useMediaUpload() {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>();

  // Hook to upload the files to the server
  const { startUpload, isUploading } = useUploadThing("attachment", {
    onBeforeUploadBegin(files) {
      // Map over the files and give each a unique name that we can reference later
      const renamedFiles = files.map((file) => {
        const extension = file.name.split(".").slice(-1)[0] || "";
        return new File(
          [file],
          `attachment_${crypto.randomUUID()}${extension ? `.${extension}` : ""}`,
          {
            type: file.type,
          },
        );
      });

      // Add the renamed files to the attachments state
      setAttachments((prev) => [
        ...prev,
        ...renamedFiles.map((file) => ({
          file,
          isUploading: true,
        })),
      ]);

      // Return the renamed files to the uploader
      return renamedFiles;
    },
    onUploadProgress: setUploadProgress,
    onClientUploadComplete(res) {
      // Update the attachments with the media IDs from the server
      setAttachments((prev) =>
        prev.map((a) => {
          const uploadResult = res?.find((r) => r.name === a.file.name);
          if (!uploadResult) return a;
          return {
            ...a,
            mediaId: uploadResult.serverData.mediaId,
            isUploading: false,
          };
        }),
      );
    },
    onUploadError(error) {
      // Remove the attachments that were being uploaded
      setAttachments((prev) => prev.filter((a) => !a.isUploading));
      toast({
        variant: "destructive",
        description: error.message,
      });
    },
  });

  function handleStartUpload(files: File[]) {
    // We only want to allow one upload operation at a time
    if (isUploading) {
      toast({
        variant: "destructive",
        description: "Please wait for the current upload to finish.",
      });
      return;
    }

    // We only want to allow up to 5 files per post
    if (attachments.length + files.length > 5) {
      toast({
        variant: "destructive",
        description: "You can only upload up to 5 files per post.",
      });
      return;
    }

    startUpload(files);
  }

  function removeAttachment(fileName: string) {
    setAttachments((prev) => prev.filter((a) => a.file.name !== fileName));
  }

  function reset() {
    setAttachments([]);
    setUploadProgress(undefined);
  }

  return {
    startUpload: handleStartUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset,
  };
}
