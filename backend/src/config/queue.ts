import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { JobData } from '../../types/types';
require('dotenv').config();

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD,
});

const jobQueue = new Queue('SANA', { connection });

async function addJobToQueue(jobId: string, jobData: JobData) {
    console.log('Adding job to queue', jobId);
    await jobQueue.add(
        'SANA Job', 
        jobData,
        {
            jobId: jobId,
            attempts: 7,
            backoff: { type: 'exponential', delay: 5000}
        },
    );
}

async function updateJobInQueue(jobId: string, newJobData: Partial<JobData>) {
    const job = await jobQueue.getJob(jobId);
    if (job) {
        const currentData = job.data;
        const updatedData = { ...currentData, ...newJobData };
        
        await job.updateData(updatedData);
        console.log(`Job ${jobId} updated with data:`, job.data);
    } else {
        console.error(`Job ${jobId} not found in queue, could not update job data.`);
    }
}

async function getJobFromQueue(jobId: string) {
    const job = await jobQueue.getJob(jobId);
    return job;
}

async function getWaitingCount(){
    return jobQueue.getWaitingCount(); 
}

export { getWaitingCount, addJobToQueue, connection, getJobFromQueue, jobQueue, updateJobInQueue };