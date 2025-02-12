import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir, copyFile } from './utils';
import { generateRules } from '../src/generator';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { initProject } from '../src/init';

describe('generator', () => {
  const testDir = TEST_DIRS.GENERATOR;

  beforeEach(async () => {
    await cleanupTestDir(testDir);
  });

  afterEach(async () => {
    await cleanupTestDir(testDir);
  });

  it('should generate rules from test files', async () => {
    // Create test files
    const testFile = join(testDir, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Initialize project first
    await initProject(testDir);

    // Generate rules
    const result = await generateRules({
      baseDir: testDir,
      sources: ['test-rules.md'],
      output: { 
        windsurf: true, 
        cursor: true,
        customPath: undefined
      }
    });

    expect(result).toBe(true);

    // Verify output files
    const windsurfRules = await readFile(join(testDir, '.windsurfrules'), 'utf8');
    const cursorRules = await readFile(join(testDir, '.cursorrules'), 'utf8');

    expect(windsurfRules).toContain('# Test Rules');
    expect(cursorRules).toContain('# Test Rules');
    expect(windsurfRules).toBe(cursorRules);
  });

  it('should initialize project if not initialized', async () => {
    // Create test files without initializing
    const testFile = join(testDir, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Try to generate rules without config
    const result = await generateRules({
      baseDir: testDir,
      sources: ['test-rules.md'],
      output: { cursor: true }
    });

    expect(result).toBe(true);

    // Verify .airul.json was created
    const configPath = join(testDir, '.airul.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config.sources).toContain('TODO-AI.md');
    expect(config.output.cursor).toBe(true);

    // Verify TODO-AI.md was created
    const todoPath = join(testDir, 'TODO-AI.md');
    const todoContent = await readFile(todoPath, 'utf8');
    expect(todoContent).toContain('# AI Workspace');
  });
}); 