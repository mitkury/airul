import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { join } from 'path';
import { generateRules } from './generator';

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
    cursor: true,
    customPath: undefined
  }
};

interface InitResult {
  configCreated: boolean;
  taskCreated?: boolean;
  packageUpdated?: boolean;
  alreadyInitialized?: boolean;
  rulesGenerated?: boolean;
  gitInitialized?: boolean;
  gitExists?: boolean;
}

async function updatePackageJson(cwd: string, testMode = false): Promise<boolean> {
  const pkgPath = path.join(cwd, 'package.json');
  
  // Create package.json if it doesn't exist
  if (!existsSync(pkgPath)) {
    if (testMode) {
      // Create a minimal package.json for testing
      const minimalPkg = {
        name: path.basename(cwd),
        version: '1.0.0',
        description: '',
        main: 'index.js',
        scripts: {},
        keywords: [],
        author: '',
        license: 'ISC'
      };
      writeFileSync(pkgPath, JSON.stringify(minimalPkg, null, 2));
    } else {
      execSync('npm init -y', { stdio: 'inherit', cwd });
    }
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  
  // Add scripts if they don't exist
  pkg.scripts = pkg.scripts || {};

  // Add rules generation script with description
  if (!pkg.scripts.rules) {
    pkg.scripts.rules = 'airul generate';
  }

  // Add a comment to explain what the rules script does
  if (!pkg.scripts['rules:comment']) {
    pkg.scripts['rules:comment'] = '# Generate AI rules from documentation';
  }

  // Add a pregenerate script to ensure config exists
  if (!pkg.scripts.pregenerate) {
    pkg.scripts.pregenerate = '[ -f .airul.json ] || airul init';
  }

  // Add a postinstall message to remind about the rules script
  if (!pkg.scripts.postinstall) {
    pkg.scripts.postinstall = 'echo "\nRun \'npm run rules\' to generate AI rules from your documentation"';
  }

  // Add dev dependencies
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies.airul = testMode ? 'latest' : await getLatestVersion();

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  // Install airul as dev dependency
  console.log('Installing airul as dev dependency...');
  if (process.env.NODE_ENV !== 'test') {
    execSync('npm install --save-dev airul@latest', { stdio: 'inherit', cwd });
  }
  
  return true;
}

export async function initProject(cwd: string, task?: string, testMode = false): Promise<InitResult> {
  // Check if .airul.json already exists
  const configPath = path.join(cwd, '.airul.json');
  try {
    await fs.access(configPath);
    // Project is already initialized
    return {
      configCreated: false,
      alreadyInitialized: true
    };
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  // Initialize git if not already initialized
  const gitDir = path.join(cwd, '.git');
  let gitInitialized = false;
  let gitExists = false;
  try {
    await fs.access(gitDir);
    gitExists = true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      if (!testMode) {
        try {
          execSync('git init', { stdio: 'inherit', cwd });
          gitInitialized = true;
        } catch (gitError) {
          // Git command failed (e.g., git not installed) - continue without git
          console.warn('Note: Git initialization skipped - git may not be installed');
        }
      } else {
        gitInitialized = true;
      }
    }
  }

  // Create config file
  await fs.writeFile(
    configPath,
    JSON.stringify(defaultConfig, null, 2)
  );

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

  // Generate initial rules if documentation exists
  let rulesGenerated = false;
  try {
    rulesGenerated = await generateRules({
      ...defaultConfig,
      baseDir: cwd
    });
  } catch (error) {
    // Don't fail initialization if rules generation fails
    console.warn('Note: Initial rules generation skipped - add documentation first');
  }

  return {
    configCreated: true,
    taskCreated,
    packageUpdated,
    rulesGenerated,
    gitInitialized,
    gitExists
  };
}
