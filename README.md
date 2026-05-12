# poc_reactflow_rag_llm

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy With PM2

This project includes `ecosystem.config.cjs` for `pm2 deploy`.

### 1. Install PM2 locally and on the server

```bash
npm install -g pm2
```

The remote server must also have Node.js, npm, git, and PM2 installed.

### 2. Edit `ecosystem.config.cjs`

Update these values:

- `deploy.production.user`: SSH user on the server
- `deploy.production.host`: server IP or domain
- `deploy.production.repo`: git SSH URL for this repository
- `deploy.production.ref`: branch to deploy, for example `origin/main`
- `deploy.production.path`: deployment directory on the server

Example:

```js
deploy: {
  production: {
    user: "deploy",
    host: "example.com",
    ref: "origin/main",
    repo: "git@github.com:your-user/poc_reactflow_rag_llm.git",
    path: "/var/www/poc_reactflow_rag_llm",
    "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.cjs --env production",
  },
}
```

### 3. Prepare environment variables on the server

PM2 deploy checks out the git repo, so local untracked files like `.env` are not uploaded automatically.

After the first setup, create the production `.env` file on the server:

```bash
ssh deploy@example.com
mkdir -p /var/www/poc_reactflow_rag_llm/shared
nano /var/www/poc_reactflow_rag_llm/shared/.env
```

Use `.env.example` as the template:

```bash
ELASTICSEARCH_HOSTNAME=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
ELASTICSEARCH_PROTOCOL=http
```

Then link it into the current release:

```bash
ln -sfn /var/www/poc_reactflow_rag_llm/shared/.env /var/www/poc_reactflow_rag_llm/current/.env
```

### 4. First-time setup

Run this from your local machine:

```bash
pm2 deploy ecosystem.config.cjs production setup
```

Then create/link the `.env` file as shown above, and deploy:

```bash
pm2 deploy ecosystem.config.cjs production
```

### 5. Deploy future updates

Commit and push your changes first:

```bash
git push origin main
pm2 deploy ecosystem.config.cjs production
```

The `post-deploy` command will install dependencies, build the Next.js app, and reload the PM2 process:

```bash
npm install && npm run build && pm2 reload ecosystem.config.cjs --env production
```

### 6. Useful PM2 commands

Run these on the server:

```bash
pm2 status
pm2 logs poc-reactflow-rag-llm
pm2 restart poc-reactflow-rag-llm
pm2 save
```

Rollback to the previous release from your local machine:

```bash
pm2 deploy ecosystem.config.cjs production revert 1
```
