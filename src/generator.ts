import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { AirulConfig, GenerateOptions } from './types';
import { dirname } from 'path';
import { Config } from 'cosmiconfig';
import { initProject } from './init';
import { prompts } from './prompts';
import { loadConfig } from './config';

async function expandAndDeduplicate(sources: string[], baseDir: string): Promise<string[]> {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const pattern of sources) {
    try {
      // First try to find the file directly
      const filePath = path.isAbsolute(pattern) ? pattern : path.join(baseDir, pattern);
      try {
        await fs.access(filePath);
        const normalized = path.normalize(pattern);
        if (!seen.has(normalized)) {
          seen.add(normalized);
          result.push(normalized);
        }
      } catch (error: any) {
        // File not found directly, try glob
      }

      // Try glob pattern
      const matches = await glob(pattern, {
        cwd: baseDir,
        absolute: false,
        nodir: true,
        dot: true
      });

      for (const file of matches) {
        const normalized = path.normalize(file);
        if (!seen.has(normalized)) {
          seen.add(normalized);
          result.push(normalized);
        }
      }
    } catch (error) {
      console.warn(prompts.invalidGlobWarning(pattern, error));
    }
  }

  return result;
}

export interface GenerateResult {
  success: boolean;
  fileStatuses: Map<string, { included: boolean, error?: string }>;
}

export async function generateRules(options: GenerateOptions): Promise<GenerateResult> {
  const baseDir = options.baseDir || process.cwd();
  const fileStatuses = new Map<string, { included: boolean, error?: string }>();

  // Ensure base directory exists
  await fs.mkdir(baseDir, { recursive: true });

  // Check if project has configuration
  const configPath = path.join(baseDir, '.airul.json');
  let config: AirulConfig;
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    config = JSON.parse(configContent) as AirulConfig;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Project not initialized - run init first
      const initResult = await initProject(baseDir);
      if (!initResult.configCreated) {
        throw new Error('Failed to initialize project');
      }
      // Load the newly created config
      const configContent = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configContent) as AirulConfig;
    } else {
      throw error;
    }
  }

  // Merge provided options with config from file
  const mergedConfig: AirulConfig = {
    ...config,
    // If sources are provided in options, use them exclusively
    sources: options.sources ? [...options.sources] : config.sources,
    output: options.output ? {
      ...config.output,
      ...options.output
    } : config.output,
    template: options.template || config.template || {}
  };

  // Initialize status tracking for original source patterns
  for (const source of mergedConfig.sources) {
    fileStatuses.set(source, { included: false });
  }

  // Expand glob patterns and deduplicate while preserving order
  const files = await expandAndDeduplicate(mergedConfig.sources, baseDir);

  // Update status tracking to include files found during glob expansion
  for (const file of files) {
    if (!fileStatuses.has(file)) {
      fileStatuses.set(file, { included: false });
    }
  }

  if (files.length === 0) {
    console.warn(prompts.noSourcesFound);
    return { success: false, fileStatuses };
  }

  // Read and format content from each file
  const contents = await Promise.all(
    files.map(async (file) => {
      try {
        const filePath = path.isAbsolute(file) ? file : path.join(baseDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const trimmed = content.trim();
        if (!trimmed) {
          fileStatuses.set(file, { included: false, error: 'file is empty' });
          console.warn(prompts.emptyFileWarning(file));
          return '';
        }
        const fileHeader = mergedConfig.template?.fileHeader?.replace('{fileName}', file) || `# From ${file}:`;
        fileStatuses.set(file, { included: true });
        return `${fileHeader}\n\n${trimmed}`;
      } catch (error: any) {
        fileStatuses.set(file, { included: false, error: 'couldn\'t find the file' });
        console.warn(prompts.fileReadError(file, error.message));
        return '';
      }
    })
  );

  // Filter out empty contents
  const validContents = contents.filter(Boolean);

  if (validContents.length === 0) {
    return { success: false, fileStatuses };
  }

  // Add intro context and join contents with separator
  const separator = mergedConfig.template?.separator || '\n---\n';
  const intro = prompts.contextIntro(validContents.length) + '\n\n';
  const fullContent = intro + validContents.join(`${separator}\n`);

  // Write output files based on configuration
  const writePromises: Promise<void>[] = [];

  if (mergedConfig.output.windsurf) {
    writePromises.push(fs.writeFile(path.join(baseDir, '.windsurfrules'), fullContent));
  }

  if (mergedConfig.output.cursor) {
    writePromises.push(fs.writeFile(path.join(baseDir, '.cursorrules'), fullContent));
  }

  if (mergedConfig.output.cline) {
    writePromises.push(fs.writeFile(path.join(baseDir, '.clinerules'), fullContent));
  }

  if (mergedConfig.output.copilot) {
    // Create .github directory if it doesn't exist
    const githubDir = path.join(baseDir, '.github');
    await fs.mkdir(githubDir, { recursive: true });
    writePromises.push(fs.writeFile(path.join(githubDir, 'copilot-instructions.md'), fullContent));
  }

  if (mergedConfig.output.customPath) {
    writePromises.push(fs.writeFile(path.join(baseDir, mergedConfig.output.customPath), fullContent));
  }

  await Promise.all(writePromises);

  return { success: writePromises.length > 0, fileStatuses };
}

export async function generate(config: Config) {
  try {
    const result = await generateRules({
      sources: config.sources,
      output: config.output,
      baseDir: process.cwd()
    });

    if (result.success) {
      console.log('Successfully generated AI rules');
    } else {
      console.warn('No rules were generated. Check your .airul.json output configuration.');
    }
  } catch (error) {
    console.error('Error generating rules:', error);
    process.exit(1);
  }
}
