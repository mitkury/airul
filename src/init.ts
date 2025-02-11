import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

async function getLatestVersion(): Promise<string> {
  return 'latest';
}
import { existsSync, readFileSync, writeFileSync } from 'fs';

const defaultConfig = {
  sources: [
    'README.md',
    'docs/**/*.md',
    'api-docs/**/*.md'
  ],
  output: {
    windsurf: true,
    cursor: true
  }
};

interface InitResult {
  configCreated: boolean;
  docsCreated: boolean;
  taskCreated?: boolean;
  packageUpdated?: boolean;
}

async function updatePackageJson(cwd: string, testMode = false): Promise<boolean> {
  const pkgPath = path.join(cwd, 'package.json');
  
  // Create package.json if it doesn't exist
  if (!existsSync(pkgPath)) {
    execSync('npm init -y', { stdio: 'inherit', cwd });
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  
  // Add scripts if they don't exist
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts.rules) {
    pkg.scripts.rules = 'airul generate';
  }

  // Add dev dependencies
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies.airul = testMode ? 'latest' : await getLatestVersion();

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // Install airul as dev dependency
  console.log('Installing airul as dev dependency...');
  if (!testMode) {
    execSync('npm install --save-dev airul@latest', { stdio: 'inherit', cwd });
  }
  
  return true;
}

export async function initProject(cwd: string, task?: string, testMode = false): Promise<InitResult> {
  // Check if .airulrc.json already exists
  const configPath = path.join(cwd, '.airulrc.json');
  try {
    await fs.access(configPath);
    throw new Error('.airulrc.json already exists');
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  // Create config file
  await fs.writeFile(
    configPath,
    JSON.stringify(defaultConfig, null, 2)
  );



  // Check for docs directories
  const docsPath = path.join(cwd, 'docs');
  const apiDocsPath = path.join(cwd, 'api-docs');
  
  try {
    await fs.access(docsPath);
  } catch {
    await fs.mkdir(docsPath);
  }

  try {
    await fs.access(apiDocsPath);
  } catch {
    // Don't create api-docs by default, only if specifically needed
  }

  // Create TODO-AI.md if task is provided
  let taskCreated = false;
  if (task) {
    const todoContent = `# AI Task Instructions

## Task
${task}

## Status
⏳ In Progress

## Instructions for AI
1. This is a temporary file that contains instructions for AI tools
2. Remove this file after completing the task
3. If further work is needed, update the task and status

## Context
- Created: ${new Date().toISOString().split('T')[0]}
- Command: airul init "${task}"
`;

    await fs.writeFile(
      path.join(cwd, 'TODO-AI.md'),
      todoContent
    );
    taskCreated = true;
  }

  // Update package.json and install dependencies
  const packageUpdated = await updatePackageJson(cwd, testMode);

  return {
    configCreated: true,
    docsCreated: true,
    taskCreated,
    packageUpdated
  };
}
