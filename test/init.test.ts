import * as fs from 'fs/promises';
import * as path from 'path';
import { initProject } from '../src/init';
import { TEST_DIRS } from './constants';
import { cleanupTestOutputs, createTestDir } from './utils';

describe('initProject', () => {
  beforeEach(async () => {
    await cleanupTestOutputs();
  });

  afterAll(async () => {
    await cleanupTestOutputs();
  });

  it('should create basic project structure', async () => {
    await createTestDir(TEST_DIRS.BASIC_INIT);
    const result = await initProject(TEST_DIRS.BASIC_INIT);

    // Check result
    expect(result).toEqual({
      configCreated: true,
      gitignoreUpdated: true,
      docsCreated: true,
      taskCreated: false
    });

    // Check files
    const files = await fs.readdir(TEST_DIRS.BASIC_INIT);
    expect(files).toContain('.airulerc.json');
    expect(files).toContain('.gitignore');
    expect(files).toContain('docs');

    // Check config content
    const config = JSON.parse(
      await fs.readFile(path.join(TEST_DIRS.BASIC_INIT, '.airulerc.json'), 'utf-8')
    );
    expect(config.sources).toContain('README.md');
    expect(config.output.windsurf).toBe(true);
    expect(config.output.cursor).toBe(true);
  });

  it('should create project with AI task', async () => {
    await createTestDir(TEST_DIRS.TASK_INIT);
    const task = 'Create a React component';
    const result = await initProject(TEST_DIRS.TASK_INIT, task);

    // Check result
    expect(result).toEqual({
      configCreated: true,
      gitignoreUpdated: true,
      docsCreated: true,
      taskCreated: true
    });

    // Check files
    const files = await fs.readdir(TEST_DIRS.TASK_INIT);
    expect(files).toContain('TODO-AI.md');

    // Check task content
    const todoContent = await fs.readFile(path.join(TEST_DIRS.TASK_INIT, 'TODO-AI.md'), 'utf-8');
    expect(todoContent).toContain('## Task');
    expect(todoContent).toContain(task);
    expect(todoContent).toContain('⏳ In Progress');
    expect(todoContent).toContain('Remove this file after completing the task');
  });

  it('should handle existing .airulerc.json', async () => {
    await createTestDir(TEST_DIRS.ERROR_CASES);
    
    // Create existing config
    await fs.writeFile(
      path.join(TEST_DIRS.ERROR_CASES, '.airulerc.json'),
      JSON.stringify({ existing: true })
    );

    await expect(initProject(TEST_DIRS.ERROR_CASES))
      .rejects.toThrow('.airulerc.json already exists');
  });
});
