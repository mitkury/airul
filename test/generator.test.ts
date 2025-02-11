import { promises as fs } from 'fs';
import * as path from 'path';
import { generateRules } from '../src/generator';
import { TEST_DIRS } from './constants';
import { cleanupTestOutputs, createTestDir } from './utils';

describe('generateRules', () => {
  beforeEach(async () => {
    await cleanupTestOutputs();
  });

  afterAll(async () => {
    await cleanupTestOutputs();
  });

  it('should deduplicate sources while preserving order', async () => {
    await createTestDir(TEST_DIRS.BASIC_INIT);

    // Create test files
    const files = {
      'docs/tldr.md': '# TLDR\nQuick overview',
      'README.md': '# Project\nMain docs',
      'docs/guide.md': '# Guide\nDetailed guide',
      'docs/api.md': '# API\nAPI docs'
    };

    for (const [file, content] of Object.entries(files)) {
      const filePath = path.join(TEST_DIRS.BASIC_INIT, file);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
    }

    // Change to test directory
    process.chdir(TEST_DIRS.BASIC_INIT);

    // Generate rules with overlapping patterns
    await generateRules({
      sources: [
        'docs/tldr.md',
        'README.md',
        'docs/*.md'
      ],
      output: {
        windsurf: true,
        cursor: true
      }
    });

    // Change back to original directory
    process.chdir(process.cwd());

    // Read the generated file
    const content = await fs.readFile('.windsurfrules', 'utf8');
    
    // Check order is preserved and files are not duplicated
    expect(content).toMatch(/TLDR[\s\S]*Project[\s\S]*Guide[\s\S]*API/);
    
    // Make sure tldr.md only appears once
    const tldrCount = (content.match(/TLDR/g) || []).length;
    expect(tldrCount).toBe(1);
  });
});
