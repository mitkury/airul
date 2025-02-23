# Glob Pattern Issues in Airul

## Context
Airul is a tool that generates context for AI agents from documentation files. It uses glob patterns to find and process files. The core functionality is in `src/generator.ts`, which handles finding files and generating AI rules from them.

## Current Problem
The glob pattern handling is not working correctly in the workflow tests. Specifically:

1. Test Failure:
   - Test: `test/workflow.test.ts`
   - Pattern: `docs/*.md`
   - Expected: Should find `docs/guide.md`
   - Actual: File is not being found/included in the output

2. Test Setup:
   ```typescript
   // Files created in test:
   await writeFile('README.md', readmeContent);
   await createDir('docs');
   await writeFile(join('docs', 'guide.md'), docsContent);

   // Config used:
   const updatedConfig = {
     sources: [
       'README.md',
       'docs/*.md',
       'non-existent.md'
     ],
     output: { cursor: true }
   };
   ```

## Attempted Solutions

1. Using `cwd` option in glob:
   ```typescript
   const matches = await glob(normalizedPattern, {
     cwd: baseDir,
     nodir: true,
     dot: true,
     follow: true,
     absolute: false
   });
   ```
   Result: Files still not found

2. Normalizing paths:
   ```typescript
   const normalized = path.normalize(file);
   if (!seen.has(normalized)) {
     seen.add(normalized);
     result.push(normalized);
     fileStatuses.set(normalized, { included: true });
   }
   ```
   Result: Paths normalized but files still not found

3. Modifying file tracking:
   ```typescript
   const allFiles = new Set([...result, ...sources]);
   for (const file of Array.from(allFiles).sort()) {
     const status = fileStatuses.get(file);
     if (status) {
       const mark = status.included ? '✓' : '✗';
       console.log(`${mark} ${file}${status.error ? ` (${status.error})` : ''}`);
     }
   }
   ```
   Result: Better output but core issue remains

## Key Observations

1. The test environment:
   - Tests run in a temporary directory (`test/__test_outputs__/workflow/multi-step`)
   - Files are created using relative paths
   - Process working directory is changed to test directory

2. File Path Handling:
   - Paths in config are relative (`docs/*.md`)
   - Files are created with relative paths
   - `baseDir` is set to the test directory
   - Multiple path normalization steps may be interfering

3. Glob Behavior:
   - Glob seems to work for top-level files (`README.md`)
   - Issues specifically with subdirectory patterns (`docs/*.md`)
   - Pattern normalization may be affecting subdirectory matching

## Suggestions for Next Steps

1. Debug Path Resolution:
   - Add logging to print absolute paths at each step
   - Verify `process.cwd()` matches expected test directory
   - Check if `baseDir` is correctly passed through

2. Test Glob Patterns Directly:
   - Create a simple test case just for glob pattern matching
   - Try different glob pattern formats (`**/docs/*.md`, `./docs/*.md`)
   - Test with absolute vs relative paths

3. Consider Alternative Approaches:
   - Try using different glob implementation (globby, fast-glob)
   - Consider recursive directory scanning instead of glob
   - Look into using path.resolve() before glob matching

4. Test Environment:
   - Verify test directory structure after creation
   - Check file permissions
   - Consider platform-specific path issues (Windows vs Unix)

## Related Files

1. Main Implementation:
   - `src/generator.ts`: Contains glob pattern handling
   - `src/cli.ts`: CLI command handling
   - `src/types.ts`: Type definitions

2. Tests:
   - `test/workflow.test.ts`: Main failing test
   - `test/generator.test.ts`: Generator-specific tests
   - `test/constants.ts`: Test constants and paths

## Current State
The code is in a state where it correctly handles top-level files but fails to properly handle subdirectory glob patterns. The file tracking and output formatting work, but the core glob pattern matching needs to be fixed. 