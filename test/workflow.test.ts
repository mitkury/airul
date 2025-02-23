import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir } from './utils';
import { initProject } from '../src/init';
import { generateRules } from '../src/generator';

describe('workflow', () => {
  const testDir = join(TEST_DIRS.WORKFLOW, 'multi-step');
  
  beforeEach(async () => {
    await cleanupTestDir(testDir);
    await createDir(testDir);
    process.chdir(testDir);
  });

  afterEach(async () => {
    await cleanupTestDir(testDir);
  });

  it('should handle multi-step workflow: init -> config change -> generate -> verify', async () => {
    // Step 1: Initialize project
    const initResult = await initProject(testDir);
    expect(initResult.configCreated).toBe(true);
    expect(initResult.taskCreated).toBe(true);

    // Verify initial state
    const configPath = join(testDir, '.airul.json');
    const initialConfig = JSON.parse(await readFile(configPath, 'utf8'));
    expect(initialConfig.sources).toContain('TODO-AI.md');
    
    // Create some test files
    const readmeContent = '# Test Project\nThis is a test README';
    const docsContent = '# Documentation\nThis is test documentation';
    await writeFile(join(testDir, 'README.md'), readmeContent);
    await createDir(join(testDir, 'docs'));
    await writeFile(join(testDir, 'docs', 'guide.md'), docsContent);

    // Step 2: Modify config to include new files
    const updatedConfig = {
      ...initialConfig,
      sources: [
        'README.md',
        'docs/*.md',
        'non-existent.md' // Adding a non-existent file to test error handling
      ],
      output: {
        cursor: true,
        windsurf: false,
        copilot: false
      }
    };
    await writeFile(configPath, JSON.stringify(updatedConfig, null, 2));

    // Step 3: Generate rules with new config
    const genResult = await generateRules({
      baseDir: testDir
    });
    expect(genResult.success).toBe(true);

    // Check file statuses
    expect(genResult.fileStatuses.get('README.md')?.included).toBe(true);
    expect(genResult.fileStatuses.get('docs/guide.md')?.included).toBe(true);
    expect(genResult.fileStatuses.get('non-existent.md')?.included).toBe(false);

    // Step 4: Verify cursor rules content
    const cursorRules = await readFile(join(testDir, '.cursorrules'), 'utf8');
    
    // Should contain content from both files
    expect(cursorRules).toContain('Test Project');
    expect(cursorRules).toContain('Documentation');
    
    // Should have proper structure
    expect(cursorRules).toMatch(/# From README\.md:/);
    expect(cursorRules).toMatch(/# From docs\/guide\.md:/);
    
    // Should not contain non-existent file
    expect(cursorRules).not.toContain('non-existent.md');
  });

  it('should update rules when source files change', async () => {
    // Step 1: Setup initial project with files
    await initProject(testDir);
    const configPath = join(testDir, '.airul.json');
    const readmePath = join(testDir, 'README.md');
    const guidePath = join(testDir, 'docs', 'guide.md');

    // Create initial files
    const initialReadme = '# Initial Project\nFirst version of README';
    const initialGuide = '# Initial Guide\nFirst version of documentation';
    await writeFile(readmePath, initialReadme);
    await createDir(join(testDir, 'docs'));
    await writeFile(guidePath, initialGuide);

    // Configure airul to watch these files
    const config = {
      sources: ['README.md', 'docs/*.md'],
      output: { cursor: true }
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));

    // Generate initial rules
    await generateRules({ baseDir: testDir });
    const initialRules = await readFile(join(testDir, '.cursorrules'), 'utf8');
    expect(initialRules).toContain('Initial Project');
    expect(initialRules).toContain('Initial Guide');

    // Step 2: Modify file contents
    const updatedReadme = '# Updated Project\nSecond version with new features';
    const updatedGuide = '# Updated Guide\nRevised documentation with examples';
    await writeFile(readmePath, updatedReadme);
    await writeFile(guidePath, updatedGuide);

    // Step 3: Generate rules again
    const updateResult = await generateRules({ baseDir: testDir });
    expect(updateResult.success).toBe(true);
    expect(updateResult.fileStatuses.get('README.md')?.included).toBe(true);
    expect(updateResult.fileStatuses.get('docs/guide.md')?.included).toBe(true);

    // Step 4: Verify updated content
    const updatedRules = await readFile(join(testDir, '.cursorrules'), 'utf8');
    
    // Should contain new content
    expect(updatedRules).toContain('Updated Project');
    expect(updatedRules).toContain('new features');
    expect(updatedRules).toContain('Updated Guide');
    expect(updatedRules).toContain('examples');
    
    // Should not contain old content
    expect(updatedRules).not.toContain('Initial Project');
    expect(updatedRules).not.toContain('Initial Guide');
    
    // Structure should be maintained
    expect(updatedRules).toMatch(/# From README\.md:/);
    expect(updatedRules).toMatch(/# From docs\/guide\.md:/);
  });
}); 