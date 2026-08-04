# Static assets

## `hero-pets.jpg` — landing page hero background

Drop the hero photo here, named exactly:

```
public/hero-pets.jpg
```

That's the only step — the landing page picks it up automatically, no code
change and no import needed.

### What the image should be

| | |
| --- | --- |
| **Filename** | `hero-pets.jpg` (exact) |
| **Dimensions** | 2400 × 1350 px (16:9). Minimum 1920 × 1080. |
| **Format** | JPEG or WebP. If you use WebP, save it as `hero-pets.jpg` anyway — browsers read the actual file contents, not the extension. |
| **File size** | Under ~400 KB. Next.js re-encodes and serves modern formats, but the source still has to be downloaded at build. |

### Composition notes

The hero copy sits on the **left half** of the image, over a navy scrim that is
heaviest on the left and lightest on the right.

So when you generate it:

- Keep the **left third relatively calm** — sky, blurred background, open floor.
  Busy detail there fights with the headline.
- Put the **animals on the centre-right**, where the scrim is lightest and they
  read most clearly.
- **Landscape orientation**, wide shot. The image is cropped to `object-cover`
  and centred, so tall compositions lose their top and bottom.
- Warm, natural light suits the brand better than a clinical studio look — the
  tone is "organized peace of mind", not "veterinary trade show".

A prompt along these lines works well:

> A warm, natural-light photo of several happy pets together — a dog, a cat and
> a rabbit — on soft neutral ground with a softly blurred background. Wide
> landscape composition, animals grouped toward the right side, calm open space
> on the left. Shallow depth of field, gentle daylight, photographic, not
> illustrated.

### If the file isn't there

The hero degrades to solid brand navy with the same copy and buttons — nothing
breaks, it just looks plainer. Add the file whenever you're ready.

### Adjusting how visible the photo is

The scrim opacity lives in `src/components/marketing/hero-background.tsx`:

```tsx
<div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/45" />
```

Lower numbers show more of the photo, higher numbers show less. Keep the
left-hand value at `/80` or above so the white headline stays readable.
