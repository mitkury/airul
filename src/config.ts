import { cosmiconfig } from 'cosmiconfig';
import { AiruleConfig } from './types';

const MODULE_NAME = 'airule';

const defaultConfig: AiruleConfig = {
  sources: ['README.md', 'docs/*.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md'],
  output: {
    windsurf: true,
    cursor: true
  }
};

export async function loadConfig(configPath?: string): Promise<AiruleConfig> {
  const explorer = cosmiconfig(MODULE_NAME);
  
  try {
    const result = configPath 
      ? await explorer.load(configPath)
      : await explorer.search();

    if (!result) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...result.config
    };
  } catch (error) {
    console.error('Error loading configuration:', error);
    return defaultConfig;
  }
}
