/**
 * Test Sentry Integration
 * 
 * Run with: npx tsx scripts/test-sentry.ts
 * 
 * ⚠️ DELETE this file after testing
 */

import * as Sentry from '@sentry/node';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSentryIntegration() {
    const sentryDsn = process.env.SENTRY_DSN;

    if (!sentryDsn) {
        console.error('❌ SENTRY_DSN not set in environment');
        console.error('   Add SENTRY_DSN=https://xxx@xxx.sentry.io/xxx to backend/.env');
        process.exit(1);
    }

    console.log('🔍 Testing Sentry integration...\n');
    console.log(`   DSN: ${sentryDsn.substring(0, 30)}...`);

    try {
        // Initialize Sentry
        Sentry.init({
            dsn: sentryDsn,
            environment: 'test',
            tracesSampleRate: 1.0,
        });

        console.log('✅ Sentry initialized');

        // Capture a test message
        Sentry.captureMessage('SeaCaster test event: Sentry integration working!', 'info');
        console.log('✅ Test message sent');

        // Capture a test exception
        try {
            throw new Error('SeaCaster test exception: Intentional error for testing');
        } catch (error) {
            Sentry.captureException(error);
            console.log('✅ Test exception captured');
        }

        // Flush events
        await Sentry.flush(5000);
        console.log('✅ Events flushed to Sentry');

        console.log('\n🎉 Sentry integration test passed!');
        console.log('\n📌 Next steps:');
        console.log('   1. Check Sentry dashboard for 2 test events');
        console.log('   2. Add SENTRY_DSN to Doppler (optional)');
        console.log('   3. Configure alerts in Sentry dashboard');
        console.log('   4. Delete this test file');

    } catch (error: any) {
        console.error('❌ Sentry test failed:', error.message);
        process.exit(1);
    }
}

testSentryIntegration();
