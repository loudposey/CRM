import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time, 'Connection successful!' as message`;
    console.log('✅ Database connection successful');
    console.log('Current time from DB:', result.rows[0].current_time);
    console.log('Message:', result.rows[0].message);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed');
    console.error('Error:', error.message);
    return false;
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1);
});