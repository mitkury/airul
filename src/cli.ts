#!/usr/bin/env node

import { Command } from 'commander';
import { generateRules } from './index';
import { loadConfig } from './config';
import { AirulConfig } from './types';
import { initProject } from './init';
import { createNewProject } from './new';
import { execSync, spawn } from 'child_process';

const { version } = require('../package.json');

async function checkAndSelfUpdate(verbose = false): Promise<boolean> {
  try {
    // Get the latest version from npm
    const latestVersion = execSync('npm show airul version', { encoding: 'utf8' }).trim();
    
    if (latestVersion !== version) {
      if (verbose) {
        console.log('📦 Updating Airul...');
        console.log(`Current version: ${version}`);
        console.log(`Latest version:  ${latestVersion}`);
      }
      // Install the latest version globally
      execSync('npm install -g airul@latest', { stdio: verbose ? 'inherit' : 'ignore' });
      if (verbose) {
        console.log('✨ Successfully updated to latest version');
      }
      return true;
    } else if (verbose) {
      console.log('✨ Airul is already at the latest version');
    }
    return false;
  } catch (error) {
    if (verbose) {
      console.error('Error checking for updates:', error);
    }
    return false;
  }
}

const program = new Command();

// Check for updates after command execution
program.hook('postAction', async () => {
  await checkAndSelfUpdate(false);
});

program
  .name('airul')
  .description('Generate rules from your documentation for Cursor, Windsurf, and other AI-powered IDEs')
  .version(version);

program
  .command('update')
  .aliases(['upgrade', 'u'])
  .description('Update Airul to the latest version')
  .action(async () => {
    await checkAndSelfUpdate(true);
  });

program
  .command('init')
  .aliases(['i', 'initialize'])
  .description('Initialize Airul in your project with a default configuration. Optionally specify a task to generate AI-specific instructions.')
  .argument('[task]', 'Optional task description that will be used to generate AI-specific instructions in TODO-AI.md')
  .action(async (task) => {
    try {
      const result = await initProject(process.cwd(), task);
      console.log('✨ Airul initialized successfully!');
      console.log('- Created .airul.json with default configuration');
      console.log('- Updated .gitignore');
      console.log('- Created docs directory');
      if (result.taskCreated) {
        console.log('- Created TODO-AI.md with your task');
      }
      if (result.packageUpdated) {
        console.log('- Added airul as dev dependency');
        console.log('- Added npm script: npm run rules');
      }
      if (result.rulesGenerated) {
        console.log('- Generated initial AI rules');
      }
      
      console.log('\nNext steps:');
      if (result.taskCreated) {
        console.log('1. Open your project in an AI-powered IDE');
        console.log('2. The AI will see your task and help you complete it');
      } else if (!result.rulesGenerated) {
        console.log('1. Add your documentation to README.md and docs/');
        console.log('2. Run `npm run rules` to generate rule files');
      } else {
        console.log('1. Add more documentation to README.md and docs/');
        console.log('2. Run `npm run rules` to update rule files');
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
  .option('-c, --config <path>', 'Path to .airul.json config file. Default: .airul.json in current directory')
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

program
  .command('new')
  .aliases(['n'])
  .description('Create a new project directory and initialize Airul')
  .argument('<directory>', 'Directory name for the new project')
  .argument('<task>', 'Task description that will be used to generate AI-specific instructions')
  .option('--cursor', 'Open project in Cursor')
  .option('--vscode', 'Open project in Visual Studio Code')
  .option('--windsurf', 'Open project in Windsurf')
  .action(async (directory, task, options) => {
    try {
      await createNewProject(directory, task, options);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
