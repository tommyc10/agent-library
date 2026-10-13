# pstack

pstack is a set of skills by [poteto](https://x.com/poteto) (Lauren Tan, who works on React and at Cursor). It makes an agent work like a careful senior engineer. It reproduces a bug before fixing it, proves a change works, keeps the diff small and writes plainly. It was built as a Cursor plugin. Its skills are plain `SKILL.md` files, so GitHub Copilot can use them too.

There are 53 skills and 2 agents:

- **[/poteto-mode](skill/poteto-mode)** is where to start. Give it any task. It picks one of 23 playbooks (bug fix, feature, refactor, investigation and more) and follows its steps.
- **24 principles** (`principle-*`) are short rules such as *prove it works* and *fix root causes*. poteto-mode reads them when a step needs one.
- **The rest** are tools you can call on their own, such as [/how](skill/how), [/why](skill/why) and [/interrogate](skill/interrogate).

## Set it up in GitHub Copilot

1. Download all of pstack with the button above, then unzip it.
2. Copy the folders inside `skills/` into your personal skills folder. Keep them all together, because poteto-mode reads the other skills from the folder next to it.
   ```
   ~/.copilot/skills/
   ```
   To share them with a team through one repo instead, use `.github/skills/` in that repo.
3. Copy the files inside `agents/` into `~/.copilot/agents/`, or `.github/agents/` in the repo.
4. In Copilot Chat, open **Configure Tools** and tick **Run Subagent**. Several pstack skills hand work to helper agents.
5. Reload VS Code and type `/` in the chat box. The pstack skills are in the list.

To take one skill at a time, open it here and use **Download folder**. Keep the folder name the same as the skill name, or Copilot skips the skill.

## Try these first

| Type this | What happens |
| --- | --- |
| `/poteto-mode the export drops the last row. reproduce it first, then fix it.` | Runs the bug fix playbook: reproduce, find the root cause, fix, prove it. |
| `/how does the retry logic in the loader work?` | Walks you through how a part of the code works. |
| `/why do we cache this result?` | Digs up why something was built the way it was. |
| `/interrogate review my changes` | Several reviewers try to break your diff. |
| `/tdd` | Writes a failing test first, then the fix. |
| `/unslop` | Rewrites text so it doesn't read like AI wrote it. |

pstack skills run only when you type them. Copilot doesn't pick them by itself.

## What works in Copilot

pstack was written for Cursor, so some of it leans on Cursor's own tools.

- **Works as it is.** All 24 principles, plus [/unslop](skill/unslop), [/technical-writing](skill/technical-writing), [/tdd](skill/tdd), [/blast-radius](skill/blast-radius), [/benchmark-checklist](skill/benchmark-checklist), [/correct](skill/correct), [/figure-it-out](skill/figure-it-out), [/teach](skill/teach), [/bro](skill/bro), [/in-your-own-words](skill/in-your-own-words) and [/ketchup](skill/ketchup).
- **Works, a little differently.** [/poteto-mode](skill/poteto-mode), [/how](skill/how), [/why](skill/why), [/arena](skill/arena), [/swarm](skill/swarm), [/interrogate](skill/interrogate), [/architect](skill/architect) and [/no-comments](skill/no-comments). They name Cursor's subagent tool and its models (Grok and Opus). Copilot uses its own subagent tool and the model you picked, so a "several models" review may run on one model.
- **Needs one change.** [/create-verification-skill](skill/create-verification-skill) writes to `.cursor/skills/`. Ask it to use `.github/skills/`.
- **Cursor only, skip these.** [/setup-pstack](skill/setup-pstack) writes Cursor settings and [/make-bot-ui](skill/make-bot-ui) uses Cursor webhooks. [/recall](skill/recall), [/reflect](skill/reflect) and [/automate-me](skill/automate-me) read Cursor's chat history. poteto-mode also mentions `deslop`, `control-ui` and Bugbot, which are Cursor tools and aren't included here.

## Before you use it at work

- poteto-mode tells the agent to go ahead with reversible actions without asking, including posting to team chat and updating tickets. Tell it not to, or edit the **Autonomy** section of `poteto-mode/SKILL.md`.
- `/why` searches every tool Copilot is connected to, such as chat, docs and monitoring.
- These are someone else's instructions, and they get the same access as your agent. Read a skill before you rely on it.

## Where it comes from

Copied from [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack) at pstack 0.15.23 (commit `dbf4981`). The [pstack guide](https://github.com/cursor/plugins/tree/main/pstack/docs/guide) there tells the full story. It is MIT licensed, © 2026 Lauren Tan, and the licence comes with the download.

Two things differ from the original. `poteto-mode` and `make-bot-ui` are renamed in their `SKILL.md` so Copilot loads them. The helper scripts in `poteto-mode/scripts/` aren't copied. They need Bun, and only seven playbooks use them, mostly the ones that land PRs or run for hours.

To update, clone cursor/plugins and run this from the library:

```
npm run import-skills -- path/to/cursor/plugins/pstack/skills
```
