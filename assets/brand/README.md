# Dragon mascot favicon

`dragon-head.png` is the transparent master adapted from the supplied dragon mascot using the built-in image generation tool. The face and horns fill the icon so the green eyes and red silhouette remain visible in browser tabs.

The website uses these exports in `public/`:

- `favicon.ico`: 16, 32, 48, 64, and 256 pixel frames.
- `favicon.png`: 64 pixel transparent PNG.
- `apple-touch-icon.png`: 180 pixel PNG.

The HTML uses relative URLs so the icons also work when the site is hosted under a subdirectory.

## Generation prompt

Use case: identity-preserve. Asset type: Agent Library website favicon and mascot brand mark. Input image 1 is the edit target: the user's red baby dragon reading a book. Adapt this exact character into a tightly composed square favicon: HEAD ONLY, including both dark charcoal horns, bright green eyes, red cheek spikes and cheeky knowing half-smile with the little fang. Preserve the recognizable character identity, red color, eye shape and friendly mischievous personality. Simplify tiny scales and fine textures into clean bold glossy 3D cartoon shapes that are legible at 16–32px. Shorten the tall horns only enough to make the head fill a square naturally. Large clear green eyes, bold silhouette, centered face filling about 90% of the canvas with a small transparent margin. Genuine transparent background. No body, hands, wings, book, badge, lettering, shadow outside the head, or watermark. Single finished icon, not a sheet of variants.

## Moving layers

The dragon at the top of the rail looks around, blinks and sneezes sparks (`src/components/Dragon.tsx`). It is built from layers cut out of the master: the whites of the eyes, both irises, a lid for each eye, and the head with the eyes cut out. To rebuild them after changing the master, run the script with Pillow and NumPy installed:

```sh
python3 assets/brand/split-dragon.py assets/brand/dragon-head.png public/dragon 128
```

The iris circles are measured by hand at the top of the script. The lid boxes it prints go into `LIDS` in `Dragon.tsx`.
