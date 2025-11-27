import cron from 'node-cron';
import { config, reloadConfig } from './config.js';
import { logger } from './logger.js';
import { GitLabService } from './gitlab.js';

let gitlabService: GitLabService;

async function main() {
  logger.info('GitLab Pipeline Retry Service started');
  logger.info(`GitLab URL: ${config.gitlabUrl}`);
  logger.info(`Project ID: ${config.projectId}`);
  logger.info(`Monitoring pipeline IDs: ${config.pipelineIds.join(', ')}`);
  logger.info(`Check interval: ${config.checkInterval}`);
  logger.info(`Log level: ${config.logLevel}`);
  logger.info('---');

  gitlabService = new GitLabService();

  if (!cron.validate(config.checkInterval)) {
    logger.error('Invalid cron expression in CHECK_INTERVAL');
    process.exit(1);
  }

  logger.info('Running initial check...');
  await gitlabService.checkAndRetryAllPipelines();
  logger.info('Initial check completed');
  logger.info('---');

  logger.info(`Scheduling checks with cron: ${config.checkInterval}`);
  cron.schedule(config.checkInterval, async () => {
    logger.info('Scheduled check triggered');
    await gitlabService.checkAndRetryAllPipelines();
    logger.info('---');
  });

  logger.info('Scheduler is running. Press Ctrl+C to stop.');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGHUP', () => {
  logger.info('Received SIGHUP, reloading configuration...');
  try {
    const oldConfig = { ...config };
    const newConfig = reloadConfig();

    logger.info('Configuration reloaded successfully');
    logger.info(`GitLab URL: ${newConfig.gitlabUrl}`);
    logger.info(`Project ID: ${newConfig.projectId}`);
    logger.info(`Monitoring pipeline IDs: ${newConfig.pipelineIds.join(', ')}`);
    logger.info(`Log level: ${newConfig.logLevel}`);

    gitlabService = new GitLabService();
    logger.info('GitLab service reinitialized with new configuration');

    if (oldConfig.checkInterval !== newConfig.checkInterval) {
      logger.warn('CHECK_INTERVAL has changed, but cron schedule cannot be updated without restart');
      logger.warn(`Old: ${oldConfig.checkInterval}, New: ${newConfig.checkInterval}`);
      logger.warn('Please restart the service to apply the new check interval');
    }

    logger.info('---');
  } catch (error) {
    logger.error('Failed to reload configuration:', error);
    logger.error('Continuing with old configuration');
  }
});
