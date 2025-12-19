// scripts/signManifest.ts
// Sign the Farcaster manifest for Mini App registration
// Run with: npx ts-node scripts/signManifest.ts

import { createWalletClient, http, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism } from "viem/chains";
import * as fs from "fs";
import * as path from "path";

// Your domain
const DOMAIN = "seacaster.app";

// Read private key from environment
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY environment variable not set");
    console.log("\nRun with:");
    console.log("  doppler run -- npx ts-node scripts/signManifest.ts");
    process.exit(1);
}

async function signManifest() {
    console.log("🔐 Signing Farcaster Manifest for:", DOMAIN);
    console.log("");

    // Create account from private key
    const account = privateKeyToAccount(
        PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY as `0x${string}` : `0x${PRIVATE_KEY}`
    );
    console.log("👤 Signing with address:", account.address);

    // Create the header (JSON Web Signature format)
    const header = {
        fid: 0, // Will be filled when you have your FID
        type: "custody",
        key: account.address,
    };

    // Create the payload
    const payload = {
        domain: DOMAIN,
    };

    // Encode as base64url
    const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");

    // Create message to sign
    const message = `${headerB64}.${payloadB64}`;

    // Sign the message
    const signature = await account.signMessage({
        message: message,
    });

    // Create the account association object
    const accountAssociation = {
        header: headerB64,
        payload: payloadB64,
        signature: signature,
    };

    console.log("\n✅ Manifest Signed!");
    console.log("\n📋 Copy this into your .well-known/farcaster.json:");
    console.log("");
    console.log('"accountAssociation": ' + JSON.stringify(accountAssociation, null, 2));
    console.log("");

    // Option to auto-update the manifest
    const manifestPath = path.join(__dirname, "..", ".well-known", "farcaster.json");

    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        manifest.accountAssociation = accountAssociation;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log("✅ Updated .well-known/farcaster.json automatically!");
    } catch (e) {
        console.log("⚠️  Could not auto-update manifest. Copy the above manually.");
    }

    console.log("\n🚀 Next steps:");
    console.log("1. Deploy to Vercel: vercel --prod");
    console.log("2. Test manifest: curl https://seacaster.app/.well-known/farcaster.json");
    console.log("3. Submit to: https://warpcast.com/~/developers/mini-apps");
}

signManifest().catch(console.error);
