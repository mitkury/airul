#!/usr/bin/env node

import { Command } from 'commander';
import { generateRules } from './index';
import { loadConfig } from './config';
import { AiruleConfig } from './types';
import { initProject } from './init';

const { version } = require('../package.json');

const program = new Command();

program
  .name('airule')
  .description('Generate rules from your documentation for Cursor, Windsurf, and other AI-powered IDEs')
  .version(version);

program
  .command('init')
  .description('Initialize AIRule in your project with a default configuration. Optionally specify a task to generate AI-specific instructions.')
  .argument('[task]', 'Optional task description that will be used to generate AI-specific instructions in TODO-AI.md')
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
  .description('Generate AI rules by scanning your documentation files. Creates .windsurfrules and .cursorrules files that help AI tools understand your project.')
  .option('-c, --config <path>', 'Path to .airulerc.json config file. Default: .airulerc.json in current directory')
  .option('-f, --files <globs...>', 'Source files to process (e.g., "docs/*.md"). Overrides sources in config file')
  .option('--no-windsurf', 'Disable .windsurfrules output for Windsurf IDE')
  .option('--no-cursor', 'Disable .cursorrules output for Cursor IDE')
  .option('--custom-output <path>', 'Path for additional custom rules output file')
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
