import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { TEST_DIRS } from './constants';
import { cleanupTestDir, createDir } from './utils';
import { initProject } from '../src/init';
import { generateRules } from '../src/generator';

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
    // Initialize project first
    const result = await initProject(TEST_DIRS.INIT, undefined, true);
    expect(result.configCreated).toBe(true);
    
    // Then create documentation
    await writeFile(join(TEST_DIRS.INIT, 'README.md'), '# Test Project\n\nThis is a test.');
    
    // Generate rules again
    const result2 = await generateRules({
      sources: ['README.md'],
      output: { windsurf: true, cursor: true },
      baseDir: TEST_DIRS.INIT
    });
    expect(result2).toBe(true);
    
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

  it('should create package.json if it does not exist', async () => {
    const result = await initProject(TEST_DIRS.INIT, undefined, true);
    expect(result.packageUpdated).toBe(true);

    const pkgPath = join(TEST_DIRS.INIT, 'package.json');
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
    
    expect(pkg.scripts.rules).toBe('airul generate');
    expect(pkg.devDependencies.airul).toBe('latest');
  });

  it('should update existing package.json', async () => {
    // Create existing package.json with some content
    const existingPkg = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        test: 'jest',
        start: 'node index.js'
      },
      devDependencies: {
        jest: '^29.0.0'
      }
    };
    await writeFile(
      join(TEST_DIRS.INIT, 'package.json'),
      JSON.stringify(existingPkg, null, 2)
    );

    const result = await initProject(TEST_DIRS.INIT, undefined, true);
    expect(result.packageUpdated).toBe(true);

    const pkg = JSON.parse(await readFile(join(TEST_DIRS.INIT, 'package.json'), 'utf8'));
    
    // Should preserve existing content
    expect(pkg.scripts.test).toBe('jest');
    expect(pkg.scripts.start).toBe('node index.js');
    expect(pkg.devDependencies.jest).toBe('^29.0.0');
    
    // Should add new content
    expect(pkg.scripts.rules).toBe('airul generate');
    expect(pkg.devDependencies.airul).toBe('latest');
  });
});
