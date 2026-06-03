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
  .version('1.2.0')
  .description('Custom Repository Intelligence Analysis Engine');

program
  .command('config')
  .description('Configure system properties')
  .command('set-key')
  .description('Save your Gemini API credential')
  .action(() => {
    process.stdout.write(chalk.cyan('🔑 Enter Gemini API Key: '));
    process.stdin.resume();
    process.stdin.setEncoding('utf-8');
    process.stdin.once('data', (data) => {
      const apiKey = data.trim();
      if (!apiKey) {
        console.log(chalk.red('❌ Input cannot be empty.'));
        process.exit(1);
      }
      fs.writeFileSync(CONFIG_PATH, JSON.stringify({ GEMINI_API_KEY: apiKey }, null, 2), 'utf-8');
      console.log(chalk.green(`\n✔ Configuration saved securely.`));
      process.exit(0);
    });
  });

program
  .arguments('[repo-url]')
  .action(async (repoUrl) => {
    if (!repoUrl) {
      program.help();
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      console.error(chalk.red('❌ Missing Operational Key.'));
      console.log(`Run: ${chalk.yellow('docu config set-key')}`);
      process.exit(1);
    }

    const spinner = ora({ text: 'Initializing engine...', color: 'cyan' }).start();
    const tempDir = path.join(process.cwd(), 'temp_analysis_repo');

    try {
      const ai = new GoogleGenAI({ apiKey });
      const repoName = repoUrl.split('/').pop().replace('.git', '');

      spinner.text = 'Cloning codebase workspace...';
      execSync(`git clone --depth 1 ${repoUrl} "${tempDir}"`, { stdio: 'ignore' });

      spinner.text = 'Mapping file tree structures...';
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
              manifest.configs[item] = fs.readFileSync(fullPath, 'utf-8').substring(0, 4000);
            }
          }
        }
      };

      scanDirectory(tempDir);

      spinner.text = 'Generating structural blueprint...';

      const systemInstruction = `
        You are a backend structural code analyzer. You must output data ONLY in valid, clean JSON matching the requested structure. 
        Do not output any markdown code blocks (like \`\`\`json) or conversational text. Output pure JSON text.
      `;

      const userPrompt = `
        Analyze this repository context and structure:
        Files: ${JSON.stringify(manifest.structure)}
        Configs: ${JSON.stringify(manifest.configs)}

        Respond ONLY with a JSON object following this format precisely:
        {
          "purpose": "A concise overview explaining what this codebase builds and its goal.",
          "architecture": ["Language/Runtime", "Main Library 1", "Main Library 2"],
          "steps": [
            { "title": "Prerequisites", "details": "What must be installed globally (e.g. Node, Python, keys)" },
            { "title": "Installation", "details": "The literal commands to install dependencies" },
            { "title": "Execution", "details": "The literal command lines to run or operate this codebase utility tool" }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: { 
          systemInstruction, 
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      spinner.succeed('Analysis verification successful.\n');

      const data = JSON.parse(response.text.trim());

      console.log(chalk.bgCyan.black(` 📦 REPOSITORY: ${repoName.toUpperCase()} `));
      console.log(chalk.cyan('═'.repeat(process.stdout.columns || 50)));
      
      console.log(`\n${chalk.cyan.bold('▪ PURPOSE & OVERVIEW')}`);
      console.log(chalk.white(`  ${data.purpose}`));

      console.log(`\n${chalk.cyan.bold('▪ DETECTED STACK & ARCHITECTURE')}`);
      if (Array.isArray(data.architecture)) {
        data.architecture.forEach(tech => console.log(`  ${chalk.dim('•')} ${chalk.gray(tech)}`));
      }

      console.log(`\n${chalk.cyan.bold('▪ OPERATION & IMPLEMENTATION STEPS')}`);
      if (Array.isArray(data.steps)) {
        data.steps.forEach((step, idx) => {
          console.log(`\n  ${chalk.cyan(idx + 1)}. ${chalk.bold(step.title)}`);
          const splitLines = step.details.split('\n');
          splitLines.forEach(line => console.log(`     ${chalk.white(line)}`));
        });
      }
      console.log(`\n${chalk.cyan('═'.repeat(process.stdout.columns || 50))}\n`);

    } catch (error) {
      spinner.fail('Analysis execution failure');
      console.error(chalk.red(`\nError details: ${error.message}`));
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

program.parse();
