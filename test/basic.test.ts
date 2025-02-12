import { readFile, copyFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { TEST_DIRS, TEST_CONTENT } from './constants';
import { cleanupTestDir, createDir } from './utils';
import { generateRules } from '../src/generator';

describe('basic tests', () => {
  beforeEach(async () => {
    await cleanupTestDir(TEST_DIRS.BASIC);
  });

  afterEach(async () => {
    await cleanupTestDir(TEST_DIRS.BASIC);
  });

  it('should generate rules from a markdown file', async () => {
    // Copy test rules file
    const testFile = join(TEST_DIRS.BASIC, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Generate rules
    await generateRules({
      baseDir: TEST_DIRS.BASIC,
      sources: [join(TEST_DIRS.BASIC, 'test-rules.md')],
      output: { cursor: true }
    });

    // Verify output
    const output = await readFile(join(TEST_DIRS.BASIC, '.cursorrules'), 'utf8');
    expect(output).toContain('# Test Rules');
    expect(output).toContain('## Basic Rules');
    expect(output).toContain('## More Rules');
  });

  it('should handle empty files gracefully', async () => {
    // Create empty file
    const emptyFile = join(TEST_DIRS.BASIC, 'empty.md');
    await createDir(dirname(emptyFile));
    await writeFile(emptyFile, '');

    // Generate rules
    await generateRules({
      baseDir: TEST_DIRS.BASIC,
      sources: [join(TEST_DIRS.BASIC, 'empty.md')],
      output: { cursor: true }
    });

    // Verify no output file is created
    const outputFile = join(TEST_DIRS.BASIC, '.cursorrules');
    let exists = false;
    try {
      await readFile(outputFile);
      exists = true;
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
    }
    expect(exists).toBe(false);
  });

  it('should handle missing files gracefully', async () => {
    // Generate rules with non-existent file
    await generateRules({
      baseDir: TEST_DIRS.BASIC,
      sources: [join(TEST_DIRS.BASIC, 'missing.md')],
      output: { cursor: true }
    });

    // Verify no output file is created
    const outputFile = join(TEST_DIRS.BASIC, '.cursorrules');
    let exists = false;
    try {
      await readFile(outputFile);
      exists = true;
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
    }
    expect(exists).toBe(false);
  });

  it('should generate multiple output files', async () => {
    // Copy test rules file
    const testFile = join(TEST_DIRS.BASIC, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Generate rules
    await generateRules({
      baseDir: TEST_DIRS.BASIC,
      sources: [join(TEST_DIRS.BASIC, 'test-rules.md')],
      output: {
        cursor: true,
        windsurf: true,
        customPath: 'custom-rules.txt'
      }
    });

    // Verify all output files exist and have the same content
    const windsurfOutput = await readFile(join(TEST_DIRS.BASIC, '.windsurfrules'), 'utf8');
    const cursorOutput = await readFile(join(TEST_DIRS.BASIC, '.cursorrules'), 'utf8');
    const customOutput = await readFile(join(TEST_DIRS.BASIC, 'custom-rules.txt'), 'utf8');

    expect(windsurfOutput).toBe(cursorOutput);
    expect(cursorOutput).toBe(customOutput);
    expect(windsurfOutput).toContain('# Test Rules');
  });
});
