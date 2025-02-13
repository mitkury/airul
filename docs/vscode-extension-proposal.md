# VSCode Extension Proposal

> This is a proposal for extending Airul with a VSCode extension. The current implementation is CLI-only.

## Overview
Airul currently exists as a CLI tool. This proposal outlines how we could extend it with a VSCode extension while sharing core functionality for generating AI rules from documentation.

## Proposed Structure

1. core/ - Shared functionality (future)
   - Config management
   - Rule generation
   - Type definitions
   - Used locally by both packages

2. cli/ - Command line tool (existing)
   - Project initialization
   - Manual rule generation
   - Will reference core package

3. vscode/ - VSCode extension (proposed)
   - Auto-activation on .airul.json
   - Real-time rule generation
   - Will reference core package

## Features

### Existing CLI
- Initialize projects (`airul init`)
- Generate rules (`airul generate`)
- Create new projects (`airul new`)

### Proposed VSCode Extension
- Automatic activation when .airul.json exists
- Watch mode: regenerate rules on file changes
- Quick commands for init/generate
- Status bar indicators

## Development Guidelines

1. Core logic should move to core/ 
   - Platform-independent
   - Minimal dependencies
   - Strong types

2. CLI and extension should:
   - Focus on their platform's UX
   - Handle errors gracefully
   - Provide clear feedback

## Implementation Plan

1. Extract core functionality from CLI
2. Set up workspace structure
3. Create basic extension
4. Polish and test

## Future Ideas
- Support for other IDEs
- Rule validation tools 