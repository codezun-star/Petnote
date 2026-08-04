import { NextResponse, type NextRequest } from "next/server";

import { getDocumentUrl } from "@/lib/actions/documents";

/**
 * Redirects to a 60-second signed URL for a private document.
 *
 * `getDocumentUrl` resolves the row through RLS first, so a document belonging
 * to somebody else never produces a URL.
 */
export async function GET(_request: NextRequest, context: RouteContext<"/api/documents/[documentId]">) {
  const { documentId } = await context.params;
  const signedUrl = await getDocumentUrl(documentId);

  if (!signedUrl) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.redirect(signedUrl, {
    headers: { "Cache-Control": "no-store" },
  });
}
