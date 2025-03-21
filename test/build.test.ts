import { execSync } from 'child_process';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir } from './utils';
import fs from 'fs/promises';

describe('built package', () => {
  let originalCwd: string;
  let rootDir: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    rootDir = join(__dirname, '..');
    
    // Build the package
    process.chdir(rootDir);
    execSync('npm run build', { stdio: 'inherit' });
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  beforeEach(async () => {
    await cleanupTestDir(TEST_DIRS.INIT);
    await createDir(TEST_DIRS.INIT);
    process.chdir(TEST_DIRS.INIT);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
  });

  it('should run airul init using built package', async () => {
    // Ensure the test directory exists and is clean
    await cleanupTestDir(TEST_DIRS.INIT);
    await createDir(TEST_DIRS.INIT);
    
    // Run the built CLI
    const cliPath = join(rootDir, 'dist', 'cli.js');
    execSync(`node ${cliPath} init`, { 
      stdio: 'inherit',
      cwd: TEST_DIRS.INIT  // Explicitly set the working directory
    });

    // Allow time for file operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify .airul.json was created
    const configPath = join(TEST_DIRS.INIT, '.airul.json');
    
    // Check if file exists before trying to read it
    const fileExists = await fs.access(configPath)
      .then(() => true)
      .catch(() => false);
    
    expect(fileExists).toBe(true);
    
    if (fileExists) {
      const config = JSON.parse(await readFile(configPath, 'utf8'));
      expect(config.sources).toContain('TODO-AI.md');
    }
  });

  it('should run airul new using built package', async () => {
    // Ensure the test directory exists and is clean
    await cleanupTestDir(TEST_DIRS.INIT);
    await createDir(TEST_DIRS.INIT);
    
    const projectName = 'test-project';
    const projectPath = join(TEST_DIRS.INIT, projectName);
    
    // Run the built CLI
    const cliPath = join(rootDir, 'dist', 'cli.js');
    execSync(`node ${cliPath} new ${projectName} "Create a test project"`, { 
      stdio: 'inherit',
      cwd: TEST_DIRS.INIT
    });

    // Allow time for file operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify project was created
    const configPath = join(projectPath, '.airul.json');
    
    // Check if file exists before trying to read it
    const fileExists = await fs.access(configPath)
      .then(() => true)
      .catch(() => false);
    
    expect(fileExists).toBe(true);
    
    if (fileExists) {
      const config = JSON.parse(await readFile(configPath, 'utf8'));
      expect(config.sources).toContain('README.md');
    }
  });

  it('should run airul init with task using built package', async () => {
    // Ensure the test directory exists and is clean
    await cleanupTestDir(TEST_DIRS.INIT);
    await createDir(TEST_DIRS.INIT);
    
    const task = 'Create a React component';
    
    // Run the built CLI
    const cliPath = join(rootDir, 'dist', 'cli.js');
    execSync(`node ${cliPath} init "${task}"`, { 
      stdio: 'inherit',
      cwd: TEST_DIRS.INIT
    });

    // Allow time for file operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify TODO-AI.md was created with task
    const todoPath = join(TEST_DIRS.INIT, 'TODO-AI.md');
    
    // Check if file exists before trying to read it
    const fileExists = await fs.access(todoPath)
      .then(() => true)
      .catch(() => false);
    
    expect(fileExists).toBe(true);
    
    if (fileExists) {
      const todo = await readFile(todoPath, 'utf8');
      expect(todo).toContain(task);
    }
  });
}); 