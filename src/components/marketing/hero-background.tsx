"use client";

import * as motionReact from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";

const { motion, useReducedMotion, useScroll, useTransform } = motionReact;

/**
 * Full-bleed hero background photo.
 *
 * Layer order, bottom to top:
 *   1. solid brand navy — the fallback if the photo is missing or still
 *      loading, so the hero is never a blank white box
 *   2. the photo itself, drifting slightly slower than the page on scroll
 *   3. a navy scrim, heavier on the left where the copy sits and lighter on
 *      the right so the animals stay clearly visible
 *   4. a short fade into the page background so the section blends into the
 *      features block below
 *
 * Drop the image at `public/hero-pets.jpg` — see README for the recommended
 * size. If the file isn't there yet the hero simply renders as solid navy.
 */
const HERO_IMAGE = "/hero-pets.jpg";

export function HeroBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion() ?? false;
  const [failed, setFailed] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Structure stays identical under reduced motion; only the range collapses,
  // so server and client markup never diverge.
  const y = useTransform(scrollYProgress, [0, 1], ["0%", shouldReduce ? "0%" : "12%"]);

  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden bg-primary">
      {!failed ? (
        <motion.div style={{ y }} className="absolute inset-0 h-[112%]">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            onError={() => setFailed(true)}
          />
        </motion.div>
      ) : null}

      {/*
        Scrim. Strong enough behind the copy for white text to clear WCAG AA
        against any photo, light enough elsewhere that the image reads as the
        hero rather than as texture.

        The direction is responsive: on a narrow screen the copy spans the full
        width, so a left-to-right gradient would dim the whole photo — there it
        runs top-to-bottom instead, sitting behind the text block and letting
        the lower part of the image come through.
      */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/70 to-primary/60 sm:bg-gradient-to-r sm:from-primary/90 sm:via-primary/70 sm:to-primary/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-primary/20" />

      {/* Long, soft blend into the page background beneath the hero. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-background/60 to-background" />
    </div>
  );
}
