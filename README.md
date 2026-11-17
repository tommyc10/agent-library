# Agent Library

One page for the skills, prompts and agent files you use, built to be searched and copied from.
The look is Imperial Ops (Midnight), from its DESIGN.md: greys only, with colour kept for status.

```bash
npm install
npm run dev
```

`npm run build` writes a static site to `dist/` that works from any sub-path, so it can be served
by GitLab or GitHub Pages as it is.

## The files are the library

Nothing is edited in the site. Add a file under `content/` and it appears.

| To add | Do this |
| --- | --- |
| A prompt | Add `content/prompts/<name>.md`. Frontmatter: `title`, `description`, `collection`, `tags`, and `skill` if it calls one. The body is the prompt. Write blanks as `{{example text}}`. |
| An agent file | Add `content/agents/<name>.md`. Frontmatter: `title`, `description`, `collection`, `tags`, `path`. The body is the file. |
| A skill | Put its folder in `content/skills/<name>/` (it needs a `SKILL.md`), then give it a collection and preview in `content/library.yml`. Add `source: owner/repo` if the author publishes it on GitHub under `skills/<name>/`: the skill's panel and tile then offer `npx skills add owner/repo --skill <name>`. Without a `source` there is no install command. |
| Many skills | `npm run import-skills -- <folder of skills>` copies the markdown of every skill in that folder. |
| tblock's facts | `npm run sync-tblock -- <tblock plugin folder>` rewrites `content/tblock.json` from an installed tblock: its version, its counts, the skills it ships (each gets a "Ships in tblock" mark and filter) and the real output the hero's terminal plays. Run it after a tblock update. |
| A collection | Add it to `collections` in `content/library.yml`. |
| A chain | Add it to `chains` in `content/library.yml`: a `name`, a `collection` for its colour, and `steps`, each a `skill` and what it `does`. The build stops if a step names a skill that isn't there. |

Quote any frontmatter value that contains a colon.

## Where things are

- `vite.config.ts` reads `content/` into one module (`virtual:library`) at build time.
- `src/lib/library.ts` holds the types and the search.
- `src/styles/theme.css` holds every token from the Imperial Ops DESIGN.md, and the cross-fade used when the theme changes.
- `src/lib/motion.ts` holds the springs, in Apple's terms (damping and response). Tiles move to
  their new places on them when a filter changes (Motion's `layout`), and
  `src/lib/panel-motion.ts` grows a tile into the detail panel on them. Both can be
  interrupted and reversed half way. On narrow screens the panel is a sheet you drag down
  by its header to put away.
- `src/styles/previews.css` holds the small drawings skill tiles can use; `content/library.yml` lists them.
