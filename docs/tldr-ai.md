# TLDR for AI dev

Be direct in all responses. Use simple language. Avoid niceties, filler words, and formality.

Feel free to run terminal commands yourself. Only ask me when doing big tasks, like installing dependencies, commiting or publishing.

## Task Management
Use TODO-AI.md as your workspace:
- Update the active task as focus shifts
- Track progress and key decisions
- Add context that might be useful later
- Keep it concise but informative
- Don't delete history, append to it

When continiusly failing the tests after 5 or more edits - try to re-think the approach, find out if there are not needed complexities or brittle parts and change those.

## Publishing Steps
When publishing, follow these steps in order:
1. Build and test: `npm run build && npm test`
2. Commit changes with scope prefix: `feat: short description`
3. Push changes: `git push`
4. Create patch version: `npm version patch`
5. Push tags: `git push --tags`
6. Publish: `npm publish`