import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { GenerateOptions } from './types';

export async function generateRules(options: GenerateOptions): Promise<void> {
  const { sources, output, template = {} } = options;
  
  // Expand glob patterns and get all source files
  const files = await glob(sources);
  
  // Read and format content from each file
  const contents = await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file, 'utf8');
      const fileHeader = template.fileHeader?.replace('{fileName}', file) || `# From ${file}:`;
      return `${fileHeader}\n\n${content}`;
    })
  );

  // Join contents with separator
  const separator = template.separator || '\n---\n';
  const fullContent = contents.join(`${separator}\n`);

  // Write output files based on configuration
  const writePromises: Promise<void>[] = [];

  if (output.windsurf) {
    writePromises.push(fs.writeFile('.windsurfrules', fullContent));
  }

  if (output.cursor) {
    writePromises.push(fs.writeFile('.cursorrules', fullContent));
  }

  if (output.customPath) {
    writePromises.push(fs.writeFile(output.customPath, fullContent));
  }

  await Promise.all(writePromises);
}
