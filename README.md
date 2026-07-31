# Proxy API

A modular Node.js serverless proxy API deployed on Vercel. Forwards requests
to an external backend and returns clean, CORS-enabled JSON responses.

## Endpoints

### `GET /api/fullpp`
Query params: `img` (required), `num` or `number` (required)

Example:
```
/api/fullpp?img=https://example.com/photo.jpg&num=919876543210
```

### `GET /api/getpp`
Query params: `num` or `number` (required)

Example:
```
/api/getpp?num=919876543210
```

## Local Setup

```bash
npm install
```

## Deploy to GitHub + Vercel

1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: proxy API setup"
   ```

2. Create a new empty repo on GitHub (no README/license), then push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

3. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → **Add New → Project**
   → import your repo.

4. Framework Preset: **Other**
   Root Directory: `./`
   Build Command: (leave empty)
   Environment Variables: none required

5. Click **Deploy**. Vercel will give you a live URL, e.g.:
   ```
   https://proxy-api-yourusername.vercel.app
   ```

Every push to `main` auto-redeploys.

## Notes

- Upstream backend: `http://45.13.226.96:9024` — plain HTTP, not HTTPS.
- Requests time out after 10 seconds and retry up to 2 times on network-level
  failures (not on 4xx/5xx from the upstream server itself).
- Both `num` and `number` are accepted as aliases on either endpoint.
