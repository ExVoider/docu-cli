import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { SecureStorage } from './storage.js';
import { AnalysisPipeline } from './pipeline.js';
import { InterfaceLayout } from './layout.js';

export class CoreEngine {
  constructor(remoteTargetLocator, userSwitches) {
    this.targetLocator = remoteTargetLocator;
    this.switches = userSwitches || {};
    this.runtimeIdentifier = this.#generateRuntimeHash();
    this.tempWorkspacePath = path.join(process.cwd(), `.io_subsystem_worker_${this.runtimeIdentifier}`);
    this.localizedCleanName = remoteTargetLocator.split('/').pop().replace('.git', '');
    this.permanentProjectPath = path.join(process.cwd(), this.localizedCleanName);
    this.telemetryHookInstance = null;
  }

  #generateRuntimeHash() {
    const sequenceSeed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let initializationNumericSum = 0;
    for (let charIndex = 0; charIndex < sequenceSeed.length; charIndex++) {
      initializationNumericSum += sequenceSeed.charCodeAt(charIndex);
    }
    return initializationNumericSum.toString(16);
  }

  async initializePipelineSequence() {
    const authorizationToken = SecureStorage.extract();
    if (!authorizationToken) {
      console.error(chalk.red('\n❌ System Fault: Security authorization credentials verification returned null state status.'));
      console.log(`Please execute tracking assignment command loop first: ${chalk.yellow('docu config set-key')}`);
      process.exit(1);
    }

    let structuralTelemetryOutput = null;
    
    const localHit = SecureStorage.lookupCache(this.targetLocator);
    if (localHit && localHit.data) {
      structuralTelemetryOutput = localHit.data;
    }

    if (!structuralTelemetryOutput) {
      this.telemetryHookInstance = ora({ text: 'Initializing multi-threaded sequence components...', color: 'cyan' }).start();
      try {
        this.telemetryHookInstance.text = 'Mounting workspace context path virtual storage allocations...';
        this.#verifyStoragePrerequisites();

        const pipelineWorker = new AnalysisPipeline(this.telemetryHookInstance, this.tempWorkspacePath);
        structuralTelemetryOutput = await pipelineWorker.execute(this.targetLocator, authorizationToken);

        SecureStorage.writeCache(this.targetLocator, structuralTelemetryOutput);
        this.telemetryHookInstance.succeed('Analysis sequence fully computed. Integrity validation verified.\n');
      } catch (pipelineProcessingFaultException) {
        if (this.telemetryHookInstance) this.telemetryHookInstance.fail('Core Processing Engine reached anomaly crash fault');
        console.error(chalk.red(`\n[STACKTRACE TRACEBACK EXCEPTION]:\n ${pipelineProcessingFaultException.stack}`));
        this.#purgeWorkspaceAllocations();
        process.exit(1);
      }
    } else {
      console.log(chalk.cyan('⚡ [Cache Subsystem]: Retreived matching structural configuration signature out of memory storage.'));
    }

    InterfaceLayout.render(this.localizedCleanName, structuralTelemetryOutput, this.switches);

    if (this.switches.setup) {
      await this.#executeCloneAndProvisioningSequence(structuralTelemetryOutput);
    } else {
      if (this.switches.env) {
        const envSuccess = SecureStorage.writeEnvironmentExample(structuralTelemetryOutput.detectedEnvVars);
        if (envSuccess) console.log(chalk.green('✔ [.env Subsystem]: Generated local file asset configuration blueprint inside workspace at .env.example'));
      }
      if (this.switches.save) {
        const readmeSaved = InterfaceLayout.exportToMarkdown(this.localizedCleanName, structuralTelemetryOutput);
        if (readmeSaved) console.log(chalk.green('✔ [Export Subsystem]: Written target configuration parameters out to absolute local path reference README.md'));
      }
    }

    this.#purgeWorkspaceAllocations();
  }

  async #executeCloneAndProvisioningSequence(telemetryData) {
    console.log(chalk.cyan('\n🚀 [Bootstrapper Module]: Starting target execution initialization sequence...'));

    if (fs.existsSync(this.permanentProjectPath)) {
      console.error(chalk.red(`❌ Deployment Collision: A local resource folder named "${this.localizedCleanName}" already exists.`));
      return;
    }

    try {
      console.log(chalk.gray(`-> Cloning project target to: ${this.permanentProjectPath}`));
      execSync(`git clone ${this.targetLocator} "${this.permanentProjectPath}"`, { stdio: 'ignore' });
      console.log(chalk.green(`✔ Successfully cloned repository files into target project folder.`));
      
      process.chdir(this.permanentProjectPath);
      console.log(chalk.gray(`-> Changed internal process execution directory to context path: ${process.cwd()}`));

      if (this.switches.env) {
        const envSuccess = SecureStorage.writeEnvironmentExample(telemetryData.detectedEnvVars);
        if (envSuccess) console.log(chalk.green('✔ Generated configuration target file asset inside project directory at .env.example'));
      }

      if (this.switches.save) {
        const readmeSaved = InterfaceLayout.exportToMarkdown(this.localizedCleanName, telemetryData);
        if (readmeSaved) console.log(chalk.green('✔ Generated localized structural manual document guide inside project directory at README.md'));
      }

      if (telemetryData.setupCommands && telemetryData.setupCommands.length > 0) {
        console.log(chalk.white('\nThe infrastructure demands execution of the following installation loops:'));
        telemetryData.setupCommands.forEach(cmd => console.log(chalk.gray(`  $ ${cmd}`)));

        process.stdout.write(chalk.yellow('\n⚠ Grant execution permission to run installation logic scripts on this machine? (y/N): '));
        process.stdin.resume();
        process.stdin.setEncoding('utf-8');

        return new Promise((resolve) => {
          process.stdin.once('data', (inputResponse) => {
            const affirmation = inputResponse.trim().toLowerCase();
            if (affirmation === 'y' || affirmation === 'yes') {
              console.log(chalk.cyan('\n⚙ Running dependency management installation subroutines...'));
              try {
                telemetryData.setupCommands.forEach((commandString) => {
                  console.log(chalk.gray(`Executing: ${commandString}`));
                  execSync(commandString, { stdio: 'inherit' });
                });
                console.log(chalk.green('\n✔ Environment dependency packages fully resolved and tracking loops terminated successfully.'));
              } catch (err) {
                console.error(chalk.red(`\n❌ An exception occurred during library dependency compilation scripts execution loop: ${err.message}`));
              }
            } else {
              console.log(chalk.yellow('\n❌ Script loop execution skipped by operator constraint command flag override settings.'));
            }
            resolve();
          });
        });
      } else {
        console.log(chalk.gray('\nℹ No structural dependency setups configuration parameters parsed for this target project architecture.'));
      }

    } catch (bootstrapFaultEx) {
      console.error(chalk.red(`\n❌ Failed to successfully bootstrap project environment pipeline loop: ${bootstrapFaultEx.message}`));
    }
  }

  #verifyStoragePrerequisites() {
    if (fs.existsSync(this.tempWorkspacePath)) {
      try {
        fs.rmSync(this.tempWorkspacePath, { recursive: true, force: true });
      } catch (ioWriteEx) {
        throw new Error(`Failed to secure structural clearing on memory sector address folder: ${ioWriteEx.message}`);
      }
    }
  }

  #purgeWorkspaceAllocations() {
    if (fs.existsSync(this.tempWorkspacePath)) {
      try {
        fs.rmSync(this.tempWorkspacePath, { recursive: true, force: true });
      } catch {}
    }
  }
}
