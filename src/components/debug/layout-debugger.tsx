"use client";

import { useEffect, useState } from "react";

type Offender = {
  tag: string;
  cls: string;
  left: number;
  right: number;
  width: number;
  position: string;
};

/**
 * On-screen horizontal-overflow report.
 *
 * Only renders when the URL carries `?debug=layout`, so it costs nothing in
 * normal use. It exists because horizontal scrolling can be device-specific —
 * an iOS-only intrinsic width, a font that measures differently — and those
 * cases cannot be reproduced in a headless browser. Open the page on the
 * affected device with `?debug=layout` and this names the element.
 */
export function LayoutDebugger() {
  const [report, setReport] = useState<{
    viewport: number;
    docWidth: number;
    overflow: number;
    canScrollX: boolean;
    offenders: Offender[];
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).has("debug")) return;

    function measure() {
      const de = document.documentElement;
      const viewport = de.clientWidth;

      // Temporarily lift the overflow guard, otherwise the very rule we are
      // debugging hides the evidence.
      const prevHtml = de.style.overflowX;
      const prevBody = document.body.style.overflowX;
      de.style.overflowX = "visible";
      document.body.style.overflowX = "visible";

      const docWidth = Math.max(de.scrollWidth, document.body.scrollWidth);

      const offenders: Offender[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
        if (el.closest("[data-layout-debugger]")) continue;
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;
        if (b.right > viewport + 1 || b.left < -1) {
          // Report the innermost element only — its ancestors are just
          // stretched by it.
          const childAlsoOver = Array.from(el.children).some((c) => {
            const cb = c.getBoundingClientRect();
            return cb.right > viewport + 1 || cb.left < -1;
          });
          if (childAlsoOver) continue;

          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (typeof el.className === "string" ? el.className : "").slice(0, 90),
            left: Math.round(b.left),
            right: Math.round(b.right),
            width: Math.round(b.width),
            position: getComputedStyle(el).position,
          });
          el.style.outline = "3px solid #F39A3D";
        }
      }

      const beforeX = window.scrollX;
      window.scrollTo(99999, window.scrollY);
      const canScrollX = window.scrollX > 0;
      window.scrollTo(beforeX, window.scrollY);

      de.style.overflowX = prevHtml;
      document.body.style.overflowX = prevBody;

      setReport({
        viewport,
        docWidth,
        overflow: docWidth - viewport,
        canScrollX,
        offenders: offenders.slice(0, 12),
      });
    }

    // Wait for fonts and images, which are often what actually overflows.
    const timer = window.setTimeout(measure, 1200);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, []);

  if (!report) return null;

  return (
    <div
      data-layout-debugger
      className="fixed inset-x-0 bottom-0 z-[9999] max-h-[55vh] overflow-y-auto border-t-4 border-accent bg-[#0f2033] p-3 font-mono text-[11px] leading-snug text-white"
    >
      <p className="mb-2 font-bold text-accent">Layout debug</p>
      <p>viewport: {report.viewport}px</p>
      <p>document: {report.docWidth}px</p>
      <p className={report.overflow > 1 ? "font-bold text-accent" : ""}>
        overflow: {report.overflow}px
      </p>
      <p className={report.canScrollX ? "font-bold text-accent" : ""}>
        can scroll sideways: {String(report.canScrollX)}
      </p>

      <p className="mt-2 font-bold text-accent">
        {report.offenders.length} element(s) past the edge
      </p>
      {report.offenders.length === 0 ? (
        <p className="opacity-70">Nothing sticks out — the scroll comes from something else.</p>
      ) : (
        <ol className="mt-1 space-y-2">
          {report.offenders.map((o, i) => (
            <li key={i} className="border-l-2 border-accent pl-2">
              <span className="text-accent">
                &lt;{o.tag}&gt; {o.position}
              </span>
              <br />
              left={o.left} right={o.right} width={o.width}
              <br />
              <span className="opacity-70">{o.cls || "(no class)"}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
