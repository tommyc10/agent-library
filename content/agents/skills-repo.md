---
title: "Rules for a repo of authored skills"
description: "How skills are laid out, registered and changed in the skills checkout."
collection: working
path: skills/AGENTS.md
tags: [AGENTS.md]
---

# Authored skill sources

- This is the home for the user's authored skills. Make skill changes here and put new authored skill repositories alongside the existing repositories.
- Scroll Story lives in `scroll-story/.claude/skills/scroll-story`. Tour and Tour Lite live in `tour-skill/skills/tour` and `tour-skill/skills/tour-lite`.
- Keep Tour and Tour Lite in the same repository: Tour Lite uses Tour's shared engine and assets.
- Global Codex and Claude registrations are symlinks to these sources. Keep registrations linked rather than maintaining independent copies.
- Put standalone demos and experimental builds outside the skills, normally in `../ui-ux-inspiration/scroll-demos/<project>`, with each demo in its own folder. Skill-specific checks and approved reusable reference assets belong with their skill.
- Only promote demo material into a skill when the user explicitly requests or approves that promotion. Approval to build a demo or positive feedback alone does not approve promotion. Existing explicit authorisation in the session remains valid.
- Validate skill changes appropriately. Publish or merge to GitHub only when authorised; a request that includes publication supplies that authorisation without another confirmation.
- Preserve each repository's Git history, remotes and uncommitted work. Scroll Story currently uses the maintained GitHub `main`, including the approved Swarm asset.
