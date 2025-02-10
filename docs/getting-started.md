# Getting Started with AIRule

AIRule helps you maintain consistent behavior in Cursor, Windsurf, and other AI-powered IDEs by generating rules from your project documentation.

## Quick Start

1. Install the package:
   ```bash
   npm install -g airule
   ```

2. Run in your project:
   ```bash
   airule generate
   ```

This will:
- Scan your project's documentation files
- Generate `.windsurfrules` and `.cursorrules` files
- These files can be used by AI tools to understand your project's conventions

## Configuration

Create `.airulerc.json` in your project root:

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

Note: AIRule works with any text files, not just markdown. You can include `.txt`, `.md`, or any other text files in your sources.

## Best Practices

1. Keep documentation focused and actionable
2. Use clear, explicit instructions
3. Group related information together
4. Update documentation when project conventions change
