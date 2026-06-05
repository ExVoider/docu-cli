import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export class InterfaceLayout {
  static render(identitySignature, compilationPayload, terminalFlags) {
    if (!compilationPayload) return;

    const columnLengthMarker = process.stdout.columns || 60;
    const interfaceBoundaryLine = chalk.cyan('═'.repeat(columnLengthMarker));
    const structuralSectionMarker = chalk.cyan('▪ ');

    console.log('\n');
    console.log(chalk.bgCyan.black(` 📦 REPOSITORY IDENTITY DESCRIPTOR MAPPING DETECTED: ${identitySignature.toUpperCase()} `));
    console.log(interfaceBoundaryLine);
    
    console.log(`\n${structuralSectionMarker}${chalk.cyan.bold('ANALYSIS STRUCTURAL OVERVIEW')}`);
    console.log(chalk.white(`  ${compilationPayload.purpose || 'No identifiable abstraction purpose returned by system.'}`));

    console.log(`\n${structuralSectionMarker}${chalk.cyan.bold('DISCOVERED ARCHITECTURAL ECOSYSTEM REGISTER')}`);
    if (compilationPayload.architecture && Array.isArray(compilationPayload.architecture)) {
      compilationPayload.architecture.forEach((frameworkElement) => {
        console.log(`  ${chalk.cyan('•')} ${chalk.gray(frameworkElement)}`);
      });
    }

    if (terminalFlags.scan && compilationPayload.security) {
      console.log(`\n${structuralSectionMarker}${chalk.cyan.bold('HEURISTIC SECURITY INTEGRITY VALUATION AUDIT')}`);
      const score = compilationPayload.security.riskScore;
      let displayScore = chalk.green(`${score} (Low Risk Score Match)`);
      
      if (score > 25 && score <= 60) displayScore = chalk.yellow(`${score} (Moderate Risk Structural Indicators Present)`);
      if (score > 60) displayScore = chalk.red(`${score} (High Threat Vector Index - Review Code Carefully)`);
      
      console.log(`  Current Threat Vector Calculation: ${displayScore}`);
      if (compilationPayload.security.highRiskTriggers.length > 0) {
        compilationPayload.security.highRiskTriggers.forEach(issue => console.log(`    ${chalk.red('•')} ${chalk.gray(issue)}`));
      }
    }

    console.log(`\n${structuralSectionMarker}${chalk.cyan.bold('INTERPRETED OPERATION SEQUENCE RUNTIME PIPELINE')}`);
    if (compilationPayload.steps && Array.isArray(compilationPayload.steps)) {
      compilationPayload.steps.forEach((stepContextNode, matrixIndex) => {
        const structuralIndexHeader = chalk.cyan(`${matrixIndex + 1}.`);
        console.log(`\n  ${structuralIndexHeader} ${chalk.bold(stepContextNode.title || 'Dynamic Execution Sequence Phase')}`);
        
        if (stepContextNode.details) {
          stepContextNode.details.split('\n').forEach((textSegmentLine) => {
            console.log(`     ${chalk.white(textSegmentLine)}`);
          });
        }
      });
    }
    console.log(`\n${interfaceBoundaryLine}\n`);
  }

  static exportToMarkdown(identitySignature, payload) {
    try {
      const targetFilePath = path.join(process.cwd(), 'README.md');
      let markdownBufferStream = `# ${identitySignature.toUpperCase()} - Repository Manual Document\n\n## Overview\n${payload.purpose}\n\n## Tech Stack Structure\n`;
      
      if (payload.architecture) {
        payload.architecture.forEach(tech => markdownBufferStream += `* ${tech}\n`);
      }
      
      markdownBufferStream += '\n## Detailed Implementation Operations Instructions Setup Sequences\n';
      if (payload.steps) {
        payload.steps.forEach((step) => {
          markdownBufferStream += `### ${step.title}\n${step.details}\n\n`;
        });
      }

      fs.writeFileSync(targetFilePath, markdownBufferStream, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }
}
