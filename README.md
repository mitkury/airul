# Airul

Airul generates context for AI agents (AGENTS.md, CLAUDE.md, etc.) from your docs. You can link multiple text files - project description, user docs, and other materials useful for agents - and generate a single global context file referenced by your AI agent.

## How to use

### Starting a new project

```bash
# Install as a CLI tool
npm install -g airul

# Create a new project and open in Cursor
airul new my-project "Create a React app with authentication" --cursor

# This will:
# 1. Create my-project directory
# 2. Initialize git repository
# 3. Create initial documentation
# 4. Generate AI context files
# 5. Open in Cursor (and other editors if specified)
```

### Core Commands

#### `airul init`
Initializes a new project:
- Creates `.airul.json` config if it doesn't exist
- Creates initial `TODO-AI.md` if it doesn't exist
- Generates rules from the new configuration
- Initializes git repository (if not already initialized)

#### `airul gen`
Generates AI context files:
- If `.airul.json` exists: generates rules using the existing configuration
- If `.airul.json` doesn't exist: runs `init` first, then generates rules
- Always uses the most recent content from your source files

### Adding to existing project

```bash
# Install as a CLI tool
npm install -g airul

# Initialize airul in your project
airul init 

# This will:
# 1. Add airul as dev dependency
# 2. Create .airul.json config
# 3. Create initial documentation
# 4. Generate AI context files
```

### Keeping context updated

After making changes to your project, you have these options to update the AI context:

```bash
# Run this after making changes to your documentation
airul gen
```

You can run this command directly if you installed Airul globally, or use `npx airul gen` if installed as a dev dependency.

For automatic updates, add this to your package.json:
```json
{
  "devDependencies": {
    "airul": "latest"
  },
  "scripts": {
    "prestart": "airul gen",
    "prebuild": "airul gen"
  }
}
```

This way, your AI context will always be updated before running or building your project.

All approaches will update context when you:
- Add/modify documentation
- Install new dependencies
- Change project structure

## Supported Editors

Airul supports multiple AI-powered editors. You can enable them during initialization or in existing projects:

| Editor | Output File | Flag to Enable | Configuration |
|--------|-------------|----------------|--------------|
| Cursor | `AGENTS.md` | `--cursor` | `"cursor": true` |
| GitHub Copilot | `.github/copilot-instructions.md` | `--copilot` | `"copilot": true` |
| Windsurf | `.windsurfrules` | `--windsurf` | `"windsurf": true` |
| Claude | `CLAUDE.md` | `--claude` | `"claude": true` |
| Cline | `.clinerules` | `--cline` | `"cline": true` |
| Codex | `AGENTS.md` | `--codex` | `"codex": true` |

**Example: Enabling editors during initialization:**
```bash
# Enable Cursor and Claude
airul init --cursor --claude

# Enable all editors
airul init --cursor --copilot --windsurf --claude --cline --codex
```

**Example: Enabling editors in an existing project:**
```bash
# Add Claude support to an existing project
airul init --claude
# OR
airul gen --claude

# Enable multiple editors at once
airul init --cursor --copilot --claude
# OR
airul gen --cursor --copilot --claude

# Add Codex support
airul init --codex
# OR
airul gen --codex
```

You can use either `airul init` or `airul gen` with editor flags to enable editors in an existing project. Both commands will update your configuration.

**Example: Configuration in `.airul.json`:**
```json
{
  "sources": ["README.md", "docs/*.md"],
  "output": {
    "cursor": true,
    "copilot": true,
    "windsurf": false,
    "claude": true,
    "cline": false,
    "codex": false
  }
}
```

## Features

- 🎯 Generate AI context files for multiple tools:
  - GitHub Copilot (.github/copilot-instructions.md)
  - Cursor (AGENTS.md)
  - Windsurf (.windsurfrules)
  - Claude (CLAUDE.md)
  - Cline VSCode Extension (.clinerules)
  - Codex (AGENTS.md)
- 📝 Works with any text files (markdown, txt, etc.)
- ⚙️ Simple configuration

## License

MIT