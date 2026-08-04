"use client";

import { Check, Copy, Download, Printer } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const QR_SIZE = 320;

/**
 * Client-side QR generation for a pet's Emergency Mode URL.
 *
 * Drawn straight to a canvas so the download is a real PNG the user can print
 * on a tag — no server round trip and no third-party QR service seeing the URL.
 */
export function QrCard({ url, petName }: { url: string; petName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, url, {
      width: QR_SIZE,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        // Brand primary on white keeps contrast well above what scanners need.
        dark: "#17375CFF",
        light: "#FFFFFFFF",
      },
    }).catch(() => setError("Couldn't render the QR code. Try reloading the page."));
  }, [url]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `petnote-${petName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-emergency-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the link. Select and copy it manually.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="rounded-xl border border-border bg-white p-4">
        <canvas ref={canvasRef} className="block h-auto w-full max-w-[280px]" />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="w-full space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Public link
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground"
            aria-label={`Public emergency link for ${petName}`}
          />
          <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copy link">
            {copied ? <Check className="text-fresh-foreground" /> : <Copy />}
          </Button>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row print:hidden">
        <Button type="button" onClick={handleDownload} className="flex-1">
          <Download />
          Download PNG
        </Button>
        <Button type="button" variant="outline" onClick={() => window.print()} className="flex-1">
          <Printer />
          Print
        </Button>
      </div>
    </div>
  );
}
