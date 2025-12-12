import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const mask = (s: string | undefined) => s ? s.replace(/:[^:]+@/, ':***@') : 'undefined';

async function testConnection(name: string, connectionString: string | undefined) {
  console.log(`\nTesting ${name}: ${mask(connectionString)}`);
  if (!connectionString) {
    console.error(`❌ ${name} is undefined`);
    return;
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`✅ ${name} Connected!`);
    const res = await client.query('SELECT NOW() as now, version()');
    console.log(`   Time: ${res.rows[0].now}`);
    console.log(`   Version: ${res.rows[0].version}`);
    await client.end();
  } catch (err: any) {
    console.error(`❌ ${name} Failed: ${err.message}`);
    // console.error(err);
  }
}

async function run() {
  await testConnection('DIRECT_URL', process.env.DIRECT_URL);
  await testConnection('DATABASE_URL', process.env.DATABASE_URL);
}

run();
