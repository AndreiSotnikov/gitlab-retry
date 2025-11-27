# Installation and Usage Guide for GitLab Pipeline Retry Service

## Package Contents

The `gitlab-retry-public.zip` archive contains:
- Source code (`src/`)
- Configuration files (`package.json`, `tsconfig.json`)
- Configuration example (`.env.example`)
- Documentation (`README.md`)

**Important:** The archive does NOT contain:
- `node_modules/` - dependencies (will be installed automatically)
- `dist/` - compiled files (will be created during build)
- `.env` - your personal settings and tokens (must be created manually)

## Quick Start

### Step 1: Extract the Archive

```bash
unzip gitlab-retry-public.zip -d gitlab-retry
cd gitlab-retry
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configuration Setup

1. Create `.env` file from the example:

```bash
cp .env.example .env
```

2. Edit the `.env` file and fill in the required parameters:

```env
# Your GitLab instance URL
GITLAB_URL=https://gitlab.com

# GitLab Personal Access Token
GITLAB_TOKEN=YOUR_TOKEN_HERE

# GitLab Project ID
GITLAB_PROJECT_ID=12345

# Pipeline IDs to monitor (comma-separated)
PIPELINE_IDS=123,456,789

# Check interval (every minute by default)
CHECK_INTERVAL=*/1 * * * *

# Log level
LOG_LEVEL=info
```

### Step 4: Getting Required Information

#### GitLab Personal Access Token

1. Open GitLab → **Settings** → **Access Tokens**
2. Create a new **Personal Access Token** with the following scope:
   - ✅ `api` - full API access
3. Copy the generated token and paste it into the `.env` file in the `GITLAB_TOKEN` parameter

**Important:** Save the token in a secure location, it is only shown once!

#### Project ID

Project ID can be found on the project's main page under its name:

```
Project ID: 12345
```

#### Pipeline ID

Pipeline ID can be found in the URL when viewing a pipeline:

```
https://gitlab.com/username/project/-/pipelines/123456
                                                 ^^^^^^
                                              Pipeline ID
```

You can specify multiple pipeline IDs separated by commas:
```env
PIPELINE_IDS=123456,123457,123458
```

### Step 5: Build the Project

```bash
npm run build
```

### Step 6: Run

#### Development Mode (with auto-reload)

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

## Configuring Cron Interval

The `CHECK_INTERVAL` parameter uses cron syntax:

```bash
*/1 * * * *   # Every minute
*/5 * * * *   # Every 5 minutes
*/15 * * * *  # Every 15 minutes
0 * * * *     # Every hour
0 */2 * * *   # Every 2 hours
0 9 * * *     # Every day at 9:00 AM
```

## Running as a Service

### PM2 (Recommended for All Platforms)

```bash
# Install PM2 globally
npm install -g pm2

# Start the service
pm2 start npm --name "gitlab-retry" -- start

# Configure auto-start on system reboot
pm2 startup
pm2 save

# View logs
pm2 logs gitlab-retry

# Stop the service
pm2 stop gitlab-retry

# Restart the service
pm2 restart gitlab-retry
```

### systemd (Linux Only)

1. Create a file `/etc/systemd/system/gitlab-retry.service`:

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

2. Activate and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable gitlab-retry
sudo systemctl start gitlab-retry

# Check status
sudo systemctl status gitlab-retry

# View logs
sudo journalctl -u gitlab-retry -f
```

## Verifying Operation

After starting, you should see in the logs:

```
[INFO] GitLab Retry Service started
[INFO] Monitoring pipelines: 123, 456, 789
[INFO] Check interval: */1 * * * *
[INFO] Running initial check...
[INFO] Pipeline 123: Checking 5 jobs...
[INFO] Pipeline 123: Job #1 (build) - Status: success
[INFO] Pipeline 123: Job #2 (test) - Status: failed - Retrying...
[INFO] Pipeline 123: Job #2 retried successfully
```

## Frequently Asked Questions

### How do I add a new pipeline to monitor?

Add its ID to the `.env` file separated by commas:

```env
PIPELINE_IDS=123,456,789,999
```

Restart the service.

### What happens if a job keeps failing?

The service will continue to retry failed jobs on each check until they complete successfully. If a job is failing due to a code error, fix the code in the repository.

### How do I increase log verbosity?

Change in the `.env` file:

```env
LOG_LEVEL=debug
```

### Are special permissions required for the token?

Yes, the token must have `api` scope to access the GitLab API and be able to retry jobs.

## Requirements

- **Node.js**: >= 18.0.0
- **NPM**: >= 8.0.0
- **GitLab Personal Access Token** with `api` scope

## Project Structure

```
gitlab-retry/
├── src/
│   ├── config.ts      # Configuration parsing and validation
│   ├── logger.ts      # Logging system
│   ├── gitlab.ts      # GitLab API integration
│   └── index.ts       # Main logic and scheduler
├── dist/              # Compiled files (created during build)
├── node_modules/      # Dependencies (created by npm install)
├── .env               # Your configuration (create from .env.example)
├── .env.example       # Configuration example
├── package.json       # Project dependencies
├── tsconfig.json      # TypeScript settings
└── README.md          # Documentation
```

## Security

- **Never** commit the `.env` file to git
- Keep your GitLab token secure
- Use tokens with minimal necessary permissions
- Regularly rotate tokens

## Support

Detailed documentation is available in the `README.md` file.
