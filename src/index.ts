import cron from 'node-cron';
import { config } from './config.js';
import { logger } from './logger.js';
import { GitLabService } from './gitlab.js';

async function main() {
  logger.info('GitLab Pipeline Retry Service started');
  logger.info(`GitLab URL: ${config.gitlabUrl}`);
  logger.info(`Project ID: ${config.projectId}`);
  logger.info(`Monitoring pipeline IDs: ${config.pipelineIds.join(', ')}`);
  logger.info(`Check interval: ${config.checkInterval}`);
  logger.info(`Log level: ${config.logLevel}`);
  logger.info('---');

  const gitlabService = new GitLabService();

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
