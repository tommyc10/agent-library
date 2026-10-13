---
name: scroll-story
description: Build scroll-driven product stories in React with GSAP ScrollTrigger. Choose Fly (a 3D camera through floating UI), Midnight (a detailed screen walkthrough), Carousel (linked services on a 3D turntable), or Swarm (thousands of records as particles that rearrange into each chart), with bundled reference builds and verification scripts. Use for cinematic product demos, launch pages, scroll-animated workflows, and stories spanning several service repos; works with Claude Code and Codex. Read the product repos without changing them and build a standalone app in the user's stories repo.
---

# Scroll story

Build a page where **the scroll bar is the play button**: the screen pins, and scrolling plays
(and rewinds) a film of the product doing its job. Each chapter hands the viewer to the next
by physically carrying something across: a ticket shrinks into one square of a chart, a query
flies into the rule page, the page folds down into a gate.

The four primary reference builds are **Fly** (`assets/fly/`, default direction),
**Midnight** (`assets/midnight/`), **Carousel** (`assets/carousel/`, linked services on a
3D turntable) and **Swarm** (`assets/swarm/`, every record a particle in a three.js scene).
All four complete source builds are bundled; paths are relative to the skill directory.
Use the same skill in Claude Code or Codex. Read `references/builds.md` to locate the source
and scaffold the chosen version; `references/midnight-case-study.md` documents the original.

## Three places: the skill, the product repo and the story repo

Keep these apart. They are often three different locations, and the skill can be installed
anywhere (`.claude/skills/`, `.agents/skills/`, `.github/skills/`, or globally).

- **Skill directory** (`SKILL_DIR`): the folder containing this `SKILL.md`. Every `assets/`,
  `references/` and `scripts/` path in this skill is relative to it. Never edit it, and never
  build a story inside it.
- **Product repo** (`PRODUCT`): the product the story is about. Read its code to learn the
  product. It is **read-only**: never write, install or run anything in it.
- **Story repo** (`STORY_REPO`): where the user wants stories saved. Each story is a
  standalone app in its own folder, `STORY_REPO/stories/<product-name>/`. All copying,
  installing, running and building happens there.

Resolve both repos before step 1. The user's own words always win.

**`PRODUCT`**, in this order:

1. A path or repo the user names as the product (`... for ../acme-web`).
2. The folders open in the session (VS Code workspace roots, directories added with
   `/add-dir` or `--add-dir`, the working directory), excluding `STORY_REPO`. If exactly one
   candidate remains, use it.
3. Otherwise ask. Don't guess.

**`STORY_REPO`**, in this order:

1. A path or repo the user names as the destination (`... save it in ../my-stories`,
   `... put the story in ../demos/acme`). If they name an exact folder, build there and don't
   add `stories/<product-name>/`.
2. A folder open in the session that is clearly meant for stories: it already has a
   `stories/` folder from this skill, or it is the repo that contains `SKILL_DIR` and is not
   the product. If exactly one such folder exists, use it.
3. Otherwise ask: "Which repo should the story be saved in?", listing the open folders.
   Don't guess, and never default to the product repo.

Only build inside the product repo if the user explicitly names it as the destination. Then
add the new story folder and change nothing else there.

Confirm both in one line before starting: "Product: `../acme-web` (read-only). Story:
`../my-stories/stories/acme-web/`." Name the folder after the product (add the flow,
`acme-web-onboarding`, if the product already has a story). If that folder already exists,
ask whether to update it or start a new one.

If you can't read `PRODUCT` or write to `STORY_REPO` (sandbox or permissions), ask the user
to add it (`/add-dir <path>` in Claude Code, `--add-dir <path>` in Codex) rather than writing
somewhere else.

Because the story lives in a different repo, it can't import the product's code. Rebuild the
components it needs at stage size and copy token values, fonts (via their npm packages, such
as `@fontsource`, where the license allows) and any logos or images into the story folder.

## What good looks like

A viewer should feel they're *inside* the product, not watching slides. Concretely:

- **One protagonist.** Follow a single concrete thing (one alert, one order, one invoice) the
  whole way. Abstract flows become consequences of the step before.
- **Every transition carries something.** Nothing just cross-fades. The object from this scene
  becomes (or flies into, or collapses into) the next one.
- **It looks like the real product.** Reuse the product's tokens, components and mock data, so
  the story sells the actual UI.
- **Scrolling back is exact.** Every counter counts down, every fly-to flies back, every typed
  line un-types. That comes free from the architecture below, as long as you keep its rules.
- **Captions explain, motion shows.** One short caption per chapter on the left; the product
  acts it out on the right.
- **It degrades gracefully.** Reduced motion or small screens get a calm storyboard.

## Workflow

Work through these in order. Steps 1–3 decide whether the result is memorable; steps 4–8 are
mostly craft on a proven base.

### 1. Understand the product and mine the product repo

Read the product's code in `PRODUCT` (not this skill's reference builds, which are a
different product). Do this in two passes; `references/storyboarding.md` §7 has the checklist.

1. **How it works.** Understand the product before you think about visuals: its README and
   docs, its pages and routes (what a user can do, in what order), its domain models and
   types, its statuses and state changes (what turns a "proposed" into an "approved"), the
   API or services behind the UI, and its tests, fixtures and seed data. Write down, for
   yourself, what problem it solves, for whom, and the main flows step by step.
2. **How it looks and talks.** Its theme/tokens, its key components (cards, badges, buttons,
   tables), its domain language, and the most concrete data you can find.

The story must follow a flow the product really supports, in the order it really happens,
with the states and rules it really has. Reuse the product's look and words; don't invent
features or steps. If it's unclear who the story is for or which flow matters, ask one short
question. Otherwise pick the flow that best shows the product's value and say why, citing the
files that show it.

When the user names several service repos, read all of them as `PRODUCT` inputs. Trace the
hand-offs between them: the producer, receiver, payload and concrete evidence (an API call,
event, shared ID or contract). Follow one example across the services. Distinguish verified
connections from assumptions; a circular presentation is not evidence of a business loop.
Use the user's chosen story folder name for a company-wide offering.

### 2. Pick a direction

Choose among the four primary versions, preserving the product's own colours, type and components:

- **Fly**: a 3D camera dollies, orbits and cranes through floating UI. Use for cinematic stories
  about scale and systems. Fly is the default.
- **Midnight**: the original screen-based product walkthrough, with a camera dive, fly-tos,
  approval, guardrails and audit. Use for a detailed demonstration of a workflow.
- **Carousel**: the service screens stand around a 3D turntable. Start above the ring,
  descend to the first screen, and rotate the next service to the front at each hand-off.
  Use to show how separate services or repos connect. Read `references/carousel.md`.
- **Swarm**: every record is one particle in a three.js scene, and each chapter rearranges
  the same particles into the next picture: a cloud, a queue, piles, columns, rows. Use when
  the story is about many records being sorted and the product has real counts to show.
  Read `references/swarm.md`.

Honour an explicit choice. Otherwise infer the fit from the brief and state your choice; ask
only if the distinction materially affects an unclear request. Zoom (repeated dives into
individual records) and Snap (one move per scroll flick) are optional alternatives. Do not combine directions unless requested.
Read `references/builds.md` for the chosen source and `references/directions.md` for motion details.

### 3. Storyboard before you build

Read `references/storyboarding.md`. Produce a chapter table: for each chapter, the caption
title, what the viewer sees, what the scroll does, and **what carries into the next chapter**.
Typically 5–9 chapters plus an opening and an ending that bookend each other. Show the table to
the user before building when they're around; it's the cheapest point to change direction.

### 4. Scaffold from the chosen build

Copy the chosen build from `SKILL_DIR` into the story folder in `STORY_REPO` (skip `node_modules`,
`dist`, `.git`, logs and `*.tsbuildinfo`), set its `package.json` name, and run every install,
dev and build command in that story folder.
For **Fly**, start from `assets/fly/` as described in `references/builds.md`; its 3D
world and orbit camera are not in the generic starter. For the full **Midnight** version,
start from `assets/midnight/`. Keep the chosen engine, then adapt the product and chapters.
For **Carousel**, copy `assets/carousel/`; it opens directly in Carousel and includes the
five-service reference, hand-off chips, floor links and a static fallback. Adapt it using
`references/carousel.md`, including whether the real flow closes back to the first service.
For **Swarm**, copy `assets/swarm/`. Keep its `src/engine/` and replace `src/story/` (data,
cast, layouts, labels, cards, timeline) and `src/styles/tokens.css` with the product's, as
`references/swarm.md` describes. It adds three.js and Lenis to the usual dependencies.

For a minimal **Midnight-style** story instead of the full reference, copy `assets/starter/`
into the story folder instead.

Each story is a standalone Vite app with its own `package.json`: `npm install`, then
`npm run dev`. Let Vite select its default available port. Read the actual URL from the server
output and use that URL for previews and verification; do not assume a port.

**Don't get stuck on the server.** Many users run on remote machines (devpods, Codespaces,
SSH) where only some ports are exposed:

- Start the dev server as a **background** process with its output going to a log file, then
  read the URL from the log. A dev server never exits; never wait on it in the foreground.
- Never pass `--port` or `--strictPort`, never hardcode a port in config, and never kill
  another process to free one. If the default is taken, let the framework pick the next.
- Your own checks run on the same machine, so `localhost` works for them even when the port
  isn't exposed. If the *user* can't open the URL, don't restart on other ports. Tell them the
  URL and to forward that port (the VS Code **Ports** panel, or their devpod's port settings),
  or offer `npm run build && npm run preview` for a static check.
- If the same step fails twice for the same reason (install, server start, browser download),
  stop retrying. Report the error, carry on with what doesn't need it, and say what was skipped.

The starter is a working mini story with the whole engine already in it:

| File | What it gives you |
| --- | --- |
| `src/lib/gsap.ts` | GSAP and plugins registered once; three easing curves |
| `src/lib/geometry.ts` | The 1440 × 900 stage, `focus()` (camera) and `morph()` (fly-to) |
| `src/lib/camera.ts` | `portal()`: the zoom *into* a scene drawn as a miniature inside the current one |
| `src/story/timeline/kit.ts` | Captions, `enter`/`leave`, `swap`, `count`, `type`, `press`, `pointer` |
| `src/story/Film.tsx` | Pin + scrub, stage scaling, progress rail, first-load intro, the ready gate, `window.__film` in dev |
| `src/story/Storyboard.tsx` | The static fallback |
| `src/story/timeline/chapters.ts` | An example: camera dive → ticket → collapse into a unit chart → quiet ending |

Replace the example's tokens (`styles/tokens.css`) with the product's, its copy
(`story/data.ts`), its scenes and its chapters. The story stays React + Vite whatever the
product is built with; the engine depends only on React, GSAP and `@gsap/react`.

### 5. Build scenes in their END state

Read `references/architecture.md` before writing scenes. In Midnight, each scene is a full-stage component
(`.scene`, absolutely positioned on the 1440 × 900 stage), laid out in plain pixels, and drawn
**as it looks when its chapter is finished**: the badge already says "Approved", the counter
already reads 214, the reason is already typed. Keep captions clear of the canvas: they live at
x 96–476, so scene content goes roughly in x 520–1400. For Fly, keep the shared
fixed screen stage but place world objects in 3D using `space.ts`; preserve the transform
chain described in `references/directions.md` §5 instead of flattening them into 2D scenes.
For Carousel, preserve the perspective → tilt → ring → panel chain in `Carousel.css`;
`references/carousel.md` identifies which wrappers can safely be faded or clipped.
Swarm has no scenes or fixed stage: a chapter's end state is a **layout** (a position, colour
and size for every particle) in `story/layouts.ts`, and its product UI is drawn finished in
`story/Hud.tsx`. Size every pile from the product's real counts.

### 6. Choreograph the chapters

One chapter = one function in `timeline/` that sets its starting state with `gsap.set`, then
places `s.tl.to(...)` tweens at `t + seconds`, and finishes by moving `s.t` on and calling
`mark()`. Reach for the recipes in `references/transitions.md` (portal zoom, camera dive,
collapse into a unit, lift-and-fly with scramble, FLIP into place, fold into a chip, slats,
iris, conveyor through a gate, pointer clicks, hold-to-confirm, the bookend) and check `references/gsap.md` for the API and
its traps. Motion values come from `references/motion.md`.
In Swarm, a chapter is one block in `story/timeline.ts` built from `engine/kit.ts`:
`chapter()` swaps the caption, flies the camera and sends the swarm to its layout, then
`show`, `hide`, `count` and `press` bring on what belongs to it.

### 7. Optional: a guide character

A small mascot who hops between perches, reacts in speech bubbles and changes mood with the
story makes it memorable, but only use one the project already has. Look through the product
repo and workspace for an avatar, mascot or character folder or package. If you find a
suitable character, `references/guide-character.md` has the recipe; if you don't, skip this
step and say so. Don't invent a character or add an avatar library unless asked.

### 8. Fallback, verify, hand off

- Keep the chosen fallback complete: Midnight uses `Storyboard.tsx` stills; Fly uses the
  readable chapter text in `shared/Board.tsx`.
  Carousel uses `Storyboard.tsx` with a static connection map and each service's screen.
  Swarm uses `engine/Board.tsx`, which also takes over if WebGL is missing or the context is lost.
- Verify with the scripts (`references/verification.md`): screenshots at settled and
  mid-transition times, a rewind pass, the reload check, the phone/reduced-motion pass,
  `npm run build`. Look at the screenshots; don't just check that they exist. The scripts need
  Playwright's Chromium; if it can't be installed or launched (no internet, missing system
  libraries), skip them after one failed attempt, run `npm run build`, and ask the user to
  scroll through the story themselves.
- Before handing off, check that you changed nothing outside the story folder:
  `git -C "$PRODUCT" status --short` and `git -C "$SKILL_DIR" status --short -- .` should list
  no files you created or changed.
- Write a README in the story folder (chapters table, file map, how to change copy and pacing). For a team, offer
  a plain-language explainer of the story architecture.

## The rules that keep it working

These are the things that broke, or nearly broke, in the reference build. The reasons matter
more than the rules, so each has its why.

1. **Fixed stage, pixel layout.** (Fly, Midnight, Carousel; Swarm's stage is a 3D scene, see
   `references/swarm.md`.) Everything sits on a 1440 × 900 canvas scaled to fit the
   window. Fly-tos and camera moves need targets that never move; on a fixed stage, positions
   are measured once and stay right at any window size.
2. **End state in markup, start state in the timeline; only tween forward.** GSAP records a
   `.to()` tween's start values the first time the playhead reaches it. That's what makes
   rewinding exact, and it's why the static fallback gets finished stills for free.
3. **One master timeline, created paused, scrubbed by one ScrollTrigger.** Don't put
   ScrollTriggers on individual tweens. Chapters append to the one timeline in order.
4. **Build after fonts load; hide the stage until built.** Measuring before fonts land puts
   every fly-to off by a few pixels. And because scenes are drawn finished, showing the stage
   before the start states are set flashes every scene at once (the hero and outro headlines
   on top of each other). `Film.tsx` gates the stage on `data-ready`.
5. **Beware `fromTo` and `from` late in the film.** They apply their start values *immediately*
   at build time unless you pass `immediateRender: false`. Prefer `gsap.set` + `tl.to`.
6. **Don't mutate React-owned DOM.** If a number needs its own span to count, render that span
   in JSX. GSAP may change styles and text, not structure.
7. **`transform` and `opacity` for motion.** Blur only to hide a crossfade seam, and keep it
   ≤ 8px. `will-change: transform` only on layers the camera zooms and then leaves.
8. **Scenes stay hidden when off-stage** (`autoAlpha: 0`, which sets `visibility: hidden`), so
   the browser doesn't paint them and nothing hidden can be tabbed to. In Fly, use visibility
   on 3D ancestors and opacity only on leaf panels so hiding never flattens the world.

## References

Read what the current step needs; you don't need all of them up front.

| File | Read it when |
| --- | --- |
| `references/builds.md` | Choosing and scaffolding Fly, Midnight, Carousel or Swarm (steps 2–4) |
| `references/directions.md` | Direction selection, plus optional Zoom and Snap recipes (step 2) |
| `references/carousel.md` | Carousel geometry, hand-offs, multi-repo adaptation and verification |
| `references/swarm.md` | Swarm: the cast, layouts, the GPU-side motion, looks and performance rules |
| `references/storyboarding.md` | Planning chapters, captions, pacing (step 3) |
| `references/architecture.md` | Before writing scenes or touching `Film.tsx` (steps 4–5) |
| `references/transitions.md` | Choreographing chapters: the recipe catalogue with code (step 6) |
| `references/gsap.md` | Any GSAP API question: ScrollTrigger, timelines, plugins, traps |
| `references/motion.md` | Choosing eases and durations; performance; accessibility; the polish checklist |
| `references/guide-character.md` | Adding a guide character the project already has (step 7) |
| `references/verification.md` | Checking the build (step 8) |
| `references/midnight-case-study.md` | Seeing how a full story was put together, beat by beat |

If the official GSAP skills (`gsap-core`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-react`,
`gsap-plugins`) or Emil Kowalski's `animate` / `emil-design-eng` skills are installed, they go
deeper on their topics; this skill is self-contained without them.
