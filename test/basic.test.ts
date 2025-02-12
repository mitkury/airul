import { readFile, copyFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { TEST_DIRS, TEST_CONTENT } from './constants';
import { cleanupTestDir, createDir } from './utils';
import { generateRules } from '../src/generator';
import { initProject } from '../src/init';

describe('basic tests', () => {
  const testDir = TEST_DIRS.BASIC;

  beforeEach(async () => {
    await cleanupTestDir(testDir);
  });

  it('should generate rules from a markdown file', async () => {
    // Copy test rules file
    const testFile = join(testDir, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Initialize project first
    await initProject(testDir);

    // Generate rules
    await generateRules({
      baseDir: testDir,
      sources: ['test-rules.md'],
      output: { cursor: true }
    });

    // Verify output
    const output = await readFile(join(testDir, '.cursorrules'), 'utf8');
    expect(output).toContain('# Test Rules');
    expect(output).toContain('## Basic Rules');
    expect(output).toContain('## More Rules');
  });

  it('should handle missing files gracefully', async () => {
    // Generate rules with non-existent file
    const result = await generateRules({
      baseDir: testDir,
      sources: ['missing.md'],
      output: { cursor: true }
    });

    // Verify rules were generated (since we initialize)
    const outputFile = join(testDir, '.cursorrules');
    const content = await readFile(outputFile, 'utf8');
    expect(content).toContain('AI Workspace'); // From TODO-AI.md
  });

  it('should generate multiple output files', async () => {
    // Copy test rules file
    const testFile = join(testDir, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Generate rules
    await generateRules({
      baseDir: testDir,
      sources: ['test-rules.md'],
      output: {
        cursor: true,
        windsurf: true,
        customPath: 'custom-rules.txt'
      }
    });

    // Verify all output files exist and have the same content
    const windsurfOutput = await readFile(join(testDir, '.windsurfrules'), 'utf8');
    const cursorOutput = await readFile(join(testDir, '.cursorrules'), 'utf8');
    const customOutput = await readFile(join(testDir, 'custom-rules.txt'), 'utf8');

    expect(windsurfOutput).toBe(cursorOutput);
    expect(cursorOutput).toBe(customOutput);
    expect(windsurfOutput).toContain('# Test Rules');
  });
});
