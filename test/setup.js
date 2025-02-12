// Build the project before running tests if not already built
const { execSync } = require('child_process');
const fs = require('fs');
const Module = require('module');

if (!fs.existsSync('./dist')) {
  console.log('Building project before running tests...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Point imports to dist when TEST_DIST is true
process.env.TEST_DIST = 'true';

// Override the default require resolution
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain) {
  if (process.env.TEST_DIST === 'true' && request.startsWith('../src/')) {
    request = request.replace('../src/', '../dist/');
  }
  return originalResolveFilename.call(this, request, parent, isMain);
}; 