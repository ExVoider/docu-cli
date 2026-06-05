#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { CoreEngine } from './src/core.js';
import { SecureStorage } from './src/storage.js';

program
  .version('3.0.0')
  .description('Enterprise Deep-Analysis Runtime Engine for Undocumented Repositories');

program
  .command('config')
  .description('Global configurations management system interface')
  .command('set-key')
  .description('Provision encryption key mapping for target LLM backend API cluster')
  .action(async () => {
    try {
      process.stdout.write(chalk.cyan('🔑 Enter production infrastructure API token hash: '));
      process.stdin.resume();
      process.stdin.setEncoding('utf-8');
      
      process.stdin.once('data', async (inputData) => {
        const structuralToken = inputData.trim();
        
        if (!structuralToken || structuralToken.length < 20) {
          console.error(chalk.red('\n❌ Invalid Context: Provided token signature sequence fails integrity checks.'));
          process.exit(1);
        }

        const operationalCarrier = {
          GEMINI_API_KEY: structuralToken,
          timestamp: Date.now(),
          integritySign: Math.random().toString(36).substring(7),
          environmentProfile: process.platform,
          systemArchitecture: process.arch
        };

        const successFlag = SecureStorage.persist(operationalCarrier);
        if (successFlag) {
          console.log(chalk.green(`\n✔ Memory state written successfully. Node cluster ready.`));
        } else {
          console.log(chalk.red(`\n❌ Critical write protection error encountered inside configuration driver.`));
        }
        process.exit(0);
      });
    } catch (bootstrapFault) {
      console.error(chalk.red(`Fatal error initialization step: ${bootstrapFault.message}`));
      process.exit(1);
    }
  });

program
  .arguments('[repo-target]')
  .description('Execute comprehensive pipeline analytics over specific remote registry context')
  .option('-s, --save', 'Write a clean Markdown asset directly into a local README.md file')
  .option('-e, --env', 'Scrape and synthesize placeholder variable keys to generate local .env.example')
  .option('-c, --scan', 'Run the heuristic evaluation array to look for suspicious syntax sequences')
  .option('-x, --setup', 'Trigger interactive system provisioning execution routines to resolve setups')
  .action(async (repoTarget, options) => {
    if (!repoTarget) {
      console.log(chalk.yellow('\n⚠️ No target contextual entry provided. Printing help interface maps...'));
      program.help();
      return;
    }

    if (!repoTarget.startsWith('http://') && !repoTarget.startsWith('https://')) {
      console.error(chalk.red('\n❌ Input Validation Error: Direct resource pointer must be a valid network URI format string.'));
      process.exit(1);
    }

    try {
      const frameworkBootstrapInstance = new CoreEngine(repoTarget, options);
      await frameworkBootstrapInstance.initializePipelineSequence();
    } catch (runtimeAbortException) {
      console.error(chalk.red(`\n[FATAL SYSTEM EXCEPTION]: ${runtimeAbortException.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
