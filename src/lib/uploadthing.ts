import { AppFileRouter } from "@/app/api/uploadthing/core";
import { generateReactHelpers } from "@uploadthing/react";

// Export Uploadthing helpers, built-in hooks and components
export const { uploadFiles, useUploadThing } =
  generateReactHelpers<AppFileRouter>();
