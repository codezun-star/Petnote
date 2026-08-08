import { z } from "zod";

/** Mirrors the `owner_profiles_username_format` constraint in the database. */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Usernames must be at least 3 characters long.")
  .max(30, "Usernames can be at most 30 characters long.")
  .regex(
    /^[a-zA-Z][a-zA-Z0-9._-]{2,29}$/,
    "Usernames must start with a letter and use only letters, numbers, dots, hyphens or underscores.",
  );

/**
 * Whether two handles are the same account.
 *
 * The database's unique index is on `lower(username)`, so "Alex" and "alex"
 * are one handle, not two. Anything comparing usernames has to agree with that
 * index or it will either allow a duplicate or block a harmless re-cap.
 */
export function sameUsername(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
}
