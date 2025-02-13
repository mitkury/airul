# Airul Architecture Specification

## Overview
Airul consists of a CLI tool and VSCode extension that share core functionality for generating AI rules from documentation.

## Structure

1. core/ - Shared functionality
   - Config management
   - Rule generation
   - Type definitions
   - Used locally by both packages

2. cli/ - Command line tool (current airul)
   - Project initialization
   - Manual rule generation
   - References core package

3. vscode/ - VSCode extension
   - Auto-activation on .airul.json
   - Real-time rule generation
   - References core package

## Features

### CLI
- Initialize projects (`airul init`)
- Generate rules (`airul generate`)
- Create new projects (`airul new`)

### VSCode Extension
- Automatic activation when .airul.json exists
- Watch mode: regenerate rules on file changes
- Quick commands for init/generate
- Status bar indicators

## Development Guidelines

1. Keep core logic in core/ 
   - Platform-independent
   - Minimal dependencies
   - Strong types

2. CLI and extension should:
   - Focus on their platform's UX
   - Handle errors gracefully
   - Provide clear feedback

## Implementation Plan

1. Extract core functionality
2. Set up workspace structure
3. Create basic extension
4. Polish and test

## Future Ideas
- Support for other IDEs
- Rule validation tools 