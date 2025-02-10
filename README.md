# AIRule

CLI tool for generating AI rules from project documentation.

## Installation

```bash
npm install airule
```

## Usage

### CLI

```bash
# Basic usage - generates both .windsurfrules and .cursorrules
npx airule generate

# Disable specific outputs
npx airule generate --no-windsurf
npx airule generate --no-cursor

# Add custom output file
npx airule generate --custom-output rules.txt

# Use custom configuration
npx airule generate --config .airulerc.json
```

### JavaScript/TypeScript API

```typescript
import { generateRules } from 'airule';

await generateRules({
  sources: ['README.md', 'docs/*.md'],
  output: {
    windsurf: true,
    cursor: true,
    customPath: 'custom-rules.txt'
  }
});
```

## Configuration

Create an `.airulerc.json` file:

```json
{
  "sources": [
    "README.md",
    "docs/*.md",
    "CONTRIBUTING.md"
  ],
  "output": {
    "windsurf": true,
    "cursor": true,
    "customPath": "custom-rules.txt"
  },
  "template": {
    "header": "# AI Rules for {projectName}",
    "fileHeader": "## From {fileName}:",
    "separator": "\n---\n"
  }
}
```

## License

MIT
