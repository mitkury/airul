import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { AirulConfig, GenerateOptions } from './types';
import { dirname } from 'path';
import { Config } from 'cosmiconfig';
import { initProject } from './init';
import { prompts } from './prompts';
import { loadConfig } from './config';

async function expandAndDeduplicate(sources: string[], baseDir: string): Promise<{ 
  files: string[], 
  fileStatuses: Map<string, { included: boolean, error?: string }>,
  originalOrder: Map<string, number> // Track original position
}> {
  const seen = new Set<string>();
  const result: string[] = [];
  const fileStatuses = new Map<string, { included: boolean, error?: string }>();
  const originalOrder = new Map<string, number>(); // Store original order
  let orderIndex = 0; // Counter for tracking order

  for (const pattern of sources) {
    try {
      // Normalize the pattern to use forward slashes
      const normalizedPattern = pattern.replace(/\\/g, '/');
      
      // Check if this is a glob pattern (contains wildcards)
      const isGlobPattern = normalizedPattern.includes('*') || normalizedPattern.includes('?') || normalizedPattern.includes('[');
      
      // Use glob with relative pattern and cwd option
      const matches = await glob(normalizedPattern, {
        cwd: baseDir,
        nodir: true,
        dot: true,
        follow: true,
        absolute: false // Keep paths relative to cwd
      });
      
      if (matches.length === 0) {
        fileStatuses.set(pattern, { included: false, error: 'No matching files found' });
        continue;
      }

      // Sort matches alphabetically if this is a glob pattern
      const sortedMatches = isGlobPattern ? matches.sort() : matches;
      
      // Add matched files (they're already relative to baseDir)
      for (const file of sortedMatches) {
        const normalized = file.replace(/\\/g, '/');
        if (!seen.has(normalized)) {
          seen.add(normalized);
          result.push(normalized);
          fileStatuses.set(normalized, { included: true });
          
          // For explicit files, use the pattern's order
          // For glob patterns, use the pattern's order (files within the glob will be sorted alphabetically)
          if (!originalOrder.has(normalized)) {
            originalOrder.set(normalized, orderIndex);
          }
        }
      }

      // Mark the pattern as included if it matched any files
      fileStatuses.set(pattern, { included: true });
      
      // Increment order index for the next pattern
      orderIndex++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      fileStatuses.set(pattern, { included: false, error: errorMessage });
    }
  }

  // We don't print the file summary here anymore - that's handled by the caller
  return { files: result, fileStatuses, originalOrder };
}

export interface GenerateResult {
  success: boolean;
  processedFiles: Map<string, boolean>; // file path -> was included
  fileStatuses?: Map<string, { included: boolean, error?: string }>; // Detailed file statuses
  originalOrder?: Map<string, number>; // Original ordering of files
}

export async function generateRules(options: GenerateOptions): Promise<GenerateResult> {
  const baseDir = options.baseDir || process.cwd();
  
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

  // Merge configurations with proper precedence
  const mergedConfig: AirulConfig = {
    ...config,
    sources: options.sources || config.sources || [],
    output: {
      ...config.output,
      ...(options.output || {})
    },
    template: {
      ...config.template,
      ...(options.template || {})
    }
  };

  // Expand glob patterns and deduplicate while preserving order
  const { files, fileStatuses, originalOrder } = await expandAndDeduplicate(mergedConfig.sources, baseDir);

  if (files.length === 0) {
    console.warn(prompts.noSourcesFound);
    return { success: false, processedFiles: new Map(), fileStatuses, originalOrder };
  }

  // Convert fileStatuses to processedFiles
  const processedFiles = new Map<string, boolean>();
  for (const [file, status] of fileStatuses) {
    processedFiles.set(file, status.included);
  }

  // Order files by their original position before reading
  const orderedFiles = [...files].sort((a, b) => {
    const orderA = originalOrder.has(a) ? originalOrder.get(a)! : Number.MAX_SAFE_INTEGER;
    const orderB = originalOrder.has(b) ? originalOrder.get(b)! : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
  
  // Read and format content from each file, maintaining order
  const contents = await Promise.all(
    orderedFiles.map(async (file) => {
      try {
        const filePath = path.isAbsolute(file) ? file : path.join(baseDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const trimmed = content.trim();
        
        if (!trimmed) {
          processedFiles.set(file, false);
          console.warn(prompts.emptyFileWarning(file));
          return '';
        }

        // Update status for successfully read files
        processedFiles.set(file, true);
        
        // Add file header if configured
        const fileHeader = mergedConfig.template?.fileHeader?.replace('{fileName}', file) || `# From ${file}:`;
        return `${fileHeader}\n\n${trimmed}`;
      } catch (error: any) {
        processedFiles.set(file, false);
        console.warn(prompts.fileReadError(file, error.message));
        return '';
      }
    })
  );

  // Filter out empty contents while maintaining order
  const validContents = contents.filter(Boolean);

  if (validContents.length === 0) {
    return { success: false, processedFiles, fileStatuses, originalOrder };
  }

  // Add intro context and join contents with separator
  const separator = mergedConfig.template?.separator || '\n---\n';
  const intro = prompts.contextIntro(validContents.length) + '\n\n';
  const fullContent = intro + validContents.join(`${separator}\n`);

  // Write output files based on configuration
  const writePromises: Promise<void>[] = [];

  // Check if any output is enabled
  const hasEnabledOutput = Object.values(mergedConfig.output).some(value => value);
  if (!hasEnabledOutput) {
    console.warn('No output formats are enabled in configuration');
    return { success: false, processedFiles, fileStatuses, originalOrder };
  }

  // Write enabled outputs
  if (mergedConfig.output.windsurf) {
    writePromises.push(fs.writeFile(path.join(baseDir, '.windsurfrules'), fullContent));
  }

  // Determine if we should write AGENTS.md (cursor and/or codex)
  const shouldWriteAgents = Boolean(mergedConfig.output.cursor || mergedConfig.output.codex);
  if (shouldWriteAgents) {
    writePromises.push(fs.writeFile(path.join(baseDir, 'AGENTS.md'), fullContent));

    // If cursor is enabled, remove legacy .cursorrules if it exists
    if (mergedConfig.output.cursor) {
      const legacyCursorPath = path.join(baseDir, '.cursorrules');
      try {
        await fs.unlink(legacyCursorPath);
      } catch (err: any) {
        // Ignore if file doesn't exist
        if (err && err.code !== 'ENOENT') {
          console.warn(`Warning: could not remove legacy .cursorrules: ${err.message || String(err)}`);
        }
      }
    }
  }

  if (mergedConfig.output.cline) {
    writePromises.push(fs.writeFile(path.join(baseDir, '.clinerules'), fullContent));
  }

  if (mergedConfig.output.claude) {
    writePromises.push(fs.writeFile(path.join(baseDir, 'CLAUDE.md'), fullContent));
  }

  if (mergedConfig.output.copilot) {
    const githubDir = path.join(baseDir, '.github');
    await fs.mkdir(githubDir, { recursive: true });
    writePromises.push(fs.writeFile(path.join(githubDir, 'copilot-instructions.md'), fullContent));
  }

  if (mergedConfig.output.customPath) {
    const customDir = path.dirname(path.join(baseDir, mergedConfig.output.customPath));
    await fs.mkdir(customDir, { recursive: true });
    writePromises.push(fs.writeFile(path.join(baseDir, mergedConfig.output.customPath), fullContent));
  }

  // Wait for all writes to complete
  await Promise.all(writePromises);

  return { 
    success: true, 
    processedFiles,
    fileStatuses,
    originalOrder
  };
}

export async function generate(config: Config) {
  try {
    const result = await generateRules({
      sources: config.sources,
      output: config.output,
      baseDir: process.cwd()
    });

    // Clear message at the start about success or failure
    if (result.success) {
      console.log('✅ AI context files generated successfully!');
    } else {
      console.warn('⚠️ No AI context files were generated.');
    }

    // Display file processing summary with a clearer header
    console.log('\nFiles for AI context:');
    
    // Use fileStatuses if available for detailed error info
    if (result.fileStatuses) {
      // Get all files and sort by original order if available
      const allFiles = Array.from(result.processedFiles.keys());
      
      // Sort by original order if available
      if (result.originalOrder) {
        allFiles.sort((a, b) => {
          const orderA = result.originalOrder?.get(a) || Number.MAX_SAFE_INTEGER;
          const orderB = result.originalOrder?.get(b) || Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
      }
      
      for (const file of allFiles) {
        const status = result.fileStatuses.get(file);
        if (status) {
          const mark = status.included ? '✓' : '✗';
          console.log(`${mark} ${file}${status.error ? ` (${status.error})` : ''}`);
        }
      }
    } else {
      // Fallback to basic processedFiles if fileStatuses is not available
      const files = Array.from(result.processedFiles.entries());
      
      // Sort by original order if available
      if (result.originalOrder) {
        files.sort(([a], [b]) => {
          const orderA = result.originalOrder?.get(a) || Number.MAX_SAFE_INTEGER;
          const orderB = result.originalOrder?.get(b) || Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
      }
      
      for (const [file, included] of files) {
        const mark = included ? '✓' : '✗';
        console.log(`${mark} ${file}`);
      }
    }

    // Final message about configuration if needed
    if (!result.success) {
      console.warn('\nCheck your .airul.json output configuration.');
    }
  } catch (error) {
    console.error('Error generating rules:', error);
    process.exit(1);
  }
}

async function findFiles(patterns: string[], baseDir: string): Promise<string[]> {
  const files = new Set<string>();
  
  for (const pattern of patterns) {
    try {
      // Normalize the pattern to use forward slashes
      const normalizedPattern = pattern.replace(/\\/g, '/');
      
      // Resolve the pattern relative to baseDir if it's not already absolute
      const resolvedPattern = path.isAbsolute(normalizedPattern) 
        ? normalizedPattern 
        : path.join(baseDir, normalizedPattern);
      
      const matches = await glob(resolvedPattern, {
        nodir: true,
        dot: true,
        follow: true // Follow symlinks
      });
      
      // Convert absolute paths back to relative paths
      matches.forEach(file => {
        const relativePath = path.relative(baseDir, file);
        files.add(path.normalize(relativePath));
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      console.warn(`Invalid glob pattern "${pattern}": ${errorMessage}`);
    }
  }
  
  return Array.from(files).sort();
}
