import * as path from 'path';

// Base test directory - NEVER modify anything outside this
export const TEST_BASE_DIR = path.join(__dirname, '__test_outputs__');

// Test case directories
export const TEST_DIRS = {
  BASIC_INIT: path.join(TEST_BASE_DIR, 'basic-init-test'),
  TASK_INIT: path.join(TEST_BASE_DIR, 'task-init-test'),
  ERROR_CASES: path.join(TEST_BASE_DIR, 'error-cases-test')
} as const;
