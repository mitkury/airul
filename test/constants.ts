import { join } from 'path';

// Base test output directory
const TEST_ROOT = join(__dirname, '__test_outputs__');

// Test directories for different test suites
export const TEST_DIRS = {
  BASIC: join(TEST_ROOT, 'basic'),
  INIT: join(TEST_ROOT, 'init'),
  NEW: join(TEST_ROOT, 'new'),
  BUILD: join(TEST_ROOT, 'build'),
  GENERATOR: join(TEST_ROOT, 'generator')
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
  BASIC_RULES: '# Test Rules\n\n1. Write tests\n2. Keep docs updated',
  EMPTY_FILE: '',
  INVALID_JSON: '{ not valid json }'
} as const;
