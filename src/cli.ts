#!/usr/bin/env node
// Remove any --inspect flags that might be getting added
process.execArgv = process.execArgv.filter(arg => !arg.includes('--inspect'));

import { Command } from 'commander';
import { generateRules } from './index';
import { loadConfig } from './config';
import { AirulConfig } from './types';
import { initProject } from './init';
import { createNewProject } from './new';
import { execSync, spawn } from 'child_process';
import { getEditorOptions } from './utils';

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
  .option('--cursor', 'Enable Cursor editor output (default: enabled only when no other editors are specified)')
  .option('--windsurf', 'Enable Windsurf editor output (default: disabled)')
  .option('--copilot', 'Enable GitHub Copilot output (default: disabled)')
  .option('--code', 'Alias for --copilot')
  .option('--cline', 'Enable Cline VSCode extension output (default: disabled)')
  .option('--claude', 'Enable Claude output creating CLAUDE.md (default: disabled)')
  .option('--codex', 'Enable Codex output creating AGENTS.md (default: disabled)')
  .action(async (task, options) => {
    try {
      const result = await initProject(
        process.cwd(), 
        task, 
        process.env.NODE_ENV === 'test',
        getEditorOptions(options)
      );
      console.log('✨ Airul initialized successfully!');
      console.log('- Created .airul.json with default configuration');
      if (result.configUpdated) {
        console.log('- Updated configuration with editor options');
      }
      if (result.gitInitialized) {
        console.log('- Initialized git repository');
      } else if (result.gitExists) {
        console.log('- Using existing git repository');
      }
      if (result.taskCreated) {
        console.log('- Created TODO-AI.md with your task');
      }
      if (result.rulesGenerated) {
        console.log('- Generated initial AI rules');
      }
      
      console.log('\nNext steps:');
      if (result.taskCreated) {
        console.log('1. Open your project in an AI-powered IDE');
        console.log('2. The AI will see your task and help you complete it');
      } else if (!result.rulesGenerated) {
        console.log('1. Add your documentation to README.md or other files');
        console.log('2. Run airul generate to generate rule files');
      } else {
        console.log('1. Add more documentation to your project');
        console.log('2. Run airul generate to update rule files');
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('generate')
  .aliases(['gen', 'g'])
  .description('Generate AI rules by scanning your documentation files. Creates rule files based on your configuration.')
  .option('-c, --config <path>', 'Path to .airul.json config file. Default: .airul.json in current directory')
  .option('-s, --sources <globs...>', 'Source files to process (e.g., "docs/*.md"). Overrides sources in config file')
  .option('--windsurf', 'Enable .windsurfrules output for Windsurf IDE')
  .option('--cursor', 'Enable .cursorrules output for Cursor IDE')
  .option('--copilot', 'Enable GitHub Copilot output')
  .option('--code', 'Alias for --copilot')
  .option('--cline', 'Enable Cline VSCode extension output')
  .option('--claude', 'Enable Claude output creating CLAUDE.md')
  .option('--codex', 'Enable Codex output creating AGENTS.md')
  .option('--custom-output <path>', 'Path for additional custom rules output file')
  .action(async (options) => {
    try {
      // Try to load config first
      let config;
      try {
        config = await loadConfig(options.config);
      } catch (error) {
        // If config doesn't exist, tell the user to initialize first instead of auto-initializing
        console.error('Error: Airul is not initialized in this directory.');
        console.error('Please run "airul init" first to create a configuration file.');
        process.exit(1);
      }
      
      const editorOptions = getEditorOptions(options);

      // Only override config output values that are explicitly set in editorOptions
      const mergedOutput = {
        ...config.output,
        ...(editorOptions.cursor !== undefined ? { cursor: editorOptions.cursor } : {}),
        ...(editorOptions.windsurf !== undefined ? { windsurf: editorOptions.windsurf } : {}),
        ...(editorOptions.copilot !== undefined ? { copilot: editorOptions.copilot } : {}),
        ...(editorOptions.cline !== undefined ? { cline: editorOptions.cline } : {}),
        ...(editorOptions.claude !== undefined ? { claude: editorOptions.claude } : {}),
        ...(editorOptions.codex !== undefined ? { codex: editorOptions.codex } : {}),
        ...(options.customOutput ? { customPath: options.customOutput } : {})
      };

      const generateOptions: AirulConfig = {
        ...config,
        sources: options.sources || config.sources,
        output: mergedOutput
      };

      // Get result from generateRules
      const result = await generateRules(generateOptions);
      
      // Clear message at the start about success or failure
      if (result.success) {
        console.log('✅ AI context files generated successfully!');
      } else {
        console.warn('⚠️ No AI context files were generated.');
      }
      
      // Display file processing summary with a clearer header
      console.log('\nFiles for AI context:');
      if (result.fileStatuses) {
        const allFiles = new Set([...Array.from(result.processedFiles.keys())]);
        for (const file of Array.from(allFiles).sort()) {
          const status = result.fileStatuses.get(file);
          if (status) {
            const mark = status.included ? '✓' : '✗';
            console.log(`${mark} ${file}${status.error ? ` (${status.error})` : ''}`);
          }
        }
      } else {
        const sortedFiles = Array.from(result.processedFiles.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        for (const [file, included] of sortedFiles) {
          const mark = included ? '✓' : '✗';
          console.log(`${mark} ${file}`);
        }
      }

      // Final message about which editors are configured
      if (result.success) {
        // Get a list of enabled editors
        const enabledEditors = Object.entries(mergedOutput)
          .filter(([key, value]) => value === true && key !== 'customPath')
          .map(([key]) => key);
        
        if (enabledEditors.length > 0) {
          console.log(`\nOutput created for: ${enabledEditors.join(', ')}`);
        } else if (mergedOutput.customPath) {
          console.log(`\nOutput created for custom path: ${mergedOutput.customPath}`);
        }
      } else {
        console.warn('\nCheck your .airul.json output configuration.');
      }
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
  .option('--cursor', 'Enable and open in Cursor (enabled by default only when no other editors are specified)')
  .option('--windsurf', 'Enable and open in Windsurf')
  .option('--copilot', 'Enable and open in GitHub Copilot')
  .option('--code', 'Alias for --copilot')
  .option('--cline', 'Enable and open in VSCode with Cline extension')
  .option('--claude', 'Enable and create Claude instructions in CLAUDE.md')
  .option('--codex', 'Enable and create Codex instructions in AGENTS.md')
  .action(async (directory, task, options) => {
    try {
      // Check if any editor flag is present
      const hasAnyEditorEnabled = options.windsurf === true ||
        options.copilot === true ||
        options.code === true ||
        options.cline === true ||
        options.claude === true ||
        options.codex === true;

      // Convert presence of flags to boolean true
      const editorOptions = {
        // Enable cursor by default when no other editors are enabled
        // Only enable cursor by default when no editor is enabled
        cursor: options.cursor === undefined 
          ? !hasAnyEditorEnabled
          : true,
        windsurf: options.windsurf === undefined ? undefined : true,
        copilot: (options.copilot === undefined && options.code === undefined) ? undefined : true,
        cline: options.cline === undefined ? undefined : true,
        claude: options.claude === undefined ? undefined : true,
        codex: options.codex === undefined ? undefined : true
      };
      
      await createNewProject(directory, task, editorOptions);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
