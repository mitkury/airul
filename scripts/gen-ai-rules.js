const fs = require('fs');
const path = require('path');

// Files to include in the context
const contextFiles = [
  'README.md',
  'docs/rules-for-ai.md'
];

// Read and format file contents
function getFileContent(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return `# From ${filePath}:\n\n${content}\n`;
}

// Generate content for both files
const content = contextFiles
  .map(file => getFileContent(file))
  .join('\n---\n\n');

// Write to .windsurfrules
fs.writeFileSync(
  path.join(__dirname, '..', '.windsurfrules'),
  content
);

// Write to .cursorrules
fs.writeFileSync(
  path.join(__dirname, '..', '.cursorrules'),
  content
);
