import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  gitlabUrl: string;
  gitlabToken: string;
  projectId: string;
  pipelineIds: number[];
  checkInterval: string;
  logLevel: 'info' | 'debug' | 'error';
}

function parseEnv(): Config {
  const gitlabUrl = process.env.GITLAB_URL;
  const gitlabToken = process.env.GITLAB_TOKEN;
  const projectId = process.env.GITLAB_PROJECT_ID;
  const pipelineIds = process.env.PIPELINE_IDS;
  const checkInterval = process.env.CHECK_INTERVAL || '*/1 * * * *';
  const logLevel = (process.env.LOG_LEVEL || 'info') as Config['logLevel'];

  if (!gitlabUrl) {
    throw new Error('GITLAB_URL is required in .env file');
  }

  if (!gitlabToken) {
    throw new Error('GITLAB_TOKEN is required in .env file');
  }

  if (!projectId) {
    throw new Error('GITLAB_PROJECT_ID is required in .env file');
  }

  if (!pipelineIds) {
    throw new Error('PIPELINE_IDS is required in .env file');
  }

  const parsedPipelineIds = pipelineIds
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));

  if (parsedPipelineIds.length === 0) {
    throw new Error('PIPELINE_IDS must contain at least one valid pipeline ID');
  }

  return {
    gitlabUrl,
    gitlabToken,
    projectId,
    pipelineIds: parsedPipelineIds,
    checkInterval,
    logLevel,
  };
}

let currentConfig = parseEnv();

export function getConfig(): Config {
  return currentConfig;
}

export function reloadConfig(): Config {
  dotenv.config({ override: true });
  currentConfig = parseEnv();
  return currentConfig;
}

export const config = currentConfig;
