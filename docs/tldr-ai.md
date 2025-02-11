# TLDR for AI dev

Be direct in all responses. Use simple language. Avoid niceties, filler words, and formality.

Feel free to run terminal commands yourself. Only ask me when doing big tasks, like installing dependencies, commiting or publishing.

Before commiting or publishing, run tests: `npm run build && npm test`.

When asked to publish, first make sure we commited, pushed, patched and then npm publish.

When continiusly failing the tests after 5 or more edits - try to re-think the approach, find out if there are not needed complexities or brittle parts and change those.

When commiting, write concise messages and prefix with scope, eg. `feat: short description`