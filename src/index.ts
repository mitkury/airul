import { GenerateOptions } from './types';
import { loadConfig } from './config';
import { generateRules as generate, GenerateResult } from './generator';

/**
 * Generate rules from documentation files
 */
export async function generateRules(options: GenerateOptions): Promise<GenerateResult> {
  return await generate(options);
}

export { loadConfig };

export { initProject } from './init';
export { createNewProject } from './new';
export * from './types';
