import * as fs from 'fs/promises';
import * as path from 'path';

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
  gitignoreUpdated: boolean;
  docsCreated: boolean;
  taskCreated?: boolean;
}

export async function initProject(cwd: string, task?: string): Promise<InitResult> {
  // Check if .airulerc.json already exists
  const configPath = path.join(cwd, '.airulerc.json');
  try {
    await fs.access(configPath);
    throw new Error('.airulerc.json already exists');
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

  // Update .gitignore
  const gitignorePath = path.join(cwd, '.gitignore');
  const ignoreRules = '\n# AIRule\n.windsurfrules\n.cursorrules\n';
  
  try {
    const existingContent = await fs.readFile(gitignorePath, 'utf-8');
    if (!existingContent.includes('.windsurfrules')) {
      await fs.appendFile(gitignorePath, ignoreRules);
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(gitignorePath, ignoreRules.trim());
    } else {
      throw error;
    }
  }

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
- Command: airule init "${task}"
`;

    await fs.writeFile(
      path.join(cwd, 'TODO-AI.md'),
      todoContent
    );
    taskCreated = true;
  }

  return {
    configCreated: true,
    gitignoreUpdated: true,
    docsCreated: true,
    taskCreated
  };
}
