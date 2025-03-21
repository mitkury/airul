import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir } from './utils';
import { execSync } from 'child_process';
import { readdir } from 'fs/promises';

// Helper function to run CLI commands
async function runCli(command: string): Promise<string> {
  try {
    // Get project root directory (two levels up from test directory)
    const projectRoot = join(__dirname, '..');
    
    // Run the CLI command from the test directory but using the project's dist
    const output = execSync(`node ${join(projectRoot, 'dist', 'cli.js')} ${command}`, {
      encoding: 'utf8',
      cwd: process.cwd(), // Keep the current working directory for the command
      stdio: ['inherit', 'pipe', 'pipe'] // Capture stdout and stderr
    });
    return output;
  } catch (error: any) {
    return error.stdout || error.message;
  }
}

describe('workflow', () => {
  const testDir = join(TEST_DIRS.WORKFLOW, 'multi-step');
  
  // Build once before all tests
  beforeAll(async () => {
    // Get project root directory (two levels up from test directory)
    const projectRoot = join(__dirname, '..');
    execSync('npm run build', { stdio: 'ignore', cwd: projectRoot });
  });
  
  beforeEach(async () => {
    await cleanupTestDir(testDir);
    await createDir(testDir);
    process.chdir(testDir); // Change to test directory
  });

  afterEach(async () => {
    await cleanupTestDir(testDir);
  });

  it('should handle multi-step workflow: init -> config change -> generate -> verify', async () => {
    // Step 1: Initialize project using CLI
    const initOutput = await runCli('init');
    expect(initOutput).toContain('Airul initialized successfully');

    // Verify initial state
    const configPath = join(testDir, '.airul.json');
    const initialConfig = JSON.parse(await readFile(configPath, 'utf8'));
    expect(initialConfig.sources).toContain('TODO-AI.md');
    
    // Create some test files
    const readmeContent = '# Test Project\nThis is a test README';
    const docsContent = '# Documentation\nThis is test documentation';
    await writeFile('README.md', readmeContent); // Use relative paths
    await createDir('docs');
    await writeFile(join('docs', 'guide.md'), docsContent);

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
    await writeFile('.airul.json', JSON.stringify(updatedConfig, null, 2));

    // Step 3: Generate rules with new config using CLI
    const genOutput = await runCli('generate');
    expect(genOutput).toContain('Files for AI context');
    expect(genOutput).toContain('✓ README.md');
    expect(genOutput).toContain('✓ docs/guide.md');
    expect(genOutput).toContain('✗ non-existent.md');
    expect(genOutput).toContain('✅ AI context files generated successfully');

    // Step 4: Verify cursor rules content
    const cursorRules = await readFile('.cursorrules', 'utf8');
    
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
    // Step 1: Initialize project using CLI
    const initOutput = await runCli('init');
    expect(initOutput).toContain('Airul initialized successfully');

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

    // Generate initial rules using CLI
    const genOutput = await runCli('generate');
    expect(genOutput).toContain('Files for AI context');
    expect(genOutput).toContain('✓ README.md');
    expect(genOutput).toContain('✓ docs/guide.md');
    expect(genOutput).toContain('✅ AI context files generated successfully');

    const initialRules = await readFile(join(testDir, '.cursorrules'), 'utf8');
    expect(initialRules).toContain('Initial Project');
    expect(initialRules).toContain('Initial Guide');

    // Step 2: Modify file contents
    const updatedReadme = '# Updated Project\nSecond version with new features';
    const updatedGuide = '# Updated Guide\nRevised documentation with examples';
    await writeFile(readmePath, updatedReadme);
    await writeFile(guidePath, updatedGuide);

    // Step 3: Generate rules again using CLI
    const regenOutput = await runCli('gen'); // Testing alias
    expect(regenOutput).toContain('Files for AI context');
    expect(regenOutput).toContain('✓ README.md');
    expect(regenOutput).toContain('✓ docs/guide.md');
    expect(regenOutput).toContain('✅ AI context files generated successfully');

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

  it('should generate rules and verify output', async () => {
    // Step 1: Initialize project using CLI
    const initOutput = await runCli('init');
    expect(initOutput).toContain('Airul initialized successfully');

    // Create test files
    await writeFile(join(testDir, 'README.md'), '# Test Project\nThis is a test project.');
    await createDir(join(testDir, 'docs'));
    await writeFile(join(testDir, 'docs', 'guide.md'), '# Guide\nThis is a guide.');

    // Update config to include our test files
    const configPath = join(testDir, '.airul.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    const updatedConfig = {
      ...config,
      sources: ['README.md', 'docs/*.md'],
      output: { cursor: true }
    };
    await writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
    
    // Generate rules and verify output
    const genOutput = await runCli('generate');
    expect(genOutput).toContain('Files for AI context');
    expect(genOutput).toContain('✓ README.md');
    expect(genOutput).toContain('✓ docs/guide.md');
    expect(genOutput).toContain('✅ AI context files generated successfully');
    
    // Verify output files were created
    const outputFiles = await readdir(testDir);
    expect(outputFiles).toContain('.cursorrules');
    expect(outputFiles).toContain('.airul.json');
    expect(outputFiles).toContain('README.md');
    expect(outputFiles).toContain('docs');
    
    // Verify docs directory
    const docsFiles = await readdir(join(testDir, 'docs'));
    expect(docsFiles).toContain('guide.md');
  });
}); 