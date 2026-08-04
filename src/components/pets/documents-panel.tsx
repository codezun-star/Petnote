import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";

import { ActionForm } from "@/components/forms/action-form";
import { DeleteButton } from "@/components/forms/delete-button";
import { Field, SelectField } from "@/components/forms/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { deleteDocument, uploadDocument } from "@/lib/actions/documents";
import type { PetDocument } from "@/lib/database.types";
import { DOCUMENT_TYPE_LABELS, formatFileSize, formatLongDate } from "@/lib/format";
import type { PlanLimits } from "@/lib/plans";

const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function DocumentsPanel({
  petId,
  documents,
  limits,
  documentCount,
}: {
  petId: string;
  documents: PetDocument[];
  limits: PlanLimits;
  /** Across all pets — the document allowance is per account. */
  documentCount: number;
}) {
  const atLimit = limits.maxDocuments !== null && documentCount >= limits.maxDocuments;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Lab results, x-rays, certificates and invoices. Files are private — only you can open
            them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="No documents yet"
              description="Upload the vaccination certificate or last blood panel so it's there when a vet asks."
            />
          ) : (
            <ul className="divide-y divide-border">
              {documents.map((document) => (
                <li key={document.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {document.file_name ?? "Document"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatLongDate(document.uploaded_at)} · {formatFileSize(document.file_size)}
                    </p>
                  </div>
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {DOCUMENT_TYPE_LABELS[document.document_type]}
                  </Badge>
                  <Button asChild variant="ghost" size="sm">
                    <a href={`/api/documents/${document.id}`} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </Button>
                  <DeleteButton
                    action={deleteDocument}
                    payload={{ id: document.id, pet_id: petId }}
                    title="Delete this document?"
                    description={`"${document.file_name ?? "This file"}" will be permanently deleted from storage. This can't be undone.`}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 lg:self-start">
        <CardHeader>
          <CardTitle>Upload a document</CardTitle>
          <CardDescription>
            {limits.maxDocuments === null
              ? "Unlimited storage on your Pro plan."
              : `${documentCount} of ${limits.maxDocuments} used on the Free plan.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {atLimit ? (
            <Alert variant="info">
              <Sparkles />
              <AlertDescription className="space-y-3">
                <p>
                  You&apos;ve used all {limits.maxDocuments} Free plan documents. Pro gives you
                  unlimited storage.
                </p>
                <Button asChild variant="accent" size="sm">
                  <Link href="/dashboard/billing">See Pro</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <ActionForm action={uploadDocument} submitLabel="Upload" pendingLabel="Uploading…" resetOnSuccess>
              <input type="hidden" name="pet_id" value={petId} />

              <Field label="File" htmlFor="file" hint="PDF or image, up to 10 MB." required>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
                  required
                />
              </Field>

              <Field label="Type" htmlFor="document_type">
                <SelectField name="document_type" defaultValue="other" options={DOCUMENT_TYPE_OPTIONS} />
              </Field>
            </ActionForm>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
