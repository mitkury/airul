import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir, copyFile } from './utils';
import { generateRules } from '../src/generator';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';

describe('generator', () => {
  beforeEach(async () => {
    await cleanupTestDir(TEST_DIRS.BASIC);
  });

  afterEach(async () => {
    await cleanupTestDir(TEST_DIRS.BASIC);
  });

  it('should generate rules from test files', async () => {
    // Create test files
    const testFile = join(TEST_DIRS.BASIC, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Generate rules
    const result = await generateRules({
      baseDir: TEST_DIRS.BASIC,
      sources: ['test-rules.md'],
      output: { windsurf: true, cursor: true }
    });

    expect(result).toBe(true);

    // Verify output files
    const windsurfRules = await readFile(join(TEST_DIRS.BASIC, '.windsurfrules'), 'utf8');
    const cursorRules = await readFile(join(TEST_DIRS.BASIC, '.cursorrules'), 'utf8');

    expect(windsurfRules).toContain('# Test Rules');
    expect(cursorRules).toContain('# Test Rules');
    expect(windsurfRules).toBe(cursorRules);
  });
}); 