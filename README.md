# Airul

Airul generates context for AI agents from your documentation. It gives AI immediate access to up-to-date important info about your project.

## Use Cases

### Starting a New Project

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

### Adding to Existing Project

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

### Keeping Context Updated

After making changes to your project:
```bash
# Update AI context after:
# - Adding/modifying documentation
# - Installing new dependencies
# - Changing project structure
airul gen

# Or use npm script (recommended)
npm run rules
```

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
    "cursor": true,
    "windsurf": false,
    "copilot": false
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
