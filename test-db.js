require('dotenv').config({ path: '.env.local' });
const { testConnection } = require('./src/lib/db.ts');

testConnection().then((connected) => {
  if (connected) {
    console.log('✅ Database connection successful');
    process.exit(0);
  } else {
    console.log('❌ Database connection failed');
    process.exit(1);
  }
});