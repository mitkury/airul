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

  it('should create basic project structure and update package.json', async () => {
    await createTestDir(TEST_DIRS.BASIC_INIT);
    const result = await initProject(TEST_DIRS.BASIC_INIT, undefined, true);

    // Check package.json
    const pkgPath = path.join(TEST_DIRS.BASIC_INIT, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

    // Should have rules script
    expect(pkg.scripts).toHaveProperty('rules', 'airul generate');

    // Should have airul as dev dependency
    expect(pkg.devDependencies).toHaveProperty('airul');

    // Check result
    expect(result).toEqual({
      configCreated: true,
      docsCreated: true,
      taskCreated: false,
      packageUpdated: true
    });

    // Check files
    const files = await fs.readdir(TEST_DIRS.BASIC_INIT);
    expect(files).toContain('.airulrc.json');

    expect(files).toContain('docs');

    // Check config content
    const config = JSON.parse(
      await fs.readFile(path.join(TEST_DIRS.BASIC_INIT, '.airulrc.json'), 'utf-8')
    );
    expect(config.sources).toContain('README.md');
    expect(config.output.windsurf).toBe(true);
    expect(config.output.cursor).toBe(true);
  });

  it('should create project with AI task', async () => {
    await createTestDir(TEST_DIRS.TASK_INIT);
    const task = 'Create a React component';
    const result = await initProject(TEST_DIRS.TASK_INIT, task, true);

    // Check result
    expect(result).toEqual({
      configCreated: true,
      docsCreated: true,
      taskCreated: true,
      packageUpdated: true
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

  it('should handle existing .airulrc.json', async () => {
    await createTestDir(TEST_DIRS.ERROR_CASES);
    
    // Create existing config
    await fs.writeFile(
      path.join(TEST_DIRS.ERROR_CASES, '.airulrc.json'),
      JSON.stringify({ existing: true })
    );

    await expect(initProject(TEST_DIRS.ERROR_CASES, undefined, true))
      .rejects.toThrow('.airulrc.json already exists');
  });
});
