# AIRule

Generate rules from your documentation for Cursor, Windsurf, and other AI-powered IDEs.

## Quick Start

```bash
# Install globally (recommended for init)
npm install -g airule

# Initialize project (this will add airule as a dev dependency)
airule init

# Or start with an AI task
airule init "Create a React component"

# Generate rules using local installation
npm run rules
```

## Features

- 🎯 Automatically generate rules (`.windsurfrules` and `.cursorrules`) from your docs
- 📝 Works with any text files (markdown, txt, etc.)
- ⚙️ Simple output configuration

## Documentation

- [Getting Started Guide](docs/getting-started.md)
- [Writing Effective Rules](docs/rules-guide.md)

## Example

Create `.airulerc.json`:
```json
{
  "sources": ["README.md", "docs/*.md", "*.txt"],
  "output": {
    "windsurf": true,
    "cursor": true
  }
}
```

Run:
```bash
npm run rules
```

## License

MIT
