"use client";

import { useEffect } from "react";

/**
 * Scroll-driven reveals for the landing page.
 *
 * GSAP + ScrollTrigger is imported dynamically inside the effect, so it is
 * code-split into a chunk that only the marketing route ever loads — the
 * authenticated app never pays for it.
 *
 * Elements opt in with `data-reveal`; nothing else on the page is touched.
 */
export function ScrollReveal() {
  useEffect(() => {
    // Respect the OS setting before doing any work at all — no import, no
    // timeline, and the content stays visible because it is never hidden.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /*
     * Only claim elements that are still below the fold.
     *
     * Content is server-rendered visible — it is never hidden by CSS — so if
     * this component never runs (JS disabled, GSAP fails to load, reduced
     * motion), the page simply reads as a normal static page. The trade-off is
     * that we must not retroactively hide something the user can already see,
     * which would flash. Anything in view at load stays as it is.
     */
    const viewportBottom = window.innerHeight;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
      (element) => element.getBoundingClientRect().top > viewportBottom * 0.9,
    );
    if (targets.length === 0) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const context = gsap.context(() => {
        // Group by section so cards within one section stagger together
        // rather than each firing its own independent trigger.
        const groups = new Map<Element, HTMLElement[]>();
        for (const target of targets) {
          const section = target.closest("section") ?? document.body;
          const group = groups.get(section);
          if (group) group.push(target);
          else groups.set(section, [target]);
        }

        for (const group of groups.values()) {
          gsap.fromTo(
            group,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              // 450ms — longer than a UI transition, because these are
              // one-time narrative moments rather than repeated interactions.
              duration: 0.45,
              ease: "power2.out",
              stagger: 0.08,
              scrollTrigger: {
                trigger: group[0],
                start: "top 85%",
                once: true,
              },
            },
          );
        }
      });

      cleanup = () => {
        context.revert();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
