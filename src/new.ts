import { spawn } from 'child_process';
import { join } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { initProject } from './init';

interface NewProjectOptions {
  // Editor configuration
  cursor?: boolean;
  windsurf?: boolean;
  copilot?: boolean;
}

const isValidProjectName = (name: string): boolean => {
  // Extract just the base name from the path
  const baseName = name.split(/[/\\]/).pop() || '';
  
  // Project name validation rules
  if (!baseName) return false;
  if (baseName.length > 214) return false;
  if (baseName.startsWith('.')) return false;
  if (baseName.includes(' ')) return false;
  if (!/^[a-zA-Z0-9-_]+$/.test(baseName)) return false;

  // Check if the name contains path separators
  if (name.includes('/') || name.includes('\\')) return false;
  
  return true;
};

const openInEditor = async (projectPath: string, editor: string) => {
  // Skip editor launch in test environment
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  type EditorCommand = 'copilot' | 'code' | 'cursor' | 'windsurf' | 'ws';

  const commands: Record<EditorCommand, string[]> = {
    copilot: ['code', '.'],
    code: ['code', '.'],
    cursor: ['cursor', '.'],
    windsurf: ['windsurf', '.'],
    ws: ['windsurf', '.']
  };

  const cmd = commands[editor.toLowerCase() as EditorCommand];
  if (!cmd) {
    throw new Error(`Unsupported editor: ${editor}`);
  }

  try {
    const [command, ...args] = cmd;
    const proc = spawn(command, [...args], { 
      stdio: 'inherit',
      cwd: projectPath,
      detached: true
    });
    
    // Allow Node.js to exit even if the editor process is still running
    proc.unref();
  } catch (error) {
    console.error(`Failed to open in ${editor}. Make sure it's installed and available in PATH.`);
  }
};

export const createNewProject = async (
  projectName: string,
  task?: string,
  options: NewProjectOptions = {}
) => {
  // Validate project name first
  if (!isValidProjectName(projectName)) {
    throw new Error('Invalid project name');
  }

  const projectPath = join(process.cwd(), projectName);
  const defaultTask = "Learn from the user about their project, get the idea of what they want to make";

  try {
    // Check if directory exists
    try {
      await mkdir(projectPath);
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        throw new Error(`Directory '${projectName}' already exists. Please choose a different name.`);
      }
      throw error;
    }
    console.log(`Created directory: ${projectName}`);

    // Initialize airul in the new directory with editor options
    await initProject(projectPath, task || defaultTask, process.env.NODE_ENV === 'test', {
      cursor: options.cursor,
      windsurf: options.windsurf,
      copilot: options.copilot
    });

    // Create README.md from template
    if (process.env.NODE_ENV === 'test') {
      const readmeTemplate = await readFile(join(__dirname, '..', 'test', 'docs', 'test-readme.md'), 'utf8');
      const readmeContent = readmeTemplate.replace('{projectName}', projectName);
      await writeFile(join(projectPath, 'README.md'), readmeContent);

      // Create docs/README.md from template
      const docsReadmeTemplate = await readFile(join(__dirname, '..', 'test', 'docs', 'test-docs-readme.md'), 'utf8');
      const docsDir = join(projectPath, 'docs');
      await mkdir(docsDir, { recursive: true }); // Only create docs dir when we need to write a test file
      await writeFile(join(docsDir, 'README.md'), docsReadmeTemplate);
    }

    // Open in editors if flags are set
    if (options.cursor) await openInEditor(projectPath, 'cursor');
    if (options.copilot) await openInEditor(projectPath, 'copilot');
    if (options.windsurf) await openInEditor(projectPath, 'windsurf');

  } catch (error: any) {
    if (process.env.NODE_ENV === 'test') {
      throw error;
    } else {
      console.error('Error creating project:', error.message);
      process.exit(1);
    }
  }
};
