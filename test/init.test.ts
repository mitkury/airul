import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir } from './utils';
import { initProject } from '../src/init';

describe('init command', () => {
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

  it('should create .airul.json in new project', async () => {
    const result = await initProject(TEST_DIRS.INIT, undefined, true);
    
    // Verify result
    expect(result.configCreated).toBe(true);
    expect(result.alreadyInitialized).toBeFalsy();
    expect(result.rulesGenerated).toBe(false); // No docs yet, so rules won't be generated
    
    // Verify config exists and is valid JSON
    const configPath = join(TEST_DIRS.INIT, '.airul.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config).toBeTruthy();
    expect(config.sources).toContain('README.md');
  });

  it('should generate rules if documentation exists', async () => {
    // Create some documentation first
    await writeFile(join(TEST_DIRS.INIT, 'README.md'), '# Test Project\n\nThis is a test.');
    
    const result = await initProject(TEST_DIRS.INIT, undefined, true);
    expect(result.rulesGenerated).toBe(true);
    
    // Verify rules files were created
    const windsurfRules = await readFile(join(TEST_DIRS.INIT, '.windsurfrules'), 'utf8');
    const cursorRules = await readFile(join(TEST_DIRS.INIT, '.cursorrules'), 'utf8');
    expect(windsurfRules).toContain('Test Project');
    expect(cursorRules).toContain('Test Project');
  });

  it('should handle already initialized project', async () => {
    // Create existing .airul.json
    const configPath = join(TEST_DIRS.INIT, '.airul.json');
    await writeFile(configPath, '{"existing": true}');

    // Should not throw, just inform it's already initialized
    const result = await initProject(TEST_DIRS.INIT, undefined, true);
    expect(result.alreadyInitialized).toBe(true);
    expect(result.configCreated).toBe(false);

    // Original config should be preserved
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    expect(config).toEqual({ existing: true });
  });
});
