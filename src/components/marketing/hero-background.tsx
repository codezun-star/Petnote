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
        against any photo, and deliberately weak everywhere else — the animals
        are the point of the image and they usually sit low and to the right.

        The direction is responsive. Up to `lg` the copy spans most of the
        width, so a side gradient would dim the whole photo; there it runs
        top-to-bottom, heavy behind the text at the top and clearing by the
        bottom. From `lg` the copy only occupies the left column, so the
        gradient runs left-to-right and the right side stays almost clean.
      */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/88 via-primary/60 to-primary/25 lg:bg-gradient-to-r lg:from-primary/88 lg:via-primary/55 lg:to-primary/15" />

      {/*
        No fade at the bottom edge. Any blend into the page background lands on
        the animals standing at the bottom of the photo and bleaches them, so
        the section ends on a clean edge instead.
      */}
    </div>
  );
}
