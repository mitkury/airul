import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { generateRules } from './generator';
import { prompts } from './prompts';

const defaultConfig = {
  what: prompts.configWhat,
  how: prompts.configHow,
  sources: [
    'TODO-AI.md',
    'README.md'
  ],
  output: {
    cursor: true,
    windsurf: false,
    copilot: false,
    cline: false
  }
};

export interface EditorOptions {
  cursor?: boolean;
  windsurf?: boolean;
  copilot?: boolean;
  cline?: boolean;
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
              console.warn(prompts.gitInitSkipped);
            }
          } else {
            gitInitialized = true;
          }
        }
      }

      // Create config file with editor options
      const hasAnyEditorEnabled = editorOptions.cursor === true ||
        editorOptions.windsurf === true ||
        editorOptions.copilot === true ||
        editorOptions.cline === true;

      config = {
        ...defaultConfig,
        output: {
          ...defaultConfig.output,
          cursor: editorOptions.cursor === undefined 
            ? !hasAnyEditorEnabled // Only enable cursor when no editors are enabled
            : Boolean(editorOptions.cursor),
          windsurf: editorOptions.windsurf === undefined ? false : Boolean(editorOptions.windsurf),
          copilot: editorOptions.copilot === undefined ? false : Boolean(editorOptions.copilot),
          cline: editorOptions.cline === undefined ? false : Boolean(editorOptions.cline)
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
      const defaultTask = prompts.defaultTask;
      const activeTask = task || defaultTask;
      const date = new Date().toISOString().split('T')[0];
      const todoContent = prompts.todoTemplate(activeTask, date);

      await fs.writeFile(todoPath, todoContent);
      taskCreated = true;
    }
  }

  // Always try to generate rules, whether project is new or existing
  let rulesGenerated = false;
  try {
    const result = await generateRules({
      ...config,
      baseDir: cwd
    });
    rulesGenerated = result.success;
  } catch (error) {
    // Don't fail initialization if rules generation fails
    console.warn(prompts.rulesGenerationSkipped);
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
