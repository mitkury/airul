import { readFile } from 'fs/promises';
import { join } from 'path';
import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir } from './utils';
import { createNewProject } from '../src/new';

describe('new command', () => {
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

  afterEach(async () => {
    process.chdir(originalCwd);
    // Removed cleanup to preserve test outputs
  });

  it('should create new project directory with config', async () => {
    const projectName = 'test-project';
    await createNewProject(projectName, {});

    // Verify project directory exists
    const projectDir = join(TEST_DIRS.INIT, projectName);
    
    // Verify .airul.json exists and is valid JSON
    const configPath = join(projectDir, '.airul.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config).toBeTruthy();
    expect(config.sources).toContain('README.md');
  });

  it('should fail if directory already exists', async () => {
    const projectName = 'test-project';
    await createNewProject(projectName, {});

    // Try to create again and expect error
    await expect(createNewProject(
      projectName,
      {}
    )).rejects.toThrow('Directory \'test-project\' already exists. Please choose a different name.');
  });

  it('should handle invalid project names', async () => {
    const invalidNames = [
      '.test', // starts with dot
      'Test Project', // contains space
      'test$project', // contains special chars
      '', // empty
      'a'.repeat(215), // too long
    ];

    for (const name of invalidNames) {
      await expect(createNewProject(
        name,
        {}
      )).rejects.toThrow('Invalid project name');
    }
  });
});
