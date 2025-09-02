export const prompts = {
  // Context intro for AI tools
  contextIntro: (sourcesCount: number, includeTodoReminder: boolean) =>
    `This is a context for AI editor/agent about the project. It's generated with a tool Airul (https://github.com/mitkury/airul) out of ${sourcesCount} sources. Edit .airul.json to change sources or enabled outputs. After any change to sources or .airul.json, run \`airul gen\` to regenerate the context.${includeTodoReminder ? ' Keep TODO-AI.md updated after major changes to track tasks and decisions.' : ''}`,

  // Config descriptions
  configWhat: "Generate AI rules from your docs for Cursor, Windsurf, GitHub Copilot, Claude Code and other AI-powered tools",
  configHow: "Edit 'sources' to include your important docs (supports glob patterns like 'docs/*.md') and enable/disable AI tools in 'output'",

  // Tasks
  defaultTask: "Learn from the user about their project, get the idea of what they want to make",

  // TODO template
  todoTemplate: (task: string, date: string) => `# AI Workspace

## Active Task
${task}

## Status
⏳ In Progress

## Context & Progress
- Created: ${date}
- I (AI) will maintain this document as we work together
- My current focus: Understanding and working on the active task

## Task History
- Initial task: ${task}

## Notes
- I'll update this file to track our progress and maintain context
- I'll keep sections concise but informative
- I'll update status and add key decisions/changes
- I'll add new tasks as they come up`,

  // Warning messages
  noSourcesFound: "No sources found",
  emptyFileWarning: (file: string) => `Warning: File ${file} is empty`,
  invalidGlobWarning: (pattern: string, error: any) => `Warning: Invalid glob pattern ${pattern}: ${error}`,
  fileReadError: (file: string, error: string) => `Warning: Could not read file ${file}: ${error}`,
  gitInitSkipped: "Note: Git initialization skipped - git may not be installed",
  rulesGenerationSkipped: "Note: Initial rules generation skipped - add documentation first"
}; 