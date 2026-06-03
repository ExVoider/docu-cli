#!/usr/bin/env node

import { program } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import ora from 'ora';
import { GoogleGenAI } from '@google/genai';

const CONFIG_PATH = path.join(os.homedir(), '.docu-config.json');

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;

  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (config.GEMINI_API_KEY) return config.GEMINI_API_KEY;
    } catch (e) {}
  }
  return null;
}

program
  .version('1.1.0')
  .description('Analyze an un-documented GitHub repo or configure tool properties.');

program
  .command('config')
  .description('Manage tool configurations')
  .command('set-key')
  .description('Interactively save your Gemini API credential')
  .action(() => {
    process.stdout.write(chalk.cyan('🔑 Please enter your Gemini API Key: '));
    
    process.stdin.resume();
    process.stdin.setEncoding('utf-8');
    
    process.stdin.once('data', (data) => {
      const apiKey = data.trim();
      
      if (!apiKey) {
        console.log(chalk.red('❌ Input cannot be empty. Operation aborted.'));
        process.exit(1);
      }

      const configData = { GEMINI_API_KEY: apiKey };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
      
      console.log(chalk.green(`\n✔ API key securely saved locally to: ${CONFIG_PATH}`));
      console.log(chalk.gray('You can now run "docu <repo-url>" freely without re-entering configuration credentials.'));
      process.exit(0);
    });
  });

program
  .arguments('[repo-url]')
  .description('The full GitHub repository link to scan and analyze')
  .action(async (repoUrl) => {
    if (!repoUrl) {
      program.help();
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      console.error(chalk.red('❌ Missing operational credential: GEMINI_API_KEY could not be found.'));
      console.log(`Please run: ${chalk.yellow('docu config set-key')} to link your profile key cleanly before execution.`);
      process.exit(1);
    }

    const spinner = ora('Initializing analysis pipeline...').start();
    const tempDir = path.join(process.cwd(), 'temp_analysis_repo');

    try {
      const ai = new GoogleGenAI({ apiKey });

      spinner.text = 'Cloning target repository (shallow clone)...';
      execSync(`git clone --depth 1 ${repoUrl} "${tempDir}"`, { stdio: 'ignore' });

      spinner.text = 'Scanning codebase architecture...';
      const manifest = { structure: [], configs: {} };

      const scanDirectory = (dirPath, relativePath = '') => {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          if (['.git', 'node_modules', 'venv', '.env', 'package-lock.json', 'yarn.lock'].includes(item)) continue;

          const fullPath = path.join(dirPath, item);
          const currentRelPath = path.join(relativePath, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath, currentRelPath);
          } else {
            manifest.structure.push(currentRelPath);
            if (['package.json', 'requirements.txt', 'cargo.toml', 'go.mod', 'main.py', 'index.js', 'app.js'].includes(item.toLowerCase())) {
              manifest.configs[item] = fs.readFileSync(fullPath, 'utf-8').substring(0, 5000);
            }
          }
        }
      };

      scanDirectory(tempDir);

      spinner.text = 'Analyzing with Gemini Engine...';
      
      const systemInstruction = `
        You are an elite software documentation engine. Your task is to analyze raw codebase indicators from a repository that completely lacks operational documentation. 
        Synthesize the structure and configurations, then print a crisp terminal guide.
        Use clean, standard Markdown. Bold headers elegantly. Never wrap your entire output in a single markdown code-block block.
      `;

      const userPrompt = `
        Analyze this repository.
        Repository URL: ${repoUrl}
        Files Tracked: ${JSON.stringify(manifest.structure, null, 2)}
        Critical Code/Config Context: ${JSON.stringify(manifest.configs, null, 2)}
        
        Provide your output exactly matching this layout structure:
        # [Repository Name] Operational Intelligence Report
        ---
        ## 📊 Purpose & Overview
        [Explain clearly what this tool does, its underlying utility, and the core problem it solves.]
        ## 🏗️ Architecture Design
        [List primary programming languages, runtimes, and external modules.]
        ## 🚀 Step-by-Step Operation Guide
        ### 1. System Requirements & Prerequisite Installations
        ### 2. Dependency Resolution
        ### 3. Execution & Configuration
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: { systemInstruction, temperature: 0.2 }
      });

      spinner.succeed('Analysis complete!\n');
      console.log(response.text);

    } catch (error) {
      spinner.fail('Pipeline Execution Interrupted');
      console.error(chalk.red(`\nError details: ${error.message}`));
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

program.parse();
