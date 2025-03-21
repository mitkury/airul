import { readFile, writeFile, unlink } from 'fs/promises';
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
    expect(config.output.copilot).toBe(false); // Copilot disabled by default

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
    const result2 = await generateRules({ baseDir: TEST_DIRS.INIT });
    expect(result2.success).toBe(true);
    expect(result2.processedFiles.get('TODO-AI.md')).toBe(true);
    
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
      copilot: false
    });
    
    expect(result.configCreated).toBe(true);
    
    // Verify editor configuration
    const configPath = join(TEST_DIRS.INIT, '.airul.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config.output.cursor).toBe(false); // Cursor disabled by flag
    expect(config.output.windsurf).toBe(true); // Windsurf enabled by flag
    expect(config.output.copilot).toBe(false); // Copilot disabled by flag
  });

  it('should generate correct rule files based on editor options', async () => {
    const todoContent = '# Test Project\n\nThis is a test.';
    await writeFile(join(TEST_DIRS.INIT, 'TODO-AI.md'), todoContent);

    // Delete any existing .airul.json file to ensure a fresh test
    try {
      await unlink(join(TEST_DIRS.INIT, '.airul.json'));
    } catch (error) {
      // Ignore errors if file doesn't exist
    }

    const result = await initProject(TEST_DIRS.INIT, undefined, true, {
      cursor: true,
      windsurf: true,
      copilot: true
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
      copilot: false
    });
    
    // Should have windsurfrules but not cursorrules
    await expect(readFile(join(windsurfOnlyDir, '.windsurfrules'), 'utf8')).resolves.toBeDefined();
    await expect(readFile(join(windsurfOnlyDir, '.cursorrules'), 'utf8')).rejects.toThrow();
  });

  it('should generate Copilot instructions when enabled', async () => {
    // Create test content
    const todoContent = '# Test Project\n\nThis is a test project with specific conventions.';
    await writeFile(join(TEST_DIRS.INIT, 'TODO-AI.md'), todoContent);

    // Delete any existing .airul.json file to ensure a fresh test
    try {
      await unlink(join(TEST_DIRS.INIT, '.airul.json'));
    } catch (error) {
      // Ignore errors if file doesn't exist
    }

    const result = await initProject(TEST_DIRS.INIT, undefined, true, {
      cursor: false,
      windsurf: false,
      copilot: true,
      claude: false
    });
    
    expect(result.configCreated).toBe(true);
    expect(result.rulesGenerated).toBe(true);

    // Verify Copilot instructions were created
    const copilotInstructions = await readFile(join(TEST_DIRS.INIT, '.github', 'copilot-instructions.md'), 'utf8');
    
    // Check content
    expect(copilotInstructions).toContain('Test Project');
    expect(copilotInstructions).toContain('This is a test project with specific conventions');
    expect(copilotInstructions).toContain('This is a context for AI editor/agent about the project');
  });

  it('should generate Claude instructions when enabled', async () => {
    // Create test content
    const todoContent = '# Test Project\n\nThis is a test project with Claude support.';
    await writeFile(join(TEST_DIRS.INIT, 'TODO-AI.md'), todoContent);

    // Delete any existing .airul.json file to ensure a fresh test
    try {
      await unlink(join(TEST_DIRS.INIT, '.airul.json'));
    } catch (error) {
      // Ignore errors if file doesn't exist
    }

    const result = await initProject(TEST_DIRS.INIT, undefined, true, {
      cursor: false,
      windsurf: false,
      copilot: false,
      claude: true
    });
    
    expect(result.configCreated).toBe(true);
    expect(result.rulesGenerated).toBe(true);

    // Verify Claude instructions were created
    const claudeInstructions = await readFile(join(TEST_DIRS.INIT, 'CLAUDE.md'), 'utf8');
    
    // Check content
    expect(claudeInstructions).toContain('Test Project');
    expect(claudeInstructions).toContain('This is a test project with Claude support');
    expect(claudeInstructions).toContain('This is a context for AI editor/agent about the project');
  });
});
