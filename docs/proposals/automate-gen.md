# Automatic Context Updates Proposal

## Problem
Currently, developers need to manually run `airul gen` after making changes to documentation or project structure. This can lead to:
- Outdated AI context files
- Inconsistent AI assistance
- Extra cognitive load on developers to remember to update context

## Proposed Solution
Implement four complementary approaches to ensure AI context stays up-to-date:

1. **NPM Scripts Integration** (Quick Win)
   - Add `airul gen` to common npm lifecycle scripts:
     ```json
     {
       "scripts": {
         "prestart": "airul gen",
         "prebuild": "airul gen",
         "predev": "airul gen",
         "pretest": "airul gen"
       }
     }
     ```
   - Ensures context is fresh before key development activities
   - Zero additional dependencies
   - Works with all Node.js based projects out of the box

2. **Git Hooks Integration**
   - Add pre-commit and post-merge hooks via husky
   - Automatically run `airul gen` when:
     - Documentation files are modified in a commit
     - Project structure changes are detected
     - After merging changes from remote
   - Allow configuration to disable hooks if needed

3. **File System Watcher**
   - Implement a watch mode: `airul watch`
   - Monitor source files specified in `.airul.json`
   - Use debouncing to prevent excessive updates
   - Run `airul gen` automatically when changes are detected
   - Provide CLI options:
     ```bash
     airul watch [--debounce <ms>] [--quiet]
     ```

4. **IDE Integration**
   - VSCode extension
     - Add command palette integration
     - Show status indicator for context freshness
     - Provide quick actions to update context
   - Cursor extension
     - Similar features as VSCode
     - Deeper integration with AI features

## Implementation Plan

### Phase 0: NPM Scripts (Immediate)
1. Update project templates to include airul in common npm scripts
2. Add documentation for manual script integration
3. Add configuration option in `.airul.json`:
   ```json
   {
     "autoUpdate": {
       "npmScripts": {
         "enabled": true,
         "scripts": ["start", "build", "dev", "test"]
       }
     }
   }
   ```

### Phase 1: Git Hooks
1. Add husky as an optional dependency
2. Create hook scripts:
   ```bash
   #!/bin/sh
   files=$(git diff --cached --name-only)
   if echo "$files" | grep -qE '\.md$|\.txt$|\.airul\.json$'; then
     npx airul gen
   fi
   ```
3. Add configuration options in `.airul.json`:
   ```json
   {
     "autoUpdate": {
       "gitHooks": true,
       "preCommit": true,
       "postMerge": true
     }
   }
   ```

### Phase 2: File System Watcher
1. Implement watch mode using `chokidar`
2. Add configuration:
   ```json
   {
     "autoUpdate": {
       "watch": {
         "enabled": false,
         "debounce": 1000,
         "quiet": false
       }
     }
   }
   ```
3. Update CLI to support watch command

### Phase 3: IDE Extensions
1. Create VSCode extension
2. Create Cursor extension
3. Implement status indicators and commands

## Benefits
- Ensures AI context is always up-to-date
- Reduces manual intervention
- Improves developer experience
- Maintains consistency across team
- Simple npm integration provides immediate value

## Considerations
- Performance impact of frequent updates
- Configuration flexibility for different workflows
- Cross-platform compatibility
- Resource usage in watch mode
- Balance between automation and build time impact

## Timeline
- Phase 0: 1-2 days
- Phase 1: 1-2 weeks
- Phase 2: 2-3 weeks
- Phase 3: 3-4 weeks

## Next Steps
1. Implement npm scripts integration
2. Create GitHub issues for each phase
3. Set up project milestones
4. Begin implementation of git hooks
5. Write tests for core functionality
6. Create documentation for new features 