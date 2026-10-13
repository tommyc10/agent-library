# scroll-story for Claude Code and Codex

Builds scroll-driven product stories: a pinned, cinematic page where scrolling plays (and
rewinds) a film of a product's workflow, with camera moves that "scroll into" each step. It's
based on three primary versions: **Fly** (`assets/fly/`, the default 3D film),
**Midnight** (`assets/midnight/`, the original detailed walkthrough), **Carousel**
(`assets/carousel/`, linked service screens on a 3D turntable), and **Swarm**
(`assets/swarm/`, every record a particle that rearranges into each chart).

## Use it

In Claude Code:

```text
/scroll-story use Fly for our onboarding flow, following one user from sign-up to first invoice
/scroll-story use Midnight for a detailed walkthrough of our approval flow
/scroll-story use Carousel to follow one order through our connected services
/scroll-story use Swarm to show what our filters did to last quarter's alerts
```

In Codex:

```text
$scroll-story use Fly for our onboarding flow
$scroll-story use Midnight for our approval flow
$scroll-story use Carousel to show how our services hand off one customer order
$scroll-story use Swarm to show where a month of orders ended up
```

Say which repo is the product and which repo the story should be saved in:

```text
/scroll-story use Fly for the checkout flow in ../acme-web, save the story in ../my-stories
```

The product repo is read-only: the agent reads how it works, its styles, components and
wording, and changes nothing there. The story is built as a standalone app in the repo you
name, in `stories/<product-name>/`. If you don't name one, the agent uses a folder in the
workspace that is clearly for stories (it already has a `stories/` folder, or it's the repo
that holds this skill), or asks. It never defaults to the product repo.

Both agents can also select the skill for a relevant product-story request. The skill routes
from the chosen version to its working source, then covers storyboarding, adaptation and
verification. Zoom remains an optional alternative when specifically wanted.

## Install

The skill works from anywhere; where it's installed doesn't decide where stories go.

- **In a stories repo**: clone the scroll-story repository (rename it if you like, e.g.
  `my-stories`). The skill lives at `.claude/skills/scroll-story/` (Claude Code) and
  `.agents/skills/scroll-story` is a relative symlink to it (Codex). Stories go in its
  `stories/` folder by default.
- **In another skills folder**: copy this folder to wherever your agent reads skills, such as
  `.github/skills/scroll-story`, and name the stories repo in your request.
- **Globally**: copy this folder to `~/.claude/skills/scroll-story` and link
  `~/.codex/skills/scroll-story` to it. Name the stories repo in your request.

Open the product repo and the stories repo in the same VS Code workspace, and give the agent
access to both if needed: `/add-dir <path>` in Claude Code, `codex --add-dir <path>` in Codex.

The full Fly, Midnight, Carousel and Swarm reference applications are bundled in
`assets/fly/`, `assets/midnight/`, `assets/carousel/` and `assets/swarm/`. Copying this skill
folder includes everything needed except installed package dependencies. See
`references/builds.md` for setup, `references/carousel.md` for the turntable geometry and
hand-off choreography, and `references/swarm.md` for the particle world.

## What's inside

```
scroll-story/
├── SKILL.md                     the workflow and rules (both agents read this first)
├── references/
│   ├── builds.md                Fly / Midnight / Carousel / Swarm source selection and scaffolding
│   ├── carousel.md              turntable geometry, payload continuity and multi-repo adaptation
│   ├── swarm.md                 the particle world: cast, layouts, GPU-side motion, looks
│   ├── directions.md            motion details, including optional Zoom / Snap
│   ├── storyboarding.md         protagonist, arc, carry-overs, captions, pacing
│   ├── architecture.md          stage, pin + scrub, end-state scenes, one timeline, load gate
│   ├── transitions.md           ~25 recipes with code: portal zoom, iris, slats, dive, FLIP, fold…
│   ├── gsap.md                  the GSAP you need + the traps we hit
│   ├── motion.md                curves, durations, performance, accessibility, polish checklist
│   ├── guide-character.md       an optional guide, only if the project has a character
│   ├── verification.md          how to check it: settled, mid-transition, rewind, load, fallback
│   └── midnight-case-study.md   the reference build, beat by beat, and what went wrong
├── assets/fly/                  complete Fly build, with optional Zoom / Snap
├── assets/midnight/             complete Midnight build
├── assets/carousel/             complete Carousel build, opening directly in this style
├── assets/swarm/                complete Swarm build (three.js), with four looks
├── assets/starter/              a working mini story (Vite + React + TS + GSAP) to copy
└── scripts/
    ├── shoot.mjs                seek-and-screenshot at timeline times (Playwright)
    └── check-load.mjs           reload check: no flash of every scene at once
```

Try the starter on its own: `cp -R assets/starter /tmp/story && cd /tmp/story && npm install && npm run dev`
Open the URL printed by the dev server. In an existing project, use its configured dev command and port.
