# Airul

Airul generates context for AI agents from your docs. It gives AI immediate access to up-to-date important info about your project.

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

After making changes to your project, you have two options to update the AI context:

#### Option 1: NPM Scripts (Recommended)
Add airul to your package.json:
```json
{
  "devDependencies": {
    "airul": "latest"
  },
  "scripts": {
    "rules": "airul gen",
    "prestart": "airul gen",
    "prebuild": "airul gen"
  }
}
```

Then run:
```bash
# Manual update
npm run rules

# Automatic update before npm start/build
npm start
npm run build
```

#### Option 2: CLI Command
If installed globally:
```bash
# Update AI context manually
airul gen
```

Both approaches will update context when you:
- Add/modify documentation
- Install new dependencies
- Change project structure

## Features

- 🎯 Generate AI context files for multiple tools:
  - GitHub Copilot (.github/copilot-instructions.md)
  - Cursor (.cursorrules)
  - Windsurf (.windsurfrules)
- 📝 Works with any text files (markdown, txt, etc.)
- ⚙️ Simple configuration

## Example

Create `.airul.json`:
```json
{
  "sources": ["README.md", "docs/*.md", "*.txt"],
  "output": {
    "cursor": true,    /* enabled by default only when no other editors are specified */
    "windsurf": false, /* disabled by default */
    "copilot": false   /* disabled by default */
  }
}
```

Run:
```bash
npm run rules
```

This will:
1. Scan your documentation files
2. Generate AI context files based on your output settings
3. Format the content appropriately for each tool

## License

MIT
