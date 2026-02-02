/**
 * Standalone entry point for the BullMQ worker
 * Run this file separately with PM2: pm2 start dist/src/worker.js
 * Or in development: tsx src/worker.ts
 */
import 'dotenv-safe/config';
import './services/sanaWorker';

// Keep the process alive
process.on('SIGINT', () => {
    console.log('Worker shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Worker shutting down gracefully...');
    process.exit(0);
});
