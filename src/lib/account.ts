/**
 * The word someone has to type out to delete their account.
 *
 * Shared so the label on the form and the check in the Server Action can't
 * drift apart — a mismatch would either block every deletion or, worse, accept
 * a confirmation the person never actually read.
 */
export const ACCOUNT_DELETION_PHRASE = "DELETE";
