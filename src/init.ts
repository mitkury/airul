import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { generateRules } from './generator';

const defaultConfig = {
  what: "Generate AI rules from your documentation for Cursor, Windsurf, and other AI-powered IDEs",
  how: "Edit 'sources' to include your important docs (supports glob patterns like 'docs/*.md') and enable/disable AI editors in 'output'",
  sources: [
    'TODO-AI.md',
    'README.md'
  ],
  output: {
    cursor: true,
    windsurf: false
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

  // Create TODO-AI.md
  const defaultTask = "Learn from the user about their project, get the idea of what they want to make";
  const activeTask = task || defaultTask;
  const status = '⏳ In Progress'; // Always in progress since we always have a task now
  const todoContent = `# AI Workspace

## Active Task
${activeTask}

## Status
${status}

## Instructions
1. This file is yours (AI agent) for managing tasks in this project
2. Update task status as you make progress
3. Remove completed tasks and add new ones as needed

## Notes
- Created: ${new Date().toISOString().split('T')[0]}
`;

  await fs.writeFile(
    path.join(cwd, 'TODO-AI.md'),
    todoContent
  );

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
    taskCreated: true, // Now always true since we always create TODO-AI.md
    rulesGenerated,
    gitInitialized,
    gitExists
  };
}
