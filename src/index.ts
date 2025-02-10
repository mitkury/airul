import { GenerateOptions } from './types';
import { loadConfig } from './config';
import { generateRules as generate } from './generator';

export { GenerateOptions, AiruleConfig } from './types';

export async function generateRules(options: GenerateOptions): Promise<void> {
  return generate(options);
}

export { loadConfig };
