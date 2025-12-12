# Production-Grade Secrets Management for SeaCaster

## 🔐 Security-First Doppler Setup

### Critical Security Principles

1. **Never pass secrets as CLI arguments** - Bash history will log them
2. **Use `read -sp` for input** - Silent prompt, no history
3. **Isolate projects** - Compromise of one doesn't expose others
4. **Verify file permissions** - 600 for tokens, 700 for directories
5. **One-time scripts** - Never commit to git

---

## 🚀 Production Setup Script

**Run once, then delete:**

```bash
#!/bin/bash
# setup-doppler-seacaster.sh
# Execute once: bash setup-doppler-seacaster.sh
# Then DELETE this file

set +o history  # Disable bash history

echo "🔐 Doppler Secrets Setup for SeaCaster"
echo "======================================="

# 1. Install Doppler (if not installed)
if ! command -v doppler &> /dev/null; then
  echo "📦 Installing Doppler CLI..."
  npm install -g @dopplerhq/cli
fi

# 2. Authenticate
echo "🔑 Authenticating with Doppler..."
doppler login

# 3. Create isolated projects (not shared)
echo "📁 Creating isolated Doppler projects..."
doppler projects create seacaster 2>/dev/null || echo "✓ SeaCaster project exists"

# 4. Create environment configs
echo "⚙️  Creating environment configs..."
doppler configs create dev --project seacaster 2>/dev/null || true
doppler configs create staging --project seacaster 2>/dev/null || true
doppler configs create prod --project seacaster 2>/dev/null || true

# 5. Input secrets securely (no history exposure)
echo ""
echo "Enter secrets (input is hidden):"
echo "--------------------------------"

read -sp "BASESCAN_API_KEY: " BASESCAN_API_KEY && echo
read -sp "ALCHEMY_BASE_KEY (optional): " ALCHEMY_BASE_KEY && echo
read -sp "FARCASTER_APP_SECRET: " FARCASTER_APP_SECRET && echo
read -sp "TESTNET_PRIVATE_KEY (0x...): " TESTNET_PRIVATE_KEY && echo

# 6. Store in Doppler (dev environment)
echo ""
echo "🔒 Storing secrets in Doppler..."

doppler secrets set BASESCAN_API_KEY "$BASESCAN_API_KEY" --project seacaster --config dev
[ -n "$ALCHEMY_BASE_KEY" ] && doppler secrets set ALCHEMY_BASE_KEY "$ALCHEMY_BASE_KEY" --project seacaster --config dev
doppler secrets set FARCASTER_APP_SECRET "$FARCASTER_APP_SECRET" --project seacaster --config dev
doppler secrets set TESTNET_PRIVATE_KEY "$TESTNET_PRIVATE_KEY" --project seacaster --config dev

# 7. Set network constants (non-sensitive)
echo "🌐 Setting network constants..."
doppler secrets set BASE_SEPOLIA_RPC "https://sepolia.base.org" --project seacaster --config dev
doppler secrets set USDC_SEPOLIA "0x036CbD53842c5426634e7929541eC2318f3dCF7e" --project seacaster --config dev
doppler secrets set CHAIN_ID "84532" --project seacaster --config dev

# 8. Secure Doppler directory
echo "🔐 Securing Doppler token..."
chmod 700 ~/.doppler/ 2>/dev/null
chmod 600 ~/.doppler/.doppler-token 2>/dev/null
chmod 600 ~/.doppler/config.json 2>/dev/null

set -o history  # Re-enable history

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. DELETE THIS SCRIPT: rm setup-doppler-seacaster.sh"
echo "2. Verify secrets: doppler secrets --project seacaster --config dev"
echo "3. Run your app: cd contracts && doppler run --config dev -- npm run deploy:sepolia"
echo ""
echo "🔗 Project setup in each directory:"
echo "   cd contracts && doppler setup --no-interactive"
echo "   cd backend && doppler setup --no-interactive"
echo ""
echo "🚨 IMPORTANT: This script is NOT tracked in git. Delete it now!"
```

---

## 📦 Project Integration

### **Contracts Package**

```json
{
  "scripts": {
    "setup": "doppler setup --no-interactive",
    "compile": "doppler run -- npx hardhat compile",
    "deploy:sepolia": "doppler run --config dev -- npx hardhat run scripts/deploy.ts --network base-sepolia",
    "deploy:mainnet": "doppler run --config prod -- npx hardhat run scripts/deploy.ts --network base",
    "verify": "doppler run -- npx hardhat verify"
  }
}
```

**Usage:**
```bash
cd contracts
npm run setup              # One-time: links to Doppler project
npm run deploy:sepolia    # Secrets auto-injected
```

### **Backend Package**

```json
{
  "scripts": {
    "setup": "doppler setup --no-interactive",
    "dev": "doppler run --config dev -- tsx src/server.ts",
    "start": "doppler run --config prod -- node dist/server.js"
  }
}
```

### **Frontend Package**

```json
{
  "scripts": {
    "setup": "doppler setup --no-interactive",
    "dev": "doppler run --config dev -- next dev",
    "build": "doppler run --config prod -- next build"
  }
}
```

---

## 🔗 Multi-Project Sharing (Secure Way)

**For multiple Base L2 projects (SeaCaster, GeoDrawer, etc.):**

```bash
# Create each project separately
doppler projects create seacaster
doppler projects create geodrawer
doppler projects create fisherapp

# Set SHARED secrets in EACH project (isolated)
doppler secrets set BASESCAN_API_KEY "same_key_value" --project seacaster --config dev
doppler secrets set BASESCAN_API_KEY "same_key_value" --project geodrawer --config dev
doppler secrets set BASESCAN_API_KEY "same_key_value" --project fisherapp --config dev
```

**Why isolated projects?**
- ✅ Compromise of one doesn't expose others
- ✅ Different team members can have different access levels
- ✅ Easier to rotate keys per-project
- ✅ Audit logs show which project accessed what

**Alternative: Use Doppler Secrets Sync**
```bash
# Master project with shared keys
doppler projects create base-master

# Sync to child projects (Doppler Enterprise feature)
# This maintains isolation while centralizing management
```

---

## 🛡️ Security Verification Checklist

```bash
# Run after setup

# 1. Check Doppler directory permissions
ls -la ~/.doppler/
# Should show: drwx------ (700)

ls -la ~/.doppler/.doppler-token
# Should show: -rw------- (600)

# 2. Verify bash history doesn't contain secrets
history | grep -i "basescan\|private\|alchemy"
# Should return: nothing

# 3. Check if .env files exist (they shouldn't)
find . -name ".env" -not -path "*/node_modules/*"
# Should return: nothing (except .env.example)

# 4. Verify Doppler auth
doppler me
# Should show: your email

# 5. List secrets (doesn't show values)
doppler secrets --project seacaster --config dev
# Should list: BASESCAN_API_KEY, etc. (values hidden)

# 6. Test injection
doppler run --config dev -- env | grep BASESCAN
# Should show: BASESCAN_API_KEY=your_key (only during execution)
```

---

## 🔄 Key Rotation Workflow

**Quarterly rotation (every 90 days):**

```bash
# 1. Generate new API key on BaseScan
# https://basescan.org/myapikey

# 2. Update in Doppler (all projects)
doppler secrets set BASESCAN_API_KEY "new_key_here" --project seacaster --config dev
doppler secrets set BASESCAN_API_KEY "new_key_here" --project seacaster --config prod
# Repeat for other projects

# 3. Verify update
doppler secrets --project seacaster --config dev | grep BASESCAN
# Should show: BASESCAN_API_KEY (updated timestamp)

# 4. Redeploy services (they'll pick up new key automatically)
cd backend && railway up
cd frontend && vercel --prod

# 5. Revoke old key on BaseScan
# https://basescan.org/myapikey > Delete
```

---

## 🚨 Emergency: Compromise Response

**If a key is leaked:**

```bash
# 1. Immediately rotate in Doppler
doppler secrets set PRIVATE_KEY "new_key" --project seacaster --config prod

# 2. Revoke old key
# - For API keys: revoke on provider dashboard
# - For private keys: transfer funds to new wallet

# 3. Check audit log
doppler activity --project seacaster
# Review: who accessed what and when

# 4. Force all services to restart (pick up new key)
railway restart --environment production

# 5. Update team
# Notify team via Slack/email
```

---

## 📊 Doppler Audit Log Review

**Monthly security audit:**

```bash
# View all activity
doppler activity --project seacaster

# Look for:
# - Unexpected secret access
# - Access from unknown IPs
# - Access at unusual times (3am)
# - Bulk secret exports
```

**Enable alerts:**
```bash
# Doppler dashboard > Settings > Webhooks
# Add webhook for: secret_updated, secret_deleted
# Endpoint: https://your-api.com/security-alerts
```

---

## 🎯 Final Recommendations

### **For SeaCaster Production:**

1. **Use separate Doppler projects:**
   - `seacaster-contracts-dev`
   - `seacaster-contracts-prod`
   - `seacaster-backend-dev`
   - `seacaster-backend-prod`
   - `seacaster-frontend-prod`

2. **Hardware wallet for mainnet:**
   ```typescript
   // hardhat.config.ts
   base: {
     url: process.env.BASE_MAINNET_RPC,
     ledgerAccounts: [
       "0x6ADef5fC93160A7d4F64c274946F52a573DC9b92"
     ]
   }
   ```

3. **Never store mainnet private keys in Doppler** - Use Ledger/Trezor

4. **Enable 2FA on Doppler account**

5. **Use service tokens for CI/CD:**
   ```bash
   # GitHub Actions
   doppler configs tokens create ci-token --project seacaster --config prod --max-uses 1000
   # Add to GitHub Secrets as DOPPLER_TOKEN
   ```

---

## 📝 `.gitignore` Essentials

```bash
# .gitignore (root)
.env
.env.local
.env.*.local
.doppler/
*.pem
*.key
hardhat-keys.json
setup-doppler*.sh
```

---

## ✅ Setup Complete Checklist

- [ ] Doppler CLI installed
- [ ] Ran setup script
- [ ] **DELETED setup script**
- [ ] Verified `~/.doppler/` permissions (700)
- [ ] Verified `.doppler-token` permissions (600)
- [ ] Tested `doppler run` in each package
- [ ] Added `doppler run` to all npm scripts
- [ ] Verified no secrets in bash history
- [ ] Verified no `.env` files committed
- [ ] Enabled 2FA on Doppler account
- [ ] Set up quarterly key rotation reminder
- [ ] Documented emergency response plan
- [ ] Team has Doppler access (not raw keys)

**All secrets now live in Doppler's encrypted vault, never on disk.** 🔐
