import { Client } from 'pg';

const regions = [
    'aws-0-us-east-1', // Virginia (default)
    'aws-0-ap-southeast-1', // Singapore
    'aws-0-ap-southeast-2', // Sydney
    'aws-0-eu-central-1', // Frankfurt
    'aws-0-us-west-1', // California
];

const projectRef = 'vabaqkpslqyeipbssbin';
const password = 'Passport1%'; // URL encoded

async function probeRegion(region: string) {
    const host = `db.${projectRef}.supabase.co`; // Direct
    const poolerHost = `${region}.pooler.supabase.com`; // Pooler

    console.log(`\n--- Probing Region: ${region} ---`);

    // Test Direct
    const directUrl = `postgresql://postgres:${password}@${host}:5432/postgres`;
    // Test Pooler
    const poolerUrl = `postgresql://postgres.${projectRef}:${password}@${poolerHost}:6543/postgres?pgbouncer=true`;

    await testConnect(`Direct (${host})`, directUrl);
    // await testConnect(`Pooler (${poolerHost})`, poolerUrl);
}

async function testConnect(name: string, connectionString: string) {
    const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
    try {
        process.stdout.write(`Attempting ${name}... `);
        await client.connect();
        console.log('✅ SUCCESS!');
        await client.end();
    } catch (err: any) {
        if (err.message.includes('getaddrinfo ENOTFOUND')) {
            console.log('❌ Host Not Found (DNS)');
        } else {
            console.log(`❌ Error: ${err.message}`);
        }
    }
}

async function run() {
    console.log(`Project Ref: ${projectRef}`);
    // We only really need to check if the direct host resolves, 
    // but let's try connecting to see if we get a handshake.

    const directUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
    await testConnect('Direct Host', directUrl);
}

run();
