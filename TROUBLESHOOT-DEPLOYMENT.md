# 🔍 Deployment Troubleshooting

## Issue: "Site Not Found" on Firebase Hosting

### Quick Diagnosis Steps:

1. **Check GitHub Actions:**

   - Go to: https://github.com/Hruda-Rockey10/GoldenZaika/actions
   - Look for the workflow run "Deploy to Firebase Hosting"
   - Check if it's:
     - ✅ Running (green/in progress)
     - ❌ Failed (red X)
     - ⏸️ Not triggered at all

2. **Common Issues:**

   **A) Workflow Not Triggering:**

   - Workflow file might not be on main branch
   - Check: GitHub → Code → `.github/workflows/firebase-hosting.yml` exists?

   **B) Missing Service Account Secret:**

   - Error: "firebaseServiceAccount is required"
   - Solution: Add `FIREBASE_SERVICE_ACCOUNT_GOLDEN_ZAIKA` secret

   **C) Build Failure:**

   - Look for errors in workflow logs
   - Usually environment variable issues

### Get Firebase Service Account (if missing):

Run this command and copy the output:

```bash
firebase login:ci
```

Then add as GitHub secret:

- Name: `FIREBASE_SERVICE_ACCOUNT_GOLDEN_ZAIKA`
- Value: (paste the token from above)

### Manual Deployment Alternative:

If GitHub Actions isn't working yet, deploy manually:

```bash
npm run build
firebase deploy --only hosting
```

This will deploy directly from your machine.

---

**What to do NOW:**

1. Check GitHub Actions page
2. Share what you see (is workflow running/failed/missing?)
3. I'll help debug from there
