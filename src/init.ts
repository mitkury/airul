import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { join } from 'path';
import { generateRules } from './generator';

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
  alreadyInitialized?: boolean;
  rulesGenerated?: boolean;
  gitInitialized?: boolean;
  gitExists?: boolean;
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
    rulesGenerated,
    gitInitialized,
    gitExists
  };
}
