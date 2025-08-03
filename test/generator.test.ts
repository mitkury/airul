import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir, copyFile } from './utils';
import { generateRules } from '../src/generator';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { initProject } from '../src/init';
import fs from 'fs/promises';
import { getEditorOptions } from '../src/utils';
import path from 'path';

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

    // Update config to use our test file
    const configPath = join(testDir, '.airul.json');
    await writeFile(configPath, JSON.stringify({
      sources: ['test-rules.md'],
      output: {
        windsurf: true,
        cursor: true
      }
    }));

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

    expect(result.success).toBe(true);

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

    expect(result.success).toBe(true);

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

    expect(result.success).toBe(true);

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

    expect(result.success).toBe(true);

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

    expect(result.success).toBe(true);

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
      console.log('Generate result:', result.success);

      expect(result.success).toBe(true);

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

  it('should generate rules from README.md and docs/dev/rules-for-ai.md', async () => {
    // Create test files and directories
    await createDir(join(testDir, 'docs', 'dev'));
    
    // Create README.md
    const readmeContent = '# Test Project\nThis is a test README';
    await writeFile(join(testDir, 'README.md'), readmeContent);
    
    // Create rules-for-ai.md
    const rulesContent = '# AI Rules\nThese are test rules';
    await writeFile(join(testDir, 'docs', 'dev', 'rules-for-ai.md'), rulesContent);

    // Create .airul.json with the same config as user
    const config = {
      sources: [
        'README.md',
        'docs/dev/rules-for-ai.md'
      ],
      output: {
        windsurf: true,
        cursor: true
      }
    };
    await writeFile(join(testDir, '.airul.json'), JSON.stringify(config, null, 2));

    // Generate rules
    const result = await generateRules({
      baseDir: testDir,
      ...config
    });

    expect(result.success).toBe(true);

    // Verify output files exist and contain content from both sources
    const windsurfRules = await readFile(join(testDir, '.windsurfrules'), 'utf8');
    const cursorRules = await readFile(join(testDir, '.cursorrules'), 'utf8');

    // Should contain content from both files
    expect(windsurfRules).toContain('Test Project');
    expect(windsurfRules).toContain('AI Rules');
    expect(cursorRules).toContain('Test Project');
    expect(cursorRules).toContain('AI Rules');
  });

  it('should handle missing files and still generate rules from available ones', async () => {
    // Create test files and directories
    await createDir(join(testDir, 'docs', 'dev'));
    
    // Create README.md
    const readmeContent = '# Test Project\nThis is a test README';
    await writeFile(join(testDir, 'README.md'), readmeContent);
    
    // Note: intentionally not creating rules-for-ai.md to test missing file case
    
    // Create .airul.json with both existing and non-existing files
    const config = {
      sources: [
        'README.md',
        'docs/dev/rules-for-ai.md', // This file won't exist
        'non-existent.md'           // This file won't exist
      ],
      output: {
        windsurf: true,
        cursor: true
      }
    };
    await writeFile(join(testDir, '.airul.json'), JSON.stringify(config, null, 2));

    // Generate rules
    const result = await generateRules({
      baseDir: testDir,
      ...config
    });

    expect(result.success).toBe(true);

    // Verify files were generated with available content
    const windsurfRules = await readFile(join(testDir, '.windsurfrules'), 'utf8');
    const cursorRules = await readFile(join(testDir, '.cursorrules'), 'utf8');
    
    // Should contain content from README.md
    expect(windsurfRules).toContain('Test Project');
    expect(cursorRules).toContain('Test Project');
    
    // Should have same content in both files
    expect(windsurfRules).toBe(cursorRules);
  });

  it('should update rules when docs are modified', async () => {
    // Step 1: Initial setup with proper initialization
    await createDir(join(testDir, 'docs'));
    
    // Create initial README.md
    const initialContent = '# Test Project\nInitial content';
    await writeFile(join(testDir, 'README.md'), initialContent);
    
    // Initialize project first
    const initResult = await initProject(testDir);
    expect(initResult.configCreated).toBe(true);
    expect(initResult.taskCreated).toBe(true);

    // Update config to include our README.md
    const config = {
      sources: ['README.md', 'TODO-AI.md'], // Include both files
      output: {
        windsurf: true,
        cursor: true
      }
    };
    await writeFile(join(testDir, '.airul.json'), JSON.stringify(config, null, 2));

    // Generate rules first time
    const result1 = await generateRules({
      baseDir: testDir,
      ...config
    });

    expect(result1.success).toBe(true);

    // Verify initial content
    const initialWindsurfRules = await readFile(join(testDir, '.windsurfrules'), 'utf8');
    const initialCursorRules = await readFile(join(testDir, '.cursorrules'), 'utf8');
    expect(initialWindsurfRules).toContain('Initial content');
    expect(initialCursorRules).toContain('Initial content');

    // Step 2: Modify docs
    const updatedContent = '# Test Project\nUpdated content\nNew section added';
    await writeFile(join(testDir, 'README.md'), updatedContent);

    // Generate rules again
    const result2 = await generateRules({
      baseDir: testDir,
      ...config
    });

    expect(result2.success).toBe(true);

    // Verify content was updated
    const updatedWindsurfRules = await readFile(join(testDir, '.windsurfrules'), 'utf8');
    const updatedCursorRules = await readFile(join(testDir, '.cursorrules'), 'utf8');
    
    // Should contain new content
    expect(updatedWindsurfRules).toContain('Updated content');
    expect(updatedWindsurfRules).toContain('New section added');
    expect(updatedCursorRules).toContain('Updated content');
    expect(updatedCursorRules).toContain('New section added');
    
    // Should not contain old content
    expect(updatedWindsurfRules).not.toContain('Initial content');
    expect(updatedCursorRules).not.toContain('Initial content');

    // Should still contain TODO-AI.md content
    expect(updatedWindsurfRules).toContain('AI Workspace');
    expect(updatedCursorRules).toContain('AI Workspace');
  });

  it('should only show user-specified sources in status', async () => {
    // Initialize project first (which creates TODO-AI.md)
    await initProject(testDir);

    // Create test files
    const readmeContent = '# Test Project\nThis is a test README';
    await writeFile(join(testDir, 'README.md'), readmeContent);

    // Generate rules with specific sources
    const result = await generateRules({
      baseDir: testDir,
      sources: ['README.md'], // Only specify README.md
      output: { cursor: true }
    });

    expect(result.success).toBe(true);

    // Verify rules were generated
    const cursorRules = await readFile(join(testDir, '.cursorrules'), 'utf8');
    expect(cursorRules).toContain('Test Project');

    // Verify status only shows README.md
    const processedFiles = result.processedFiles;
    expect(processedFiles.size).toBe(1);
    expect(processedFiles.has('README.md')).toBe(true);
    expect(processedFiles.get('README.md')).toBe(true);
    expect(processedFiles.has('TODO-AI.md')).toBe(false);
  });

  it('should respect sources from config without merging with defaults', async () => {
    // Initialize project first
    await initProject(testDir);

    // Create test files
    const readmeContent = '# Test Project\nThis is a test README';
    await writeFile(join(testDir, 'README.md'), readmeContent);

    // Update config to only include README.md
    const configPath = join(testDir, '.airul.json');
    const config = {
      sources: ['README.md'], // Only README.md, no TODO-AI.md
      output: {
        cursor: true,
        windsurf: true
      }
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));

    // Generate rules without specifying sources
    const result = await generateRules({
      baseDir: testDir,
      output: { cursor: true }
    });

    expect(result.success).toBe(true);

    // Verify rules were generated
    const cursorRules = await readFile(join(testDir, '.cursorrules'), 'utf8');
    expect(cursorRules).toContain('Test Project');

    // Verify status only shows README.md
    const processedFiles = result.processedFiles;
    expect(processedFiles.size).toBe(1);
    expect(processedFiles.has('README.md')).toBe(true);
    expect(processedFiles.get('README.md')).toBe(true);
    expect(processedFiles.has('TODO-AI.md')).toBe(false);

    // Verify content doesn't include TODO-AI.md
    expect(cursorRules).not.toContain('AI Workspace');
  });

  it('should generate Copilot instructions when Copilot flag is enabled', async () => {
    // Test both --copilot and --code flags
    for (const options of [{ copilot: true }, { code: true }]) {
      // Create test directory and config
      const testDir = join(TEST_DIRS.GENERATOR, 'copilot-test-' + Math.random().toString(36).substring(7));
      await createDir(testDir);

      // Create test file
      const testFile = join(testDir, 'test-rules.md');
      await writeFile(join(testDir, '.airul.json'), JSON.stringify({
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
      console.log('Generate result:', result.success);

      expect(result.success).toBe(true);

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

  it('should generate Claude.md when Claude flag is enabled', async () => {
    // Create test directory and config
    const testDir = join(TEST_DIRS.GENERATOR, 'claude-test-' + Math.random().toString(36).substring(7));
    await createDir(testDir);

    // Create test file
    const testFile = join(testDir, 'test-rules.md');
    await writeFile(join(testDir, '.airul.json'), JSON.stringify({
      sources: ['test-rules.md'],
      output: {
        cursor: false,
        windsurf: false,
        copilot: false,
        claude: false
      }
    }));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Generate rules with claude flag
    const options = { claude: true };
    console.log('Generating rules with options:', JSON.stringify(options, null, 2));
    const result = await generateRules({
      baseDir: testDir,
      sources: ['test-rules.md'],
      output: getEditorOptions(options)
    });
    console.log('Generate result:', result.success);

    expect(result.success).toBe(true);

    // Verify only Claude.md was created
    const claudeExists = await fs.access(join(testDir, 'CLAUDE.md'))
      .then(() => true)
      .catch(() => false);
    const cursorExists = await fs.access(join(testDir, '.cursorrules'))
      .then(() => true)
      .catch(() => false);
    const windsurfExists = await fs.access(join(testDir, '.windsurfrules'))
      .then(() => true)
      .catch(() => false);
    const copilotExists = await fs.access(join(testDir, '.github', 'copilot-instructions.md'))
      .then(() => true)
      .catch(() => false);

    console.log('Files created:', {
      claude: claudeExists,
      cursor: cursorExists,
      windsurf: windsurfExists,
      copilot: copilotExists
    });

    expect(claudeExists).toBe(true);
    expect(cursorExists).toBe(false);
    expect(windsurfExists).toBe(false);
    expect(copilotExists).toBe(false);

    // Verify content
    const claudeContent = await readFile(join(testDir, 'CLAUDE.md'), 'utf8');
    expect(claudeContent).toContain('# Test Rules');
    expect(claudeContent).toContain('This is a context for AI editor/agent about the project');
  });

  it('should generate AGENTS.md when codex flag is enabled', async () => {
    // Create test directory and config
    const testDir = join(TEST_DIRS.GENERATOR, 'codex-test-' + Math.random().toString(36).substring(7));
    await createDir(testDir);

    // Create test file
    const testFile = join(testDir, 'test-rules.md');
    await writeFile(join(testDir, '.airul.json'), JSON.stringify({
      sources: ['test-rules.md'],
      output: {
        cursor: false,
        windsurf: false,
        copilot: false,
        claude: false,
        codex: false
      }
    }));
    await copyFile(
      join(__dirname, 'docs', 'test-rules.md'),
      testFile
    );

    // Generate rules with codex flag
    const options = { codex: true };
    console.log('Generating rules with options:', JSON.stringify(options, null, 2));
    const result = await generateRules({
      baseDir: testDir,
      sources: ['test-rules.md'],
      output: getEditorOptions(options)
    });
    console.log('Generate result:', result.success);

    expect(result.success).toBe(true);

    // Verify only AGENTS.md was created
    const codexExists = await fs.access(join(testDir, 'AGENTS.md'))
      .then(() => true)
      .catch(() => false);
    const cursorExists = await fs.access(join(testDir, '.cursorrules'))
      .then(() => true)
      .catch(() => false);
    const windsurfExists = await fs.access(join(testDir, '.windsurfrules'))
      .then(() => true)
      .catch(() => false);
    const copilotExists = await fs.access(join(testDir, '.github', 'copilot-instructions.md'))
      .then(() => true)
      .catch(() => false);
    const claudeExists = await fs.access(join(testDir, 'CLAUDE.md'))
      .then(() => true)
      .catch(() => false);

    console.log('Files created:', {
      codex: codexExists,
      cursor: cursorExists,
      windsurf: windsurfExists,
      copilot: copilotExists,
      claude: claudeExists
    });

    expect(codexExists).toBe(true);
    expect(cursorExists).toBe(false);
    expect(windsurfExists).toBe(false);
    expect(copilotExists).toBe(false);
    expect(claudeExists).toBe(false);

    // Verify content
    const codexContent = await readFile(join(testDir, 'AGENTS.md'), 'utf8');
    expect(codexContent).toContain('# Test Rules');
    expect(codexContent).toContain('This is a context for AI editor/agent about the project');
  });

  it('should generate files in the correct order as specified in sources array', async () => {
    // Create test directory and config
    const testDir = join(TEST_DIRS.GENERATOR, 'order-test-' + Math.random().toString(36).substring(7));
    await createDir(testDir);

    // Create test files in a specific order
    await writeFile(join(testDir, 'first.md'), '# First File\n\nThis should appear first.');
    await writeFile(join(testDir, 'second.md'), '# Second File\n\nThis should appear second.');
    await writeFile(join(testDir, 'third.md'), '# Third File\n\nThis should appear third.');

    // Create config with specific order
    await writeFile(join(testDir, '.airul.json'), JSON.stringify({
      sources: ['second.md', 'first.md', 'third.md'], // Intentionally out of order
      output: {
        cursor: true,
        windsurf: false,
        copilot: false,
        claude: false,
        codex: false
      }
    }));

    // Generate rules
    const result = await generateRules({
      baseDir: testDir,
      sources: ['second.md', 'first.md', 'third.md'],
      output: { cursor: true }
    });

    expect(result.success).toBe(true);

    // Verify .cursorrules was created
    const cursorExists = await fs.access(join(testDir, '.cursorrules'))
      .then(() => true)
      .catch(() => false);
    expect(cursorExists).toBe(true);

    // Verify content order
    const cursorContent = await readFile(join(testDir, '.cursorrules'), 'utf8');
    
    // Check that files appear in the order specified in sources array
    const secondIndex = cursorContent.indexOf('# From second.md:');
    const firstIndex = cursorContent.indexOf('# From first.md:');
    const thirdIndex = cursorContent.indexOf('# From third.md:');
    
    expect(secondIndex).toBeGreaterThan(-1);
    expect(firstIndex).toBeGreaterThan(-1);
    expect(thirdIndex).toBeGreaterThan(-1);
    
    // Verify order: second should come before first, first should come before third
    expect(secondIndex).toBeLessThan(firstIndex);
    expect(firstIndex).toBeLessThan(thirdIndex);
    
    // Verify content is present
    expect(cursorContent).toContain('This should appear first.');
    expect(cursorContent).toContain('This should appear second.');
    expect(cursorContent).toContain('This should appear third.');
  });

  it('should handle glob patterns with alphabetical ordering within the group', async () => {
    // Create test directory and config
    const testDir = join(TEST_DIRS.GENERATOR, 'glob-order-test-' + Math.random().toString(36).substring(7));
    await createDir(testDir);

    // Create a docs directory with files in non-alphabetical order
    await fs.mkdir(join(testDir, 'docs'), { recursive: true });
    await writeFile(join(testDir, 'docs', 'c.md'), '# C File\n\nThis should appear third in docs.');
    await writeFile(join(testDir, 'docs', 'a.md'), '# A File\n\nThis should appear first in docs.');
    await writeFile(join(testDir, 'docs', 'b.md'), '# B File\n\nThis should appear second in docs.');

    // Create other files
    await writeFile(join(testDir, 'first.md'), '# First File\n\nThis should appear first overall.');
    await writeFile(join(testDir, 'last.md'), '# Last File\n\nThis should appear last overall.');

    // Create config with mixed explicit files and glob patterns
    await writeFile(join(testDir, '.airul.json'), JSON.stringify({
      sources: ['first.md', 'docs/*.md', 'last.md'],
      output: {
        cursor: true,
        windsurf: false,
        copilot: false,
        claude: false,
        codex: false
      }
    }));

    // Generate rules
    const result = await generateRules({
      baseDir: testDir,
      sources: ['first.md', 'docs/*.md', 'last.md'],
      output: { cursor: true }
    });

    expect(result.success).toBe(true);

    // Verify .cursorrules was created
    const cursorExists = await fs.access(join(testDir, '.cursorrules'))
      .then(() => true)
      .catch(() => false);
    expect(cursorExists).toBe(true);

    // Verify content order
    const cursorContent = await readFile(join(testDir, '.cursorrules'), 'utf8');
    
    // Check that files appear in the correct order
    const firstIndex = cursorContent.indexOf('# From first.md:');
    const aIndex = cursorContent.indexOf('# From docs/a.md:');
    const bIndex = cursorContent.indexOf('# From docs/b.md:');
    const cIndex = cursorContent.indexOf('# From docs/c.md:');
    const lastIndex = cursorContent.indexOf('# From last.md:');
    
    expect(firstIndex).toBeGreaterThan(-1);
    expect(aIndex).toBeGreaterThan(-1);
    expect(bIndex).toBeGreaterThan(-1);
    expect(cIndex).toBeGreaterThan(-1);
    expect(lastIndex).toBeGreaterThan(-1);
    
    // Verify overall order: first -> docs (alphabetical) -> last
    expect(firstIndex).toBeLessThan(aIndex);
    expect(aIndex).toBeLessThan(bIndex);
    expect(bIndex).toBeLessThan(cIndex);
    expect(cIndex).toBeLessThan(lastIndex);
    
    // Verify content is present
    expect(cursorContent).toContain('This should appear first overall.');
    expect(cursorContent).toContain('This should appear first in docs.');
    expect(cursorContent).toContain('This should appear second in docs.');
    expect(cursorContent).toContain('This should appear third in docs.');
    expect(cursorContent).toContain('This should appear last overall.');
  });
});