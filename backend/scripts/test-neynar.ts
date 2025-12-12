/**
 * Test Neynar API Free Tier Endpoints
 * 
 * Run with: npx tsx scripts/test-neynar.ts
 * 
 * ⚠️ DELETE this file after testing
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function testNeynarConnection() {
    const neynarKey = process.env.NEYNAR_SEA_KEY;

    if (!neynarKey) {
        console.error('❌ NEYNAR_SEA_KEY not set in environment');
        process.exit(1);
    }

    console.log('🔍 Testing Neynar API endpoints...\n');
    console.log(`   API Key: ${neynarKey.substring(0, 8)}...`);

    const headers = { 'x-api-key': neynarKey };

    // Test 1: Signer API (3k RPM on free tier)
    try {
        console.log('\n📝 Test 1: Checking API key validity...');
        const signerResponse = await axios.get(
            'https://api.neynar.com/v2/farcaster/user?fid=3',
            { headers }
        );
        console.log('✅ API Key works! Got user:', signerResponse.data?.user?.username);
    } catch (error: any) {
        console.log('⚠️ User lookup:', error.response?.data?.message || error.message);
    }

    // Test 2: Cast by hash (should work on free)
    try {
        console.log('\n📝 Test 2: Fetching a cast...');
        const castResponse = await axios.get(
            'https://api.neynar.com/v2/farcaster/cast?identifier=0x0cac3b41c8d5b45f1e6bcbe5dc5b3f5f0b8a4c59&type=hash',
            { headers }
        );
        if (castResponse.data?.cast) {
            console.log('✅ Cast lookup works!');
        }
    } catch (error: any) {
        console.log('⚠️ Cast lookup:', error.response?.data?.message || error.message);
    }

    // Test 3: Channel info (should work on free)
    try {
        console.log('\n📝 Test 3: Fetching channel info...');
        const channelResponse = await axios.get(
            'https://api.neynar.com/v2/farcaster/channel?id=base',
            { headers }
        );
        if (channelResponse.data?.channel) {
            console.log('✅ Channel lookup works! Channel:', channelResponse.data.channel.name);
        }
    } catch (error: any) {
        console.log('⚠️ Channel lookup:', error.response?.data?.message || error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Neynar Starter Plan Limits:');
    console.log('   • General APIs: 300 RPM');
    console.log('   • Frame Validate: 5,000 RPM');
    console.log('   • Signer APIs: 3,000 RPM');
    console.log('   • Cast Search: 60 RPM');
    console.log('   • Global Total: 500 RPM');
    console.log('='.repeat(50));
}

testNeynarConnection();
