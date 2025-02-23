import { cosmiconfig } from 'cosmiconfig';
import { AirulConfig } from './types';
import { promises as fs } from 'fs';
import * as path from 'path';

const MODULE_NAME = 'airul';

const defaultConfig: AirulConfig = {
  sources: ['TODO-AI.md', 'README.md'],
  output: {
    windsurf: true,
    cursor: true
  }
};

export async function loadConfig(configPath?: string): Promise<AirulConfig> {
  try {
    // If configPath is provided, use it directly
    let configFile = configPath;

    // If no configPath provided, look for .airul.json in current directory
    if (!configFile) {
      configFile = path.join(process.cwd(), '.airul.json');
    }

    try {
      // Try to read the config file directly
      const configContent = await fs.readFile(configFile, 'utf8');
      const config = JSON.parse(configContent);
      const finalConfig = {
        ...defaultConfig,
        ...config,
        sources: config.sources || defaultConfig.sources,
        output: {
          ...defaultConfig.output,
          ...(config.output || {})
        },
        template: {
          ...defaultConfig.template,
          ...(config.template || {})
        }
      };
      return finalConfig;
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        // If we were given a specific path and it doesn't exist, that's an error
        if (configPath) {
          throw new Error(`Config file not found: ${configPath}`);
        }
        // Otherwise, fall back to cosmiconfig
        const explorer = cosmiconfig(MODULE_NAME);
        const result = await explorer.search();
        if (result && result.config) {
          const config = result.config;
          const finalConfig = {
            ...defaultConfig,
            ...config,
            sources: config.sources || defaultConfig.sources,
            output: {
              ...defaultConfig.output,
              ...(config.output || {})
            },
            template: {
              ...defaultConfig.template,
              ...(config.template || {})
            }
          };
          return finalConfig;
        }
      } else {
        // If it's not a file not found error, rethrow
        throw readError;
      }
    }

    // If we get here, no config was found
    return defaultConfig;
  } catch (error) {
    console.warn('Error loading config:', error);
    return defaultConfig;
  }
}
