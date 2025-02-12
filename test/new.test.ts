import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir } from './utils';
import { createNewProject } from '../src/new';
import { access } from 'fs/promises';
import { join, dirname } from 'path';

describe('new command', () => {
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    // Ensure parent directories exist
    await createDir(dirname(TEST_DIRS.INIT));
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
    await cleanupTestDir(TEST_DIRS.INIT);
  });

  it('should create a new project directory', async () => {
    const projectName = 'test-project';
    await createNewProject(projectName, undefined, {});
    await expect(access(projectName)).resolves.toBeUndefined();
  });

  it('should fail if directory already exists', async () => {
    const projectName = 'test-project';
    await createNewProject(projectName, undefined, {});
    await expect(createNewProject(projectName, undefined, {}))
      .rejects.toThrow('Directory \'test-project\' already exists');
  });

  it('should handle invalid project names', async () => {
    const invalidNames = [
      '.test',
      'test project',
      'test/project',
      'test\\project',
      'test$project',
      'a'.repeat(215)
    ];

    for (const name of invalidNames) {
      await expect(createNewProject(name, undefined, {}))
        .rejects.toThrow('Invalid project name');
    }
  });

  it('should open in specified editor', async () => {
    const projectName = 'test-project-editor';
    const editors = ['cursor', 'vscode', 'windsurf'];

    for (const editor of editors) {
      const fullName = `${projectName}-${editor}`;
      await createNewProject(fullName, undefined, { [editor]: true });
      await expect(access(fullName)).resolves.toBeUndefined();
    }
  });
});
