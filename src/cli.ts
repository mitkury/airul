#!/usr/bin/env node

import { Command } from 'commander';
import { generateRules } from './index';
import { loadConfig } from './config';
import { AiruleConfig } from './types';

const program = new Command();

program
  .name('airule')
  .description('Generate AI context rules from project documentation')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate AI rules from documentation')
  .option('-c, --config <path>', 'path to config file')
  .option('-f, --files <globs...>', 'source files to process')
  .option('--no-windsurf', 'disable .windsurfrules output')
  .option('--no-cursor', 'disable .cursorrules output')
  .option('--custom-output <path>', 'custom output file path')
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      
      const generateOptions: AiruleConfig = {
        ...config,
        sources: options.files || config.sources,
        output: {
          windsurf: options.windsurf ?? config.output.windsurf,
          cursor: options.cursor ?? config.output.cursor,
          customPath: options.customOutput || config.output.customPath
        }
      };

      await generateRules(generateOptions);
      console.log('Successfully generated AI rules');
    } catch (error) {
      console.error('Error generating rules:', error);
      process.exit(1);
    }
  });

program.parse();
