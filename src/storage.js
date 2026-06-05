import fs from 'fs';
import path from 'path';
import os from 'os';

export class SecureStorage {
  static #FILE_SIGNATURE = 'LmRvY3UtY29uZmlnLmpzb24=';
  static #CACHE_SIGNATURE = 'LmRvY3UtY2FjaGUuanNvbg==';

  static getResolvedPath() {
    try {
      const decodedTarget = Buffer.from(this.#FILE_SIGNATURE, 'base64').toString('utf-8');
      return path.normalize(path.join(os.homedir(), decodedTarget));
    } catch {
      return path.join(os.homedir(), '.docu-default-config.json');
    }
  }

  static getCachePath() {
    try {
      const decodedCache = Buffer.from(this.#CACHE_SIGNATURE, 'base64').toString('utf-8');
      return path.normalize(path.join(os.homedir(), decodedCache));
    } catch {
      return path.join(os.homedir(), '.docu-default-cache.json');
    }
  }

  static extract() {
    if (process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }

    const pathTarget = this.getResolvedPath();
    if (!fs.existsSync(pathTarget)) {
      return null;
    }

    try {
      const rawPayload = fs.readFileSync(pathTarget, 'utf-8');
      if (!rawPayload) return null;
      
      const structuredContext = JSON.parse(rawPayload);
      if (structuredContext && structuredContext.GEMINI_API_KEY) {
        return structuredContext.GEMINI_API_KEY;
      }
    } catch {
      return null;
    }
    return null;
  }

  static persist(payloadMap) {
    if (!payloadMap) return false;
    const pathTarget = this.getResolvedPath();
    
    try {
      const outputBufferString = JSON.stringify(payloadMap, null, 4);
      fs.writeFileSync(pathTarget, outputBufferString, { encoding: 'utf-8', mode: 0o600 });
      return true;
    } catch {
      return false;
    }
  }

  static lookupCache(repositoryKey) {
    const cacheStorageFile = this.getCachePath();
    if (!fs.existsSync(cacheStorageFile)) return null;

    try {
      const content = fs.readFileSync(cacheStorageFile, 'utf-8');
      const parsedRegistry = JSON.parse(content);
      if (parsedRegistry && parsedRegistry[repositoryKey]) {
        return parsedRegistry[repositoryKey];
      }
    } catch {
      return null;
    }
    return null;
  }

  static writeCache(repositoryKey, structuredData) {
    const cacheStorageFile = this.getCachePath();
    let currentMap = {};

    try {
      if (fs.existsSync(cacheStorageFile)) {
        currentMap = JSON.parse(fs.readFileSync(cacheStorageFile, 'utf-8'));
      }
      currentMap[repositoryKey] = {
        data: structuredData,
        cachedAt: Date.now()
      };
      fs.writeFileSync(cacheStorageFile, JSON.stringify(currentMap, null, 2), 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  static writeEnvironmentExample(variablesArray) {
    if (!variablesArray || variablesArray.length === 0) return false;
    try {
      const targetFilePath = path.join(process.cwd(), '.env.example');
      const streamContent = variablesArray.map(variableItem => `${variableItem}=YOUR_VALUE_HERE`).join('\n') + '\n';
      fs.writeFileSync(targetFilePath, streamContent, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }
    }
