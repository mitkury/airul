import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { GenerateOptions } from './types';
import { dirname } from 'path';
import { Config } from 'cosmiconfig';
import console from 'console';

async function expandAndDeduplicate(sources: string[], baseDir: string): Promise<string[]> {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const pattern of sources) {
    try {
      const matches = await glob(pattern, { 
        cwd: baseDir,
        absolute: false
      });
      for (const file of matches) {
        const normalized = path.normalize(file);
        if (!seen.has(normalized)) {
          // Check if file exists before adding
          try {
            await fs.access(path.join(baseDir, normalized));
            seen.add(normalized);
            result.push(normalized);
          } catch (error) {
            // Skip non-existent files
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Invalid glob pattern ${pattern}`);
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
    // Add more helpful error message
    console.error('No documentation files found matching patterns:', sources);
    console.error('Please check your .airul.json configuration and ensure files exist');
    process.exit(1);
  }

  return files;
}

export async function generateRules(options: GenerateOptions): Promise<boolean> {
  const { sources, output, template = {} } = options;
  
  // Use specified base directory or current working directory
  const baseDir = options.baseDir || process.cwd();

  // Ensure base directory exists
  await fs.mkdir(baseDir, { recursive: true });
  
  // Expand glob patterns and deduplicate while preserving order
  const files = await expandAndDeduplicate(sources, baseDir);

  if (files.length === 0) {
    console.log('No documentation files found');
    return false;
  }
  
  // Read and format content from each file
  const contents = await Promise.all(
    files.map(async (file) => {
      try {
        const content = await fs.readFile(path.join(baseDir, file), 'utf8');
        const trimmed = content.trim();
        if (!trimmed) {
          console.warn(`Warning: File ${file} is empty`);
          return '';
        }
        const fileHeader = template.fileHeader?.replace('{fileName}', file) || `# From ${file}:`;
        return `${fileHeader}\n\n${trimmed}`;
      } catch (error) {
        console.warn(`Warning: Could not read file ${file}`);
        return '';
      }
    })
  );

  // Filter out empty contents
  const validContents = contents.filter(Boolean);

  if (validContents.length === 0) {
    console.warn('Warning: No valid documentation content found');
    return false;
  }

  // Add intro context and join contents with separator
  const separator = template.separator || '\n---\n';
  const intro = `This is a context for AI editor/agent about the project. It's generated with a tool "airul" (https://airul.dev) out of ${files.length} sources.\n\n`;
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
  return true;
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
