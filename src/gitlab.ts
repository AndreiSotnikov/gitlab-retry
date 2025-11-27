import { Gitlab } from '@gitbeaker/rest';
import { config } from './config.js';
import { logger } from './logger.js';

export class GitLabService {
  private api: InstanceType<typeof Gitlab>;

  constructor() {
    this.api = new Gitlab({
      host: config.gitlabUrl,
      token: config.gitlabToken,
    });
  }

  async checkAndRetryPipeline(pipelineId: number): Promise<void> {
    try {
      logger.debug(`Checking pipeline ${pipelineId}...`);

      const pipeline = await this.api.Pipelines.show(config.projectId, pipelineId);
      logger.debug(`Pipeline ${pipelineId} status: ${pipeline.status}`);

      // Get all jobs in the pipeline
      const jobs = await this.api.Jobs.all(config.projectId, { pipelineId });
      logger.debug(`Found ${jobs.length} jobs in pipeline ${pipelineId}`);

      let hasFailedJobs = false;
      let retriedCount = 0;

      // Check each job status and retry if failed
      for (const job of jobs) {
        logger.debug(`Job ${job.id} (${job.name}): ${job.status}`);

        if (job.status === 'failed') {
          hasFailedJobs = true;
          logger.info(`Job ${job.id} (${job.name}) has failed. Retrying...`);

          try {
            await this.api.Jobs.retry(config.projectId, job.id);
            logger.info(`Job ${job.id} (${job.name}) has been retried successfully`);
            retriedCount++;
          } catch (retryError) {
            logger.error(`Failed to retry job ${job.id} (${job.name}):`, retryError);
          }
        }
      }

      if (hasFailedJobs) {
        logger.info(`Pipeline ${pipelineId}: retried ${retriedCount} failed job(s)`);
      } else if (pipeline.status === 'success') {
        logger.debug(`Pipeline ${pipelineId}: all jobs successful, no action needed`);
      } else {
        logger.debug(`Pipeline ${pipelineId}: no failed jobs, current status: ${pipeline.status}`);
      }
    } catch (error) {
      logger.error(`Failed to check/retry pipeline ${pipelineId}:`, error);
    }
  }

  async checkAndRetryAllPipelines(): Promise<void> {
    logger.info(`Checking ${config.pipelineIds.length} pipeline(s)...`);

    const promises = config.pipelineIds.map((pipelineId) =>
      this.checkAndRetryPipeline(pipelineId)
    );

    await Promise.allSettled(promises);
  }
}
