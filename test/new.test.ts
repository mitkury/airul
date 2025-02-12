import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir } from './utils';
import { createNewProject } from '../src/new';
import { access } from 'fs/promises';
import { join, dirname } from 'path';
import { readFile } from 'fs/promises';

describe('new command', () => {
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    // Ensure parent directories exist
    await createDir(dirname(TEST_DIRS.NEW));
  });

  beforeEach(async () => {
    await cleanupTestDir(TEST_DIRS.NEW);
    await createDir(TEST_DIRS.NEW);
    process.chdir(TEST_DIRS.NEW);
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  it('should create a new project directory', async () => {
    const projectName = 'test-project';
    await createNewProject(projectName, undefined, {});
    await expect(access(projectName)).resolves.toBeUndefined();
  });

  it('should set default learning task when no task provided', async () => {
    const projectName = 'test-project-no-task';
    await createNewProject(projectName, undefined, {});
    
    const todoContent = await readFile(join(projectName, 'TODO-AI.md'), 'utf8');
    expect(todoContent).not.toContain('Active Task\nNone');
    expect(todoContent).toContain('⏳ In Progress');
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
