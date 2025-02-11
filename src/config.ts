import { cosmiconfig } from 'cosmiconfig';
import { AirulConfig } from './types';

const MODULE_NAME = 'airul';

const defaultConfig: AirulConfig = {
  sources: ['README.md', 'docs/*.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md'],
  output: {
    windsurf: true,
    cursor: true
  }
};

export async function loadConfig(configPath?: string): Promise<AirulConfig> {
  const explorer = cosmiconfig(MODULE_NAME);
  
  const result = configPath 
    ? await explorer.load(configPath)
    : await explorer.search();

  if (!result || !result.config) {
    return defaultConfig;
  }

  const config = result.config;
  
  // Merge with defaults
  return {
    ...defaultConfig,
    ...config,
    output: {
      ...defaultConfig.output,
      ...(config.output || {})
    },
    template: {
      ...defaultConfig.template,
      ...(config.template || {})
    }
  };
}
