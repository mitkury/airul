import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir, copyFile } from './utils';
import { generateRules } from '../src/generator';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { initProject } from '../src/init';
import fs from 'fs/promises';
import { getEditorOptions } from '../src/utils';

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

  it('should generate Copilot instructions', async () => {
    // Create test files
    const testFile = join(testDir, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Initialize project first with only Copilot enabled
    await initProject(testDir, undefined, true, {
      cursor: false,
      windsurf: false,
      copilot: true
    });

    // Generate rules with Copilot enabled
    const result = await generateRules({
      baseDir: testDir,
      sources: ['test-rules.md'],
      output: { 
        windsurf: false, 
        cursor: false,
        copilot: true
      }
    });

    expect(result).toBe(true);

    // Verify Copilot instructions were created
    const copilotInstructions = await readFile(join(testDir, '.github', 'copilot-instructions.md'), 'utf8');
    
    // Check content from test file
    expect(copilotInstructions).toContain('# Test Rules');
    expect(copilotInstructions).toContain('This is a context for AI editor/agent about the project');

    // Verify other rule files were not created
    await expect(fs.access(join(testDir, '.cursorrules'))).rejects.toThrow();
    await expect(fs.access(join(testDir, '.windsurfrules'))).rejects.toThrow();
  });

  it('should respect config file settings when no flags are provided', async () => {
    // Create test files
    const testFile = join(testDir, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Create config with windsurf disabled
    const configPath = join(testDir, '.airul.json');
    await writeFile(configPath, JSON.stringify({
      sources: ['test-rules.md'],
      output: {
        cursor: true,
        windsurf: false
      }
    }));

    // Generate rules without flags
    const result = await generateRules({
      baseDir: testDir,
      sources: ['test-rules.md']
    });

    expect(result).toBe(true);

    // Verify only cursor rules were created
    const cursorRulesExists = await fs.access(join(testDir, '.cursorrules'))
      .then(() => true)
      .catch(() => false);
    const windsurfRulesExists = await fs.access(join(testDir, '.windsurfrules'))
      .then(() => true)
      .catch(() => false);

    expect(cursorRulesExists).toBe(true);
    expect(windsurfRulesExists).toBe(false);
  });

  it('should allow enabling outputs via flags', async () => {
    // Create test files
    const testFile = join(testDir, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Create config with both disabled
    const configPath = join(testDir, '.airul.json');
    await writeFile(configPath, JSON.stringify({
      sources: ['test-rules.md'],
      output: {
        cursor: false,
        windsurf: false
      }
    }));

    // Generate rules with windsurf flag
    const result = await generateRules({
      baseDir: testDir,
      sources: ['test-rules.md'],
      output: {
        windsurf: true
      }
    });

    expect(result).toBe(true);

    // Verify only windsurf rules were created
    const cursorRulesExists = await fs.access(join(testDir, '.cursorrules'))
      .then(() => true)
      .catch(() => false);
    const windsurfRulesExists = await fs.access(join(testDir, '.windsurfrules'))
      .then(() => true)
      .catch(() => false);

    expect(cursorRulesExists).toBe(false);
    expect(windsurfRulesExists).toBe(true);
  });

  it('should handle copilot and code flags', async () => {
    // Create test files
    const testFile = join(testDir, 'test-rules.md');
    await createDir(dirname(testFile));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Create config with everything disabled
    const configPath = join(testDir, '.airul.json');
    await writeFile(configPath, JSON.stringify({
      sources: ['test-rules.md'],
      output: {
        cursor: false,
        windsurf: false,
        copilot: false
      }
    }));

    // Test both --copilot and --code flags
    const testCases = [
      { copilot: true },
      { code: true }
    ];

    for (const options of testCases) {
      // Clean up from previous iteration
      await cleanupTestDir(testDir);
      await writeFile(configPath, JSON.stringify({
        sources: ['test-rules.md'],
        output: {
          cursor: false,
          windsurf: false,
          copilot: false
        }
      }));
      await copyFile(
        join(__dirname, 'docs', 'test-rules.md'),
        testFile
      );

      // Generate rules with flag
      console.log('Generating rules with options:', JSON.stringify(options, null, 2));
      const result = await generateRules({
        baseDir: testDir,
        sources: ['test-rules.md'],
        output: getEditorOptions(options)
      });
      console.log('Generate result:', result);

      expect(result).toBe(true);

      // Verify only copilot instructions were created
      const copilotExists = await fs.access(join(testDir, '.github', 'copilot-instructions.md'))
        .then(() => true)
        .catch(() => false);
      const cursorExists = await fs.access(join(testDir, '.cursorrules'))
        .then(() => true)
        .catch(() => false);
      const windsurfExists = await fs.access(join(testDir, '.windsurfrules'))
        .then(() => true)
        .catch(() => false);

      console.log('Files created:', {
        copilot: copilotExists,
        cursor: cursorExists,
        windsurf: windsurfExists
      });

      expect(copilotExists).toBe(true);
      expect(cursorExists).toBe(false);
      expect(windsurfExists).toBe(false);

      // Verify content
      const copilotContent = await readFile(join(testDir, '.github', 'copilot-instructions.md'), 'utf8');
      expect(copilotContent).toContain('# Test Rules');
      expect(copilotContent).toContain('This is a context for AI editor/agent about the project');
    }
  });
});
