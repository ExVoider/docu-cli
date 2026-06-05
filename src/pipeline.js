import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export class AnalysisPipeline {
  constructor(telemetryHook, workingDirectory) {
    this.hook = telemetryHook;
    this.root = workingDirectory;
    this.manifest = { structure: [], configs: {} };
    this.securityReport = { riskScore: 0, highRiskTriggers: [] };
    this.cursor = 0;
    this.BOUNDS = 400;
    this.EXCLUSION_MATRICES = new Set([
      '.git', 'node_modules', 'venv', '.env', 'package-lock.json', 'yarn.lock',
      'pnpm-lock.yaml', 'Documentation', 'docs', 'tests', 'test', 'samples', 
      'locales', 'arch', 'dist', 'build', 'out', 'vendor', '.github'
    ]);
  }

  async execute(target, token) {
    this.hook.text = 'Spawning structural git worker execution environment...';
    try {
      execSync(`git clone --depth 1 ${target} "${this.root}"`, { stdio: 'ignore', timeout: 45000 });
    } catch (gitExecutionFault) {
      throw new Error(`Failed to map repository pointer into active storage lanes: ${gitExecutionFault.message}`);
    }

    this.hook.text = 'Running algorithmic structural verification parsing loop...';
    this.traverse(this.root);

    if (this.manifest.structure.length === 0) {
      throw new Error('The target workspace context path evaluation contains zero traceable files.');
    }

    this.hook.text = 'Packaging data structures for structural AI core payload...';
    const client = new GoogleGenAI({ apiKey: token });

    const compilationContextSchemaPrompt = `
      Analyze this repository layout:
      Target Project URI Link Context: ${target}
      Total Active Scanned Tree Structure Files: ${JSON.stringify(this.manifest.structure)}
      Scanned Target Structural Config Assets: ${JSON.stringify(this.manifest.configs)}

      Respond strictly with a pure structural single line JSON map matching this structure interface template definition:
      {
        "purpose": "<string_data>",
        "architecture": ["<string>"],
        "detectedEnvVars": ["<string>"],
        "setupCommands": ["<string>"],
        "steps": [{"title":"<string>","details":"<string>"}]
      }
    `;

    const modelResponsePayload = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: compilationContextSchemaPrompt,
      config: {
        systemInstruction: "You are an automated code indexing system. Output raw JSON object strings ONLY. Never attach markdown markup code wraps.",
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    const parsedData = this.#processResponseText(modelResponsePayload.text);
    parsedData.security = this.securityReport;
    return parsedData;
  }

  traverse(currentScope, trackingPath = '') {
    if (this.cursor >= this.BOUNDS) return;

    let items = [];
    try {
      items = fs.readdirSync(currentScope);
    } catch { return; }

    for (const element of items) {
      if (this.cursor >= this.BOUNDS) break;
      if (this.EXCLUSION_MATRICES.has(element)) continue;

      const physicalPath = path.join(currentScope, element);
      const relativeContext = path.join(trackingPath, element);

      let contentDescriptorStat;
      try {
        contentDescriptorStat = fs.statSync(physicalPath);
      } catch { continue; }

      if (contentDescriptorStat.isDirectory()) {
        this.traverse(physicalPath, relativeContext);
      } else {
        this.cursor++;
        this.manifest.structure.push(relativeContext);
        
        const fileExt = element.toLowerCase();
        if (['package.json', 'requirements.txt', 'cargo.toml', 'go.mod', 'main.py', 'index.js', 'app.js', 'makefile', 'cmakelists.txt', 'dockerfile'].includes(fileExt)) {
          try {
            const rawFileContent = fs.readFileSync(physicalPath, 'utf-8');
            this.#auditFileSecurityHeuristics(element, rawFileContent);
            this.manifest.configs[element] = this.#sanitizeContentString(rawFileContent).substring(0, 4000);
          } catch {
            // Fault bypass path configurations
          }
        }
      }
    }
  }

  #auditFileSecurityHeuristics(fileName, codeContent) {
    const trackingRules = [
      { pattern: /eval\s*\(/g, risk: 20, desc: 'Execution engine manipulation signature (eval)' },
      { pattern: /exec\s*\(/g, risk: 35, desc: 'System environment runtime shell fork call (exec)' },
      { pattern: /child_process/g, risk: 15, desc: 'External thread allocation request interface' },
      { pattern: /base64,([A-Za-z0-9+/=]{40,})/g, risk: 30, desc: 'Dense obfuscated inline variable block injection' },
      { pattern: /atob\s*\(/g, risk: 10, desc: 'Binary array extraction hook usage pattern' }
    ];

    trackingRules.forEach((rule) => {
      if (rule.pattern.test(codeContent)) {
        this.securityReport.riskScore += rule.risk;
        this.securityReport.highRiskTriggers.push(`[${fileName}]: Detected pattern matcher reference -> ${rule.desc}`);
      }
    });
  }

  #sanitizeContentString(inputRawText) {
    if (!inputRawText) return '';
    return inputRawText
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
      .replace(/\r?\n|\r/g, '\n')
      .trim();
  }

  #processResponseText(textBuffer) {
    if (!textBuffer) throw new Error('Model execution layer sent back an empty data buffer stream response.');
    let polishedText = textBuffer.trim();
    if (polishedText.startsWith('```')) {
      polishedText = polishedText.replace(/^```json?/, '').replace(/```$/, '').trim();
    }
    try {
      return JSON.parse(polishedText);
    } catch (parseEx) {
      throw new Error(`Structural tracking schema data parser instantiation fault: ${parseEx.message}`);
    }
  }
}
