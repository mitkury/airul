import { cosmiconfig } from 'cosmiconfig';
import { AirulConfig } from './types';

const MODULE_NAME = 'airul';

const defaultConfig: AirulConfig = {
  sources: ['TODO-AI.md', 'README.md'],
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
  
  // Only use default config if no config file exists
  return {
    ...defaultConfig,
    ...config,
    // Don't merge sources with defaults, use config sources exclusively
    sources: config.sources,
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
