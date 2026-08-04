import Link from "next/link";
import { SearchX } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function EmergencyNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <SearchX className="size-6" />
      </span>
      <h1 className="text-xl font-bold text-foreground">This emergency page isn&apos;t available</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The link may be mistyped, or the owner may have turned it off. If you&apos;ve found a pet
        wearing this tag, please contact a local vet or shelter — they can scan for a microchip.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/">Go to Petnote</Link>
      </Button>
      <div className="mt-10">
        <Logo />
      </div>
    </div>
  );
}
