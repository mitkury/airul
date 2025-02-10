#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJson = require('../package.json');
const version = packageJson.version;

// Update version in cli.ts
const cliPath = path.join(__dirname, '../src/cli.ts');
const cliContent = fs.readFileSync(cliPath, 'utf8');

const updatedContent = cliContent.replace(
  /const VERSION = '[^']+'/,
  `const VERSION = '${version}'`
);

fs.writeFileSync(cliPath, updatedContent);

console.log(`Updated CLI version to ${version}`);
