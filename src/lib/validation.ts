import { z } from "zod";

// ################################################################################################

export const requiredString = z.string().trim().min(1, "Required");

export const signUpSchema = z.object({
  email: requiredString.email("Invalid email address"),
  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Only letters, numbers, dashes, and underscores are allowed",
  ),
  password: requiredString.min(8, "Must be at least 8 characters"),
});

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export const createPostSchema = z.object({
  content: requiredString,
  mediaIds: z
    .array(z.string())
    .max(5, "Maximum of 5 media attachments allowed")
    .optional(),
});

export const deletePostSchema = z.string().cuid();

export const updateUserProfileSchema = z.object({
  displayName: requiredString,
  bio: z.string().max(1000, "Must be less than 1000 characters.").optional(),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type CreatePostValues = z.infer<typeof createPostSchema>;
export type DeletePostValues = z.infer<typeof deletePostSchema>;
export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;
