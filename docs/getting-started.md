# Getting Started with Airul

## Quick Start

1. Install the package globally (recommended for initialization):
   ```bash
   npm install -g airul
   ```

2. Initialize in your project:
   ```bash
   # Basic initialization
   airul init

   # Or initialize with a task for AI
   airul init "Create a React component"
   ```

   Basic initialization will:
   - Create `.airul.json` with default configuration
   - Create a `docs` directory if it doesn't exist
   - Add airul as a dev dependency to your project
   - Add an npm script: `npm run rules`

   Note: You may want to add `.windsurfrules` and `.cursorrules` to your `.gitignore` if you don't want to commit these files.

   When providing a task, it will also:
   - Create `TODO-AI.md` with your task instructions
   - AI tools will see this file and help you complete the task
   - The file will be removed once the task is complete

3. Generate rules:
   ```bash
   # Using local installation (recommended)
   npm run rules

   # Or using global installation
   airul generate
   ```

This will:
- Scan your project's documentation files
- Generate `.windsurfrules` and `.cursorrules` files
- These files can be used by AI tools to understand your project's conventions

## Configuration

Create `.airul.json` in your project root:

```json
{
  "sources": ["README.md", "docs/*.md", "*.txt"],
  "output": {
    "windsurf": true,
    "cursor": true,
    "customPath": "custom-rules.txt"
  }
}
```

Note: Airul works with any text files, not just markdown. You can include `.txt`, `.md`, or any other text files in your sources.

## Best Practices

1. Keep documentation focused and actionable
2. Use clear, explicit instructions
3. Group related information together
4. Update documentation when project conventions change
