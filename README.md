# AIRule

Generate rules from your documentation for Cursor, Windsurf, and other AI-powered IDEs.

## Quick Start

```bash
# Install globally
npm install -g airule

# Generate rules in your project
airule generate
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
airule generate
```

## License

MIT
