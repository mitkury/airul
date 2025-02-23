import { GenerateOptions } from './types';
import { loadConfig } from './config';
import { generateRules as generate } from './generator';

/**
 * Generate rules from documentation files
 */
export async function generateRules(options: GenerateOptions): Promise<boolean> {
  const result = await generate(options);
  return result.success;
}

export { loadConfig };

export { initProject } from './init';
export { createNewProject } from './new';
export * from './types';
