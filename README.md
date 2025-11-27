# GitLab Pipeline Retry Service

Automatic monitoring and retry service for failed GitLab pipeline jobs.

## Features

- Automatic scheduled checking of job statuses within specified pipelines
- Retry only failed jobs (status `failed`) without restarting the entire pipeline
- Configurable check interval using cron expressions
- Support for monitoring multiple pipelines simultaneously
- Detailed logging of each job status with configurable verbosity levels
- Written in TypeScript with full type safety

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Edit the `.env` file:

```env
# Your GitLab instance URL
GITLAB_URL=https://gitlab.com

# GitLab Personal Access Token
# Create a token with api scope: Settings → Access Tokens → Personal Access Token
GITLAB_TOKEN=your_gitlab_personal_access_token_here

# GitLab Project ID
GITLAB_PROJECT_ID=12345

# Pipeline IDs to monitor (comma-separated)
PIPELINE_IDS=123,456,789

# Check interval in cron format (default: every minute)
CHECK_INTERVAL=*/1 * * * *

# Log level: info | debug | error
LOG_LEVEL=info
```

### Getting GitLab Token

1. Open GitLab → Settings → Access Tokens
2. Create a Personal Access Token with `api` scope
3. Copy the token to the `.env` file

### Getting Project ID

Project ID can be found on the project's main page under its name.

### Getting Pipeline ID

Pipeline ID can be found in the URL when viewing a pipeline:
```
https://gitlab.com/username/project/-/pipelines/123456
                                                 ^^^^^^
                                              Pipeline ID
```

## Running

### Development Mode

```bash
npm run dev
```

### Production Run

```bash
# Build the project
npm run build

# Start the service
npm start
```

### Running with Process Manager (Recommended)

#### PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the service
pm2 start npm --name "gitlab-retry" -- start

# Enable auto-start on system reboot
pm2 startup
pm2 save

# View logs
pm2 logs gitlab-retry

# Stop the service
pm2 stop gitlab-retry
```

#### systemd (Linux)

Create a file `/etc/systemd/system/gitlab-retry.service`:

```ini
[Unit]
Description=GitLab Pipeline Retry Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/gitlab-retry
ExecStart=/usr/bin/node /path/to/gitlab-retry/dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable gitlab-retry
sudo systemctl start gitlab-retry
sudo systemctl status gitlab-retry
```

## Cron Expression Examples

```bash
*/1 * * * *   # Every minute
*/5 * * * *   # Every 5 minutes
*/15 * * * *  # Every 15 minutes
0 * * * *     # Every hour
0 */2 * * *   # Every 2 hours
0 9 * * *     # Every day at 9:00 AM
```

## How It Works

1. On startup, the script performs an initial check of all specified pipelines
2. Then starts a scheduler (cron) that checks pipelines according to the specified schedule
3. For each pipeline:
   - Retrieves the list of all jobs within the pipeline via GitLab API
   - Checks the status of each job
   - If a job's status is `failed` - only that job is retried (not the entire pipeline)
   - If all jobs are `success` - no action required
   - If jobs are in `running`, `pending`, etc. status - waits

4. The script runs indefinitely and continues to retry failed jobs until they complete successfully
5. When multiple jobs fail in one pipeline - all of them will be retried

## Logging Levels

- `error` - errors only
- `info` - informational messages + errors (default)
- `debug` - detailed information about each check

## Architecture

```
src/
├── config.ts      # Configuration parsing and validation from .env
├── logger.ts      # Logging with levels
├── gitlab.ts      # GitLab API integration using @gitbeaker/rest
└── index.ts       # Main logic and scheduler
```

## Requirements

- Node.js >= 18
- GitLab Personal Access Token with `api` scope

## License

ISC
