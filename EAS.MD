# EAS.md


## Intructions Before your first EAS build

```bash
Before your first EAS build, run these once locally:

npx eas-cli init       # links project to EAS, adds projectId to app.json
npx eas credentials    # configure iOS signing + Android keystore
Then add 3 secrets to GitHub (Settings → Secrets → Actions):

EXPO_TOKEN — from expo.dev → Account Settings → Access Tokens
EXPO_PUBLIC_SUPABASE_URL — from your .env.local
EXPO_PUBLIC_SUPABASE_ANON_KEY — from your .env.local
To trigger a production build: git tag v1.0.0 && git push origin v1.0.0
```