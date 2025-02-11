import { GenerateOptions } from './types';
import { loadConfig } from './config';
import { generateRules as generate } from './generator';

/**
 * Generate rules from documentation files
 */
export async function generateRules(options: GenerateOptions): Promise<boolean> {
  return generate(options);
}

export { loadConfig };

export { initProject } from './init';
export { createNewProject } from './new';
export * from './types';
