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
    expect(config.output.cursor).toBe(true); // Cursor enabled by default
    expect(config.output.windsurf).toBe(false); // Windsurf disabled by default
    expect(config.output.vscode).toBe(false); // VSCode disabled by default

    // Verify TODO-AI.md exists and has correct content
    const todoPath = join(TEST_DIRS.INIT, 'TODO-AI.md');
    const todoContent = await readFile(todoPath, 'utf8');
    expect(todoContent).toContain('# AI Workspace');

    // Verify cursor rules were generated from TODO-AI.md
    const cursorRules = await readFile(join(TEST_DIRS.INIT, '.cursorrules'), 'utf8');
    expect(cursorRules).toContain('AI Workspace');
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

  it('should respect editor flags during initialization', async () => {
    const result = await initProject(TEST_DIRS.INIT, undefined, true, {
      cursor: false,
      windsurf: true,
      vscode: true
    });
    
    expect(result.configCreated).toBe(true);
    
    // Verify editor configuration
    const configPath = join(TEST_DIRS.INIT, '.airul.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config.output.cursor).toBe(false); // Cursor disabled by flag
    expect(config.output.windsurf).toBe(true); // Windsurf enabled by flag
    expect(config.output.vscode).toBe(true); // VSCode enabled by flag
  });

  it('should generate correct rule files based on editor options', async () => {
    // First create a TODO-AI.md file to ensure we have content
    const todoContent = '# Test Project\n\nThis is a test.';
    await writeFile(join(TEST_DIRS.INIT, 'TODO-AI.md'), todoContent);

    const result = await initProject(TEST_DIRS.INIT, undefined, true, {
      cursor: true,
      windsurf: true,
      vscode: false
    });
    
    expect(result.configCreated).toBe(true);
    expect(result.rulesGenerated).toBe(true);
    
    // Verify both rule files were created
    const cursorRules = await readFile(join(TEST_DIRS.INIT, '.cursorrules'), 'utf8');
    const windsurfRules = await readFile(join(TEST_DIRS.INIT, '.windsurfrules'), 'utf8');
    
    // Both should contain the initial content
    expect(cursorRules).toContain('Test Project');
    expect(windsurfRules).toContain('Test Project');
    
    // Content should be identical
    expect(cursorRules).toBe(windsurfRules);
    
    // When only windsurf is enabled
    const windsurfOnlyDir = join(TEST_DIRS.INIT, 'windsurf-only');
    await createDir(windsurfOnlyDir);
    // Create TODO-AI.md in the windsurf-only directory too
    await writeFile(join(windsurfOnlyDir, 'TODO-AI.md'), todoContent);
    
    await initProject(windsurfOnlyDir, undefined, true, {
      cursor: false,
      windsurf: true,
      vscode: false
    });
    
    // Should have windsurfrules but not cursorrules
    await expect(readFile(join(windsurfOnlyDir, '.windsurfrules'), 'utf8')).resolves.toBeDefined();
    await expect(readFile(join(windsurfOnlyDir, '.cursorrules'), 'utf8')).rejects.toThrow();
  });
});
