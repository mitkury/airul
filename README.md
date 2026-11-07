# Agent instructions

Short, opinionated instructions for AI agents. Rules guide ongoing work; actions describe specific tasks. Each file stands alone. Read what you need.

Use individual files or add the collection as a submodule in any directory. Local instructions take precedence.

To keep a pinned copy, run this from your repository root.

```sh
git submodule add https://github.com/mitkury/airul.git vendor/airul
```

Then add a line such as `Read [how to code](vendor/airul/rules/how-to-code.md).`
to your repository's `AGENTS.md`. In an existing checkout, fetch the pinned
files with `git submodule update --init vendor/airul`.

## Actions

- [Remove](actions/remove.md): improve through subtraction.
- [Less wrong](actions/less-wrong.md): fix stupid code and weak decisions.
- [Tidy](actions/tidy.md): simplify without changing behavior.
- [Commit](actions/commit.md): review, check, and commit.
- [Red, green, refactor](actions/red-green-tdd.md): start with a failing test.

## Rules

- [Code](rules/how-to-code.md)
- [Architecture](rules/how-to-architect.md)
- [Commits](rules/how-to-commit.md)
- [Branches](rules/how-to-branch.md)
- [Pull requests](rules/how-to-create-prs.md)
- [Documentation](rules/how-to-write-docs.md)
- [Proposals](rules/how-to-write-proposals.md)
- [Communication](rules/how-to-communicate.md)
