import { execSync } from 'child_process';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir } from './utils';

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
    // Run the built CLI
    const cliPath = join(rootDir, 'dist', 'cli.js');
    execSync(`node ${cliPath} init`, { stdio: 'inherit' });

    // Verify .airulrc.json was created
    const configPath = join(TEST_DIRS.INIT, '.airulrc.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config.sources).toContain('README.md');
  });

  it('should run airul new using built package', async () => {
    const projectName = 'test-project';
    const projectPath = join(TEST_DIRS.INIT, projectName);
    
    // Run the built CLI
    const cliPath = join(rootDir, 'dist', 'cli.js');
    execSync(`node ${cliPath} new ${projectName} "Create a test project"`, { stdio: 'inherit' });

    // Verify project was created
    const configPath = join(projectPath, '.airulrc.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config.sources).toContain('README.md');
  });

  it('should run airul init with task using built package', async () => {
    const task = 'Create a React component';
    
    // Run the built CLI
    const cliPath = join(rootDir, 'dist', 'cli.js');
    execSync(`node ${cliPath} init "${task}"`, { stdio: 'inherit' });

    // Verify TODO-AI.md was created with task
    const todoPath = join(TEST_DIRS.INIT, 'TODO-AI.md');
    const todo = await readFile(todoPath, 'utf8');
    expect(todo).toContain(task);
  });
}); 