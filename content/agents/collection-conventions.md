---
title: "Folder conventions for a design collection"
description: "Where apps, demos, guides and skills live, and the rules for promoting an experiment into a skill."
collection: working
path: ui-ux-inspiration/AGENTS.md
tags: [AGENTS.md]
---

# Folder conventions

- Keep complete dashboard apps under `dashboard-designs/`; the current operations app is `dashboard-designs/imperial-ops`.
- Save standalone scroll-driven films under `scroll-demos/`, one app per folder. Read the product dashboard without adding story code to its repository.
- Keep learning material and related films under `design-guides/`, and reusable UI pieces under `code-library/`.
- iTech is a complete standalone project at `../projects/itech`, outside this inspiration collection.
- The fantasy avatars project is maintained at `../projects/avatars`. The Dragon/Trooper code-library fork is distinct and should not be overwritten with it.
- Maintain authored skills in `../skills/`: Scroll Story is in `scroll-story`, and Tour/Tour Lite share `tour-skill`. New authored skills and changes to existing skills go there.
- The local `.agents/skills/scroll-story` links to `../skills/scroll-story/.claude/skills/scroll-story`. Shared UI skill registrations live at this collection's root.
- Preserve existing Git history and uncommitted changes during reorganisations. Generated dependencies and build output are not source; retain finished deliverables unless explicitly cleaning them up.

## Scroll-story development and promotion

- Keep `../skills/scroll-story` for the reusable skill, reference instructions and explicitly approved assets, alongside `../skills/tour-skill`.
- Build every new product demo or experimental direction in its own project folder under `scroll-demos/`. Experiments may copy approved reference builds, but must not change their originals in the skill repository.
- Use the maintained GitHub `main` version of the skill. The workspace, global Codex and global Claude skill registrations point at that same checkout.
- Only add or alter material in the skill when the user explicitly asks for or approves that skill change. Approval to build a demo does not imply approval to promote it; positive feedback alone is not promotion approval.
- After promotion is requested, prepare a reusable asset with its source and relevant docs, and complete appropriate build and visual verification. Publish or merge to GitHub `main` only when the user authorises that publication. A request that already includes publication to main supplies that authorisation; do not ask again.
- Swarm is an approved asset already on main. Other demo directions remain experiments until separately approved.
