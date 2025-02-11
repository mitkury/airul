#!/usr/bin/env node

import { Command } from 'commander';
import { generateRules } from './index';
import { loadConfig } from './config';
import { AirulConfig } from './types';
import { initProject } from './init';

const { version } = require('../package.json');

const program = new Command();

program
  .name('airul')
  .description('Generate rules from your documentation for Cursor, Windsurf, and other AI-powered IDEs')
  .version(version);

program
  .command('init')
  .aliases(['i', 'initialize'])
  .description('Initialize AIrul in your project with a default configuration. Optionally specify a task to generate AI-specific instructions.')
  .argument('[task]', 'Optional task description that will be used to generate AI-specific instructions in TODO-AI.md')
  .action(async (task) => {
    try {
      const result = await initProject(process.cwd(), task);
      console.log('✨ AIrul initialized successfully!');
      console.log('- Created .airulrc.json with default configuration');
      console.log('- Updated .gitignore');
      console.log('- Created docs directory');
      if (result.taskCreated) {
        console.log('- Created TODO-AI.md with your task');
      }
      if (result.packageUpdated) {
        console.log('- Added airul as dev dependency');
        console.log('- Added npm script: npm run rules');
      }
      
      console.log('\nNext steps:');
      if (result.taskCreated) {
        console.log('1. Open your project in an AI-powered IDE');
        console.log('2. The AI will see your task and help you complete it');
      } else {
        console.log('1. Add your documentation to README.md and docs/');
        console.log('2. Run `npm run rules` to generate rule files');
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('generate')
  .aliases(['gen', 'g'])
  .description('Generate AI rules by scanning your documentation files. Creates .windsurfrules and .cursorrules files that help AI tools understand your project.')
  .option('-c, --config <path>', 'Path to .airulrc.json config file. Default: .airulrc.json in current directory')
  .option('-f, --files <globs...>', 'Source files to process (e.g., "docs/*.md"). Overrides sources in config file')
  .option('--no-windsurf', 'Disable .windsurfrules output for Windsurf IDE')
  .option('--no-cursor', 'Disable .cursorrules output for Cursor IDE')
  .option('--custom-output <path>', 'Path for additional custom rules output file')
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      
      const generateOptions: AirulConfig = {
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
