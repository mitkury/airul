#!/usr/bin/env node

import { Command } from 'commander';
import { generateRules } from './index';
import { loadConfig } from './config';
import { AiruleConfig } from './types';
import { initProject } from './init';

const program = new Command();

program
  .name('airule')
  .description('Generate AI context rules from project documentation')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize AIRule in your project')
  .argument('[task]', 'Task description for AI')
  .action(async (task) => {
    try {
      const result = await initProject(process.cwd(), task);
      console.log('✨ AIRule initialized successfully!');
      console.log('- Created .airulerc.json with default configuration');
      console.log('- Updated .gitignore');
      console.log('- Created docs directory');
      if (result.taskCreated) {
        console.log('- Created TODO-AI.md with your task');
      }
      
      console.log('\nNext steps:');
      if (result.taskCreated) {
        console.log('1. Open your project in an AI-powered IDE');
        console.log('2. The AI will see your task and help you complete it');
      } else {
        console.log('1. Add your documentation to README.md and docs/');
        console.log('2. Run `airule generate` to create rule files');
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

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
