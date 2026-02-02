import { Worker, Job } from 'bullmq';
import { JobData } from '../../types/types';
import { connection } from '../config/queue';
import { spawn } from 'child_process';
import fs from 'fs';
import { updateJobInQueue } from '../config/queue';
import * as path from 'path';
import { isSana2Options, SANA_LOCATIONS, validateSanaVersion } from '../config/modelOptions';
require('dotenv').config();

console.log("Worker started");

const worker = new Worker('SANA', async (job: Job) => {
        console.log("Worker Started Processing Job: ", job.id);
        await jobWorker(job.id, job.data);
        console.log("Worker Completed Job: ", job.id);
    },
    {
        connection,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
        concurrency: 1,
        useWorkerThreads: true,
    },
);

worker.on('failed', (job: Job | undefined, error: Error, prev: string) => {

    console.error(`Job failed:`, { jobId: job?.id, error: error.message, prev });
});

worker.on('completed', (job: Job, returnvalue: any) => {

    console.log(`Job completed:`, { jobId: job.id, returnvalue });
});  

// Simple validation to ensure input is safe for shell execution (must be a number/simple string)
const sanitizeShellInput = (input: any): string => {
    const s = String(input);
    // Basic check: only allow simple characters, numbers, dots, and hyphens.
    // If complex paths/filenames are expected, this must be more robust.
    if (/^[a-zA-Z0-9.\-/_]+$/.test(s)) {
        return s;
    }
    // If validation fails, return a safe, empty string or throw error.
    console.warn(`Unsafe input detected and sanitized: ${s}`);
    return ''; 
};

const jobWorker = async (jobId: string, jobData: JobData) => {

        // Sanitize inputs
        const safeJobId = sanitizeShellInput(jobId);
        const safeJobData = {
            network1Name: sanitizeShellInput(jobData.network1Name),
            network2Name: sanitizeShellInput(jobData.network2Name),
            extension: sanitizeShellInput(jobData.extension),
            modelVersion: sanitizeShellInput(jobData.modelVersion),
        };

        validateSanaVersion(jobData.modelVersion);

        const outputFile = path.resolve(`${jobData.jobLocation}`, 'sana_runtime.log');
        const sanaLocation = SANA_LOCATIONS[jobData.modelVersion];
        
        let optionString = `cd "${jobData.jobLocation}" && "${sanaLocation}" `;

        console.log(`Executing command for job ${safeJobId}:`, optionString);
        
        if (jobData.extension === '.el') {
            optionString += `-fg1 networks/${safeJobData.network1Name}/${safeJobData.network1Name}.el `;
            optionString += `-fg2 networks/${safeJobData.network2Name}/${safeJobData.network2Name}.el `;
        } else {
            optionString += `-g1 ${safeJobData.network1Name} `;
            optionString += `-g2 ${safeJobData.network2Name} `;
        }

        optionString += '-tinitial auto ';
        optionString += '-tdecay auto ';

        for (const [option, value] of Object.entries(jobData.options?.standard || {})) {
            optionString += ` -${option} ${value} `;
        }

        if (jobData.modelVersion === 'SANA2' && isSana2Options(jobData.modelVersion, jobData.options)) {
            const esim = jobData.options?.advanced?.esim;
            // if (esim && esim.length > 0) { // bug: would always add -esim option even if user didn't specify any
            if (esim && (esim[0] > 0)) {
                const numFiles = esim.length;
                // Add external similarity weights (-esim)
                optionString += `-esim ${numFiles} `;
                // Add all weights
                optionString += `${esim.join(' ')} `;
                // Add similarity filenames (-simFile)
                optionString += `-simFile ${numFiles} `;
                // Add paths to all similarity files
                for (let i = 0; i < numFiles; i++) {
                    optionString += `similarityFiles/sim_${i} `;
                }
                // Add similarity formats (-simFormat)
                optionString += `-simFormat ${numFiles} `;
                // Add format '1' (node names) for each file
                optionString += `${Array(numFiles).fill('1').join(' ')} `;
            }
        }
        
        console.log('optionstring!:', optionString);

        return new Promise((resolve, reject) => {
            const child = spawn('bash', ['-c', optionString], {'shell': true});
            const logStream = fs.createWriteStream(outputFile, { flags: 'a', autoClose: false });

            let stdout = '';
            // let stderr = '';
            let fileDescriptor: number | null = null;
            let streamReady = true;

            logStream.on('open', (fd: number) => {
                fileDescriptor = fd;
            });

            const writeToStream = (data: Buffer) => {
                if (streamReady) {
                    streamReady = logStream.write(data);
                    if (fileDescriptor) {
                        fs.fdatasync(fileDescriptor, (err) => {
                            if (err) throw err;
                            console.log('Data flushed to disk.');
                
                            // wstream.end(); // Close the stream after flushing
                        });
                    }
                        

                    if (!streamReady) {
                        logStream.once('drain', () => {
                            streamReady = true;
                        });
                    }
                }
            };


            
            child.stdout.on('data', async (data: Buffer) => {
                const dataStr = data.toString();
                stdout += dataStr;
                // Optional: log in real-time
                console.log(`Job ${safeJobId} stdout data.toString():`, data.toString());
                console.log(`Job ${safeJobId} stdout data:`, data);
                // logStream.write(data);
                writeToStream(data);
                await updateJobInQueue(safeJobId, { execLogFileOutput: stdout });
            });
            
            child.stderr.on('data', async (data: Buffer) => {
                stdout += data.toString();
                console.warn(`Job ${safeJobId} stderr:`, data.toString());
                logStream.write(data);
                await updateJobInQueue(safeJobId, { execLogFileOutput: stdout });
            });
            
            child.on('close', async (code) => {
                logStream.end();
                if (code === 0) {
                    console.log(`Job ${jobId} completed successfully with code ${code}`);

                } else {
                    console.error(`Job ${jobId} failed with code ${code}`);
                    await updateJobInQueue(jobId, { 
                        error: `Process exited with code ${code}`
                    });
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
            
            child.on('error', async (error) => {
                console.error(`Job ${jobId} error:`, error);
                logStream.end();
                await updateJobInQueue(jobId, { 
                    error: error.message
                });
                reject(error);
            });
        });

}

export { worker, jobWorker };