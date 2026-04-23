# games.maimons.dev

Browser-based logic and puzzle games. Pure static HTML/CSS/JS — no backend required.

Live at **[games.maimons.dev](https://games.maimons.dev)**

## Games

| Game | Type |
|---|---|
| Maze | Procedurally generated maze navigation |
| Sudoku | 9×9 logic grid, 3 difficulties |
| Minesweeper | Classic mine-clearing, 3 difficulties |
| 2048 | Sliding tile number puzzle |
| Sokoban | Push-box puzzles, 8 levels |
| Nonogram | Pixel-art logic puzzles |
| Lights Out | Toggle-neighbor grid puzzle |
| 15 Puzzle | Sliding tile sequence |
| Wordle | 5-letter word guessing |
| Traffic Jam | Rush Hour–style sliding car puzzle |
| Connect Dots | Flow Free–style path connection |
| Pong | Classic paddle arcade game vs AI |
| Tank | Drive and shoot arcade game |

## Local development

```bash
docker compose up
# → http://localhost:8080
```

## Deployment

Deployed to AWS S3 via GitHub Actions on every push to `main`. Served through Cloudflare CDN.

### Required GitHub secrets

| Secret | Description |
|---|---|
| `AWS_ROLE_ARN` | IAM role ARN with S3 write access (OIDC) |
| `AWS_REGION` | e.g. `us-east-1` |
| `S3_BUCKET` | Bucket name, e.g. `games.maimons.dev` |
| `CF_ZONE_ID` | Cloudflare zone ID (for cache purge) |
| `CF_API_TOKEN` | Cloudflare API token with Cache Purge permission |

### IAM role trust policy (OIDC)

The role must trust GitHub's OIDC provider:

```json
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
    "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:maimon33/games:*" }
  }
}
```
