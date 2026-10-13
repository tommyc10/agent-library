# Agent Library

One page for the skills, prompts and agent files you use, built to be searched and copied from.
The look is Imperial Ops (Midnight) with one addition: each collection has a colour.

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
| An agent file from elsewhere | Copy it into `content/agents/` as it is, and set its `collection` and `path` under `agents` in `content/library.yml`. Its own frontmatter stays in the file and is copied with it. |
| A skill | Put its folder in `content/skills/<name>/` (it needs a `SKILL.md`), then give it a collection and preview in `content/library.yml`. |
| Many skills | `npm run import-skills -- <folder of skills>` copies the markdown of every skill in that folder, subfolders included, and renames any skill whose `name` differs from its folder (Copilot and Codex skip those). |
| A collection | Add it to `collections` in `content/library.yml` with a `hue` from 0 to 360. |
| A collection guide | Add `content/collections/<id>/guide.md`. It shows above the collection when it is opened, with a button that downloads the whole collection as a zip. Link to an entry as `[/how](skill/how)`. A `LICENSE` beside it ships in the download. |

Every skill can be downloaded as a zip of its folder from its panel.

Quote any frontmatter value that contains a colon.

## Where things are

- `vite.config.ts` reads `content/` into one module (`virtual:library`) at build time.
- `src/lib/library.ts` holds the types and the search.
- `src/styles/theme.css` holds every colour, and the view-transition rules that move rows
  when a filter changes and grow a tile into the detail panel.
- `src/styles/previews.css` holds the six small drawings skill tiles can use.
