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
    const editors = ['cursor', 'copilot', 'windsurf'];

    for (const editor of editors) {
      const fullName = `${projectName}-${editor}`;
      // Test with explicit flag set to undefined vs true
      const options = { [editor]: true };
      await createNewProject(fullName, undefined, options);
      
      // Verify project was created
      await expect(access(fullName)).resolves.toBeUndefined();
      
      // Verify editor configuration in .airul.json
      const configPath = join(fullName, '.airul.json');
      const config = JSON.parse(await readFile(configPath, 'utf8'));
      
      // Check that only the specified editor is enabled
      expect(config.output[editor]).toBe(true);
      
      // Check other editors maintain their defaults
      const otherEditors = editors.filter(e => e !== editor);
      for (const otherEditor of otherEditors) {
        expect(config.output[otherEditor]).toBe(otherEditor === 'cursor');
      }
    }
  });

  it('should handle undefined editor flags correctly', async () => {
    const projectName = 'test-project-editor-undefined';
    
    // Test with all flags undefined (should use defaults)
    await createNewProject(projectName, undefined, {
      cursor: undefined,
      windsurf: undefined,
      copilot: undefined
    });

    // Verify project was created
    await expect(access(projectName)).resolves.toBeUndefined();
    
    // Verify editor configuration in .airul.json
    const configPath = join(projectName, '.airul.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    
    // Check defaults are maintained
    expect(config.output.cursor).toBe(true); // cursor is true by default
    expect(config.output.windsurf).toBe(false); // windsurf is false by default
    expect(config.output.copilot).toBe(false); // copilot is false by default
  });

  it('should handle CLI-style flag presence correctly', async () => {
    const projectName = 'test-project-editor-flags';
    
    // Simulate CLI flag presence by setting to undefined
    await createNewProject(projectName, undefined, {
      cursor: undefined,
      windsurf: undefined,
      copilot: undefined
    });

    // Create another project with flags present (simulating --windsurf --copilot)
    const projectNameWithFlags = 'test-project-editor-with-flags';
    await createNewProject(projectNameWithFlags, undefined, {
      cursor: undefined, // not specified
      windsurf: true,   // --windsurf
      copilot: true      // --copilot
    });

    const config1 = JSON.parse(await readFile(join(projectName, '.airul.json'), 'utf8'));
    const config2 = JSON.parse(await readFile(join(projectNameWithFlags, '.airul.json'), 'utf8'));

    // First project should have defaults
    expect(config1.output.cursor).toBe(true);
    expect(config1.output.windsurf).toBe(false);
    expect(config1.output.copilot).toBe(false);

    // Second project should have specified flags enabled
    expect(config2.output.cursor).toBe(true); // default maintained
    expect(config2.output.windsurf).toBe(true); // flag enabled
    expect(config2.output.copilot).toBe(true); // flag enabled
  });

  it('should enable multiple editors when specified', async () => {
    const projectName = 'test-project-multi-editor';
    await createNewProject(projectName, undefined, {
      cursor: true,
      windsurf: true,
      copilot: true
    });

    // Verify project was created
    await expect(access(projectName)).resolves.toBeUndefined();

    // Verify all editors are enabled in config
    const configPath = join(projectName, '.airul.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config.output.cursor).toBe(true);
    expect(config.output.windsurf).toBe(true);
    expect(config.output.copilot).toBe(true);
  });

  it('should enable cursor by default when no flags are passed', async () => {
    const projectName = 'test-project-default-editor';
    
    // Create project without any editor flags
    await createNewProject(projectName, undefined, {});

    // Verify project was created
    await expect(access(projectName)).resolves.toBeUndefined();
    
    // Verify editor configuration in .airul.json
    const configPath = join(projectName, '.airul.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    
    // Check that cursor is enabled by default
    expect(config.output.cursor).toBe(true);
    expect(config.output.windsurf).toBe(false);
    expect(config.output.copilot).toBe(false);
  });
});
