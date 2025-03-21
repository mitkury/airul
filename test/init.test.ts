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
    // Delete any existing .airul.json file to ensure a fresh test
    try {
      await unlink(join(TEST_DIRS.INIT, '.airul.json'));
    } catch (error) {
      // Ignore errors if file doesn't exist
    }
    
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

  it('should enable editors in an already initialized project', async () => {
    // Create initial configuration with only cursor enabled
    const configPath = join(TEST_DIRS.INIT, '.airul.json');
    const initialConfig = {
      sources: ['README.md', 'TODO-AI.md'],
      output: {
        cursor: true,
        windsurf: false,
        copilot: false,
        cline: false,
        claude: false
      }
    };
    
    await writeFile(configPath, JSON.stringify(initialConfig, null, 2));
    
    // Add a sample README file
    const readmePath = join(TEST_DIRS.INIT, 'README.md');
    await writeFile(readmePath, '# Test Project\n\nThis is a test project.');
    
    // Add a sample TODO-AI.md file
    const todoPath = join(TEST_DIRS.INIT, 'TODO-AI.md');
    await writeFile(todoPath, '# AI Workspace\n\n## Active Task\nTest the editor enabling feature.');
    
    // First, enable Claude using init command
    const initResult = await initProject(TEST_DIRS.INIT, undefined, true, {
      claude: true
    });
    
    // Verify that init updated the configuration but did not create a new one
    expect(initResult.configCreated).toBe(false);
    expect(initResult.configUpdated).toBe(true);
    expect(initResult.alreadyInitialized).toBe(true);
    
    // Verify config was updated correctly
    let updatedConfig = JSON.parse(await readFile(configPath, 'utf8'));
    expect(updatedConfig.output.cursor).toBe(true); // Unchanged
    expect(updatedConfig.output.claude).toBe(true); // Enabled
    expect(updatedConfig.output.windsurf).toBe(false); // Unchanged
    
    // Verify that Claude file was generated
    const claudePath = join(TEST_DIRS.INIT, 'CLAUDE.md');
    const claudeExists = await readFile(claudePath, 'utf8')
      .then(() => true)
      .catch(() => false);
    
    expect(claudeExists).toBe(true);
    
    // Now use generateRules to generate files for Windsurf
    // Note: generateRules doesn't update the config file
    const genResult = await generateRules({
      baseDir: TEST_DIRS.INIT,
      sources: ['README.md', 'TODO-AI.md'],
      output: {
        ...updatedConfig.output,
        windsurf: true
      }
    });
    
    expect(genResult.success).toBe(true);
    
    // Config file should not be changed by generateRules
    updatedConfig = JSON.parse(await readFile(configPath, 'utf8'));
    expect(updatedConfig.output.cursor).toBe(true);
    expect(updatedConfig.output.claude).toBe(true);
    expect(updatedConfig.output.windsurf).toBe(false); // Still false in config
    
    // But Windsurf file should still be generated
    const cursorPath = join(TEST_DIRS.INIT, '.cursorrules');
    const windsurfPath = join(TEST_DIRS.INIT, '.windsurfrules');
    
    const cursorExists = await readFile(cursorPath, 'utf8')
      .then(() => true)
      .catch(() => false);
    
    const windsurfExists = await readFile(windsurfPath, 'utf8')
      .then(() => true)
      .catch(() => false);
    
    expect(cursorExists).toBe(true);
    expect(windsurfExists).toBe(true); // File should be generated even though config wasn't updated
  });
});
