import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { GenerateOptions } from './types';
import { dirname } from 'path';
import { Config } from 'cosmiconfig';
import console from 'console';
import { initProject } from './init';

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
        continue;
      } catch (error) {}

      // Try glob pattern
      const matches = await glob(pattern, { 
        cwd: baseDir,
        absolute: false,
        nodir: true
      });
      
      for (const file of matches) {
        const normalized = path.normalize(file);
        if (!seen.has(normalized)) {
          seen.add(normalized);
          result.push(normalized);
        }
      }
    } catch (error) {
      console.warn(`Warning: Invalid glob pattern ${pattern}:`, error);
    }
  }

  return result;
}

function findDocFiles(sources: string[]): string[] {
  const files: string[] = [];
  
  for (const pattern of sources) {
    const matches = glob.sync(pattern);
    files.push(...matches);
  }

  if (files.length === 0) {
    console.warn('No documentation files found');
    return [];
  }

  return files;
}

export async function generateRules(options: GenerateOptions): Promise<boolean> {
  const baseDir = options.baseDir || process.cwd();

  // Ensure base directory exists
  await fs.mkdir(baseDir, { recursive: true });

  // Check if project needs initialization
  const configPath = path.join(baseDir, '.airul.json');
  let config;
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    config = JSON.parse(configContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Initialize project if config doesn't exist
      const result = await initProject(baseDir);
      const configContent = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configContent);
    } else {
      throw error;
    }
  }

  // Merge provided options with config from file
  const sources = options.sources || config.sources;
  const output = options.output ? {
    ...config.output,
    ...options.output
  } : config.output;
  const template = options.template || {};
  
  // Expand glob patterns and deduplicate while preserving order
  const files = await expandAndDeduplicate(sources, baseDir);

  if (files.length === 0) {
    console.warn('No documentation files found');
    return false;
  }

  // Read and format content from each file
  const contents = await Promise.all(
    files.map(async (file) => {
      try {
        const filePath = path.isAbsolute(file) ? file : path.join(baseDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const trimmed = content.trim();
        if (!trimmed) {
          console.warn(`Warning: File ${file} is empty`);
          return '';
        }
        const fileHeader = template.fileHeader?.replace('{fileName}', file) || `# From ${file}:`;
        return `${fileHeader}\n\n${trimmed}`;
      } catch (error: any) {
        console.warn(`Warning: Could not read file ${file}: ${error.message}`);
        return '';
      }
    })
  );

  // Filter out empty contents
  const validContents = contents.filter(Boolean);

  if (validContents.length === 0) {
    console.warn('No valid documentation content found');
    return false;
  }

  // Add intro context and join contents with separator
  const separator = template.separator || '\n---\n';
  const intro = `This is a context for AI editor/agent about the project. It's generated with a tool "airul" (https://airul.dev) out of ${validContents.length} sources.\n\n`;
  const fullContent = intro + validContents.join(`${separator}\n`);

  // Write output files based on configuration
  const writePromises: Promise<void>[] = [];

  if (output.windsurf) {
    writePromises.push(fs.writeFile(path.join(baseDir, '.windsurfrules'), fullContent));
  }

  if (output.cursor) {
    writePromises.push(fs.writeFile(path.join(baseDir, '.cursorrules'), fullContent));
  }

  if (output.customPath) {
    writePromises.push(fs.writeFile(path.join(baseDir, output.customPath), fullContent));
  }

  await Promise.all(writePromises);
  return writePromises.length > 0;
}

export async function generate(config: Config) {
  try {
    const result = await generateRules({
      sources: config.sources,
      output: config.output,
      baseDir: process.cwd()
    });

    if (result) {
      console.log('Successfully generated AI rules');
    } else {
      console.warn('No rules were generated. Check your .airul.json output configuration.');
    }
  } catch (error) {
    console.error('Error generating rules:', error);
    process.exit(1);
  }
}
