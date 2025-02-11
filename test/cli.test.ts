import { execSync } from 'child_process';
import { join } from 'path';

describe('CLI', () => {
  const cliPath = join(__dirname, '..', 'dist', 'cli.js');
  const packageJson = require('../package.json');

  beforeAll(() => {
    // Ensure CLI is built
    execSync('npm run build', { stdio: 'inherit' });
  });

  it('should display correct version', () => {
    const output = execSync(`node ${cliPath} --version`).toString().trim();
    expect(output).toBe(packageJson.version);
  });

  it('should display help with all commands', () => {
    const output = execSync(`node ${cliPath} --help`).toString();
    expect(output).toContain('Usage: airul [options] [command]');
    expect(output).toContain('init [task]');
    expect(output).toContain('generate [options]');
  });

  it('should display detailed generate command help', () => {
    const output = execSync(`node ${cliPath} generate --help`).toString();
    expect(output).toContain('Source files to process');
    expect(output).toContain('docs/*.md');
    expect(output).toContain('.windsurfrules');
    expect(output).toContain('.cursorrules');
  });
});
