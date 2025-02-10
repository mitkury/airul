# airule Package Specification

## Overview
`airule` is a CLI tool and JavaScript library for generating AI context rules from project documentation. It helps developers maintain consistent AI behavior across their projects by extracting rules and context from documentation files.

## Core Features

### 1. CLI Tool
```bash
# Basic usage
npx airule generate

# With custom config
npx airule generate --config .airulerc.json

# Specify files directly
npx airule generate --files README.md,docs/*.md

# Disable specific outputs
npx airule generate --no-windsurf
npx airule generate --no-cursor

# Add custom output file
npx airule generate --custom-output rules.txt
```

### 2. Configuration
`.airulerc.json` schema:
```typescript
interface AiruleConfig {
  // Files to extract rules from
  sources: string[];
  // Output configuration
  output: {
    windsurf: boolean;     // Enable/disable .windsurfrules output (default: true)
    cursor: boolean;       // Enable/disable .cursorrules output (default: true)
    customPath?: string;   // Optional path for additional output file
  };
  // Optional formatting settings
  template?: {
    header?: string;      // e.g. "# AI Rules for {projectName}"
    fileHeader?: string;  // e.g. "## From {fileName}:"
    separator?: string;   // e.g. "\n---\n"
  };
  // Optional glob patterns to ignore
  ignore?: string[];
}
```

### 3. JavaScript/TypeScript API
```typescript
interface GenerateOptions {
  sources: string[];
  output: {
    windsurf: boolean;
    cursor: boolean;
    customPath?: string;
  };
  template?: {
    header?: string;
    fileHeader?: string;
    separator?: string;
  };
}

function generateRules(options: GenerateOptions): Promise<void>;
```

### 4. Default Behavior
- If no config file is found, looks for:
  - README.md
  - docs/*.md
  - CONTRIBUTING.md
  - CODE_OF_CONDUCT.md
- Outputs to:
  - .windsurfrules
  - .cursorrules
- Uses default templates:
  - File headers: "# From {fileName}:"
  - Separator: "\n---\n"

## Package Structure
```
airule/
├── bin/
│   └── airule.js       # CLI entry point
├── src/
│   ├── index.ts        # Main API
│   ├── cli.ts          # CLI implementation
│   ├── config.ts       # Config loading/validation
│   ├── generator.ts    # Rule generation logic
│   └── types.ts        # TypeScript types
├── package.json
└── README.md
```

## Dependencies
- `commander` - CLI argument parsing
- `glob` - File pattern matching
- `cosmiconfig` - Config file loading
- TypeScript for development

## Development Guidelines
1. Zero runtime dependencies (except CLI tools)
2. Full TypeScript support
3. Comprehensive tests
4. Clear error messages
5. Detailed documentation

## Example Usage

### Basic Project
```bash
npm install --save-dev airule
npx airule generate
```

### Custom Configuration
```json
{
  "sources": [
    "README.md",
    "docs/architecture.md",
    "CONTRIBUTING.md"
  ],
  "output": {
    "windsurf": true,
    "cursor": true,
    "customPath": "custom-rules.txt"
  }
}
```

### Programmatic Usage
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

## Future Enhancements
1. Watch mode for automatic regeneration
2. Custom rule extractors
3. Rule validation
4. Integration with popular documentation tools
5. Support for non-markdown sources

## License
MIT
