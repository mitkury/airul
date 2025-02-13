import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { generateRules } from './generator';

const defaultConfig = {
  what: "Generate AI rules from your documentation for Cursor, Windsurf, GitHub Copilot, and other AI-powered tools",
  how: "Edit 'sources' to include your important docs (supports glob patterns like 'docs/*.md') and enable/disable AI tools in 'output'",
  sources: [
    'TODO-AI.md',
    'README.md'
  ],
  output: {
    cursor: true,
    windsurf: false,
    copilot: false
  }
};

export interface EditorOptions {
  cursor?: boolean;
  windsurf?: boolean;
  copilot?: boolean;
}

interface InitResult {
  configCreated: boolean;
  taskCreated?: boolean;
  alreadyInitialized?: boolean;
  rulesGenerated?: boolean;
  gitInitialized?: boolean;
  gitExists?: boolean;
}

export async function initProject(
  cwd: string, 
  task?: string, 
  testMode = false,
  editorOptions: EditorOptions = {}
): Promise<InitResult> {
  // Check if .airul.json already exists
  const configPath = path.join(cwd, '.airul.json');
  let config;
  let configCreated = false;
  let gitInitialized = false;
  let gitExists = false;
  
  try {
    await fs.access(configPath);
    // Project is already initialized, load existing config
    const configContent = await fs.readFile(configPath, 'utf8');
    config = JSON.parse(configContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Initialize git if not already initialized
      const gitDir = path.join(cwd, '.git');
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

      // Create config file with editor options
      config = {
        ...defaultConfig,
        output: {
          ...defaultConfig.output,
          cursor: editorOptions.cursor === undefined ? defaultConfig.output.cursor : Boolean(editorOptions.cursor),
          windsurf: editorOptions.windsurf === undefined ? defaultConfig.output.windsurf : Boolean(editorOptions.windsurf),
          copilot: editorOptions.copilot === undefined ? defaultConfig.output.copilot : Boolean(editorOptions.copilot)
        }
      };

      await fs.writeFile(
        configPath,
        JSON.stringify(config, null, 2)
      );
      configCreated = true;
    } else {
      throw error;
    }
  }

  // Create or update TODO-AI.md if task is provided or it doesn't exist
  let taskCreated = false;
  const todoPath = path.join(cwd, 'TODO-AI.md');
  try {
    await fs.access(todoPath);
  } catch (error: any) {
    if (error.code === 'ENOENT' || task) {
      const defaultTask = "Learn from the user about their project, get the idea of what they want to make";
      const activeTask = task || defaultTask;
      const status = '⏳ In Progress';
      const todoContent = `# AI Workspace

## Active Task
${activeTask}

## Status
${status}

## Context & Progress
- Created: ${new Date().toISOString().split('T')[0]}
- I (AI) will maintain this document as we work together
- My current focus: Understanding and working on the active task

## Task History
- Initial task: ${activeTask}

## Notes
- I'll update this file to track our progress and maintain context
- I'll keep sections concise but informative
- I'll update status and add key decisions/changes
- I'll add new tasks as they come up`;

      await fs.writeFile(todoPath, todoContent);
      taskCreated = true;
    }
  }

  // Always try to generate rules, whether project is new or existing
  let rulesGenerated = false;
  try {
    rulesGenerated = await generateRules({
      ...config,
      baseDir: cwd
    });
  } catch (error) {
    // Don't fail initialization if rules generation fails
    console.warn('Note: Initial rules generation skipped - add documentation first');
  }

  return {
    configCreated,
    taskCreated,
    rulesGenerated,
    gitInitialized: configCreated && gitInitialized,
    gitExists: configCreated && gitExists,
    alreadyInitialized: !configCreated
  };
}
