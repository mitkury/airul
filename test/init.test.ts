import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir } from './utils';
import { initProject } from '../src/init';
import { generateRules } from '../src/generator';
import * as fs from 'fs/promises';

describe('init command', () => {
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  beforeEach(async () => {
    await cleanupTestDir(TEST_DIRS.INIT);
    await createDir(TEST_DIRS.INIT);
    process.chdir(TEST_DIRS.INIT);
  });

  it('should create .airul.json and TODO-AI.md in new project', async () => {
    const result = await initProject(TEST_DIRS.INIT, undefined, true);
    
    // Verify result
    expect(result.configCreated).toBe(true);
    expect(result.alreadyInitialized).toBeFalsy();
    expect(result.taskCreated).toBe(true);
    expect(result.rulesGenerated).toBe(true); // Rules should be generated from TODO-AI.md
    
    // Verify config exists and is valid JSON
    const configPath = join(TEST_DIRS.INIT, '.airul.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config).toBeTruthy();
    expect(config.sources).toContain('TODO-AI.md');
    expect(config.output.cursor).toBe(true);
    expect(config.output.windsurf).toBe(false);

    // Verify TODO-AI.md exists and has correct content
    const todoPath = join(TEST_DIRS.INIT, 'TODO-AI.md');
    const todoContent = await readFile(todoPath, 'utf8');
    expect(todoContent).toContain('# AI Task Instructions');
    expect(todoContent).toContain('🆕 Ready for task');

    // Verify cursor rules were generated from TODO-AI.md
    const cursorRules = await readFile(join(TEST_DIRS.INIT, '.cursorrules'), 'utf8');
    expect(cursorRules).toContain('AI Task Instructions');
  });

  it('should generate rules if documentation exists', async () => {
    // Initialize project first
    const result = await initProject(TEST_DIRS.INIT, undefined, true);
    expect(result.configCreated).toBe(true);
    
    // Then create documentation
    await writeFile(join(TEST_DIRS.INIT, 'TODO-AI.md'), '# Test Project\n\nThis is a test.');
    
    // Generate rules again
    const result2 = await generateRules({
      sources: ['TODO-AI.md'],
      output: { windsurf: false, cursor: true },
      baseDir: TEST_DIRS.INIT
    });
    expect(result2).toBe(true);
    
    // Verify cursor rules file was created (windsurf should not be)
    const cursorRules = await readFile(join(TEST_DIRS.INIT, '.cursorrules'), 'utf8');
    expect(cursorRules).toContain('Test Project');
    
    // Verify windsurf rules were not created
    await expect(readFile(join(TEST_DIRS.INIT, '.windsurfrules'), 'utf8'))
      .rejects.toThrow();
  });

  it('should handle already initialized project', async () => {
    // Create existing .airul.json
    const configPath = join(TEST_DIRS.INIT, '.airul.json');
    await writeFile(configPath, '{"existing": true}');

    // Should not throw, just inform it's already initialized
    const result = await initProject(TEST_DIRS.INIT, undefined, true);
    expect(result.alreadyInitialized).toBe(true);
    expect(result.configCreated).toBe(false);

    // Original config should be preserved
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config).toEqual({ existing: true });
  });
});
