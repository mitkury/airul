import { join } from 'path';

// Base test output directory
const TEST_OUTPUT_DIR = join(__dirname, '__test_outputs__');

// Test directories for different test suites
export const TEST_DIRS = {
  BASIC: join(TEST_OUTPUT_DIR, 'basic'),
  DOCS: join(TEST_OUTPUT_DIR, 'docs'),
  INIT: join(TEST_OUTPUT_DIR, 'init')
} as const;

// Sample package.json content
export const TEST_PKG = {
  name: 'test-project',
  version: '1.0.0',
  description: 'Test project',
  scripts: {},
  dependencies: {},
  devDependencies: {}
} as const;

// Sample test content
export const TEST_CONTENT = {
  BASIC_RULE: '# Test Rule\nThis is a test rule.',
  EMPTY: ''
} as const;
