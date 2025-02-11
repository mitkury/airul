import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { GenerateOptions } from './types';
import { dirname } from 'path';

async function expandAndDeduplicate(sources: string[]): Promise<string[]> {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const pattern of sources) {
    try {
      const matches = await glob(pattern);
      for (const file of matches) {
        const normalized = path.normalize(file);
        if (!seen.has(normalized)) {
          // Check if file exists before adding
          try {
            await fs.access(normalized);
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

export async function generateRules(options: GenerateOptions): Promise<boolean> {
  const { sources, output, template = {} } = options;
  
  // Use specified base directory or current working directory
  const baseDir = options.baseDir || process.cwd();

  // Ensure base directory exists
  await fs.mkdir(baseDir, { recursive: true });
  
  // Expand glob patterns and deduplicate while preserving order
  const files = await expandAndDeduplicate(sources);

  if (files.length === 0) {
    console.log('No documentation files found');
    return false;
  }
  
  // Read and format content from each file
  const contents = await Promise.all(
    files.map(async (file) => {
      try {
        const content = await fs.readFile(file, 'utf8');
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

  // Join contents with separator
  const separator = template.separator || '\n---\n';
  const fullContent = validContents.join(`${separator}\n`);

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
