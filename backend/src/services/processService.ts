import * as fs from 'fs';
import * as path from 'path';
import HttpError from '../middlewares/HttpError';
import { ProcessJobData } from '../../types/types';
import { getJobFromQueue } from '../config/queue';

// interface JobInfo {
//     status: string;
//     data?: {
//         id: string;
//         jobLocation: string;
//         extension: string;
//         network1Name: string;
//         network2Name: string;
//         modelVersion: string;
//     };
//     options?: {
//         standard: Record<string, string | number | boolean>;
//         advanced?: {
//             esim?: string[];
//         };
//     };
//     log?: string;
//     command?: string;
//     zipName?: string;
// }

// interface JobProcessResult {
//     success?: boolean;
//     status: string;
//     redirect?: string;
// }



// export interface ProcessJobData {
//     success: boolean;
//     status: string;
//     jobId: string;
//     execLogFileOutput?: string;
//     redirect?: string;

//     // maybe
//     note?: string;
//     zipDownloadUrl?: string;
// }
const jobProcess = async (jobId: string): Promise<ProcessJobData> => {
    // Step 1: Check that there is an id supplied - done in controller
    console.log("Attempting to add job to queue: ", jobId);
    const jobDir = path.join(__dirname, '../process', jobId);

    // Step 2: Check that the job exists in the BullMQ queue
    const job = await getJobFromQueue(jobId);
    if (!job) {
        return {
            jobId: undefined,
            success: false,
            status: `ERROR: Job does not exist in queue.`,
            redirect: `/lookup-job/${jobId}`,
            execLogFileOutput: null,
        };
    }

    const jobStatus = await job.getState();

    if (jobStatus === 'completed' || jobStatus === 'failed') {
        const execLogFilePath = path.join(jobDir, 'sana_runtime.log');
        let execLogFileOutput = '';
        if (fs.existsSync(execLogFilePath)) {
            try {
                const execLogFileContent = fs.readFileSync(execLogFilePath, 'utf8');
                execLogFileOutput = execLogFileContent;
            } catch (err) {
                execLogFileOutput = 'Problem opening execution log file.';
            }
        } else {
            execLogFileOutput = `Job execution log file at ${execLogFilePath} does not exist.`;
        }

        return {
            jobId: jobId,
            success: jobStatus === 'completed',
            status: jobStatus === 'completed' ? 'Job has been completed.' : 'Job failed.',
            redirect: `/lookup-job/${jobId}`,
            execLogFileOutput: execLogFileOutput,
        };

    }
    
    return { 
        jobId: jobId, 
        success: false,
        status: `Job Status is ${jobStatus}.`, 
        redirect: `/lookup-job/${jobId}`,
    };



    // Step 4: Generate the command string
    // let optionString = '';
    // const { id, jobLocation, extension, network1Name, network2Name, modelVersion } = info.data;
    // const { options } = info;
    // console.log("95: command-line options: ", options)
    // console.log("shape of info", info); //TESTING

    // validateSanaVersion(modelVersion);
    // const sanaLocation = SANA_LOCATIONS[modelVersion];

    // //EDIT SANA LOCATION HERE IF NEEDED
    // optionString += `cd "${jobLocation}" && "${sanaLocation}" `;

    // if (extension === '.el') {
    //     optionString += `-fg1 networks/${network1Name}/${network1Name}.el `;
    //     optionString += `-fg2 networks/${network2Name}/${network2Name}.el `;
    // } else {
    //     optionString += `-g1 ${network1Name} `;
    //     optionString += `-g2 ${network2Name} `;
    // }

    // optionString += '-tinitial auto ';
    // optionString += '-tdecay auto ';

    // // Append SANA execution options
    // for (const [option, value] of Object.entries(options?.standard || {})) {
    //     optionString += ` -${option} ${value} `;
    // }

    // if (modelVersion === 'SANA2' && isSana2Options(modelVersion, options)) {
    //     const esim = options?.advanced?.esim;
    //     // if (esim && esim.length > 0) { // bug: would always add -esim option even if user didn't specify any
    //     if (esim && (esim[0] > 0)) {
    //         // console.log("adding -esim options...");
    //         const numFiles = esim.length;
    //         // Add external similarity weights (-esim)
    //         optionString += `-esim ${numFiles} `;
    //         // Add all weights
    //         optionString += `${esim.join(' ')} `;
    //         // Add similarity filenames (-simFile)
    //         optionString += `-simFile ${numFiles} `;
    //         // Add paths to all similarity files
    //         for (let i = 0; i < numFiles; i++) {
    //             optionString += `similarityFiles/sim_${i} `;
    //         }
    //         // Add similarity formats (-simFormat)
    //         optionString += `-simFormat ${numFiles} `;
    //         // Add format '1' (node names) for each file
    //         optionString += `${Array(numFiles).fill('1').join(' ')} `;
    //     }
    // }
    // console.log('optionstring!:', optionString); //TESTING

    // // Step 5: Run the script
    // return new Promise<ProcessJobData>((resolve, reject) => {
    //     console.log('Current working directory:', process.cwd());
    //     console.log('Job location:', jobLocation);
        
    //     // Open the log file and get its descriptor
    //     const logFile = fs.openSync(path.join(jobLocation, 'run.log'), 'a');
        
    //     // Use file descriptors for stdout and stderr
    //     const child = spawn('sh', ['-c', optionString], { 
    //         cwd: jobLocation,
    //         stdio: ['ignore', logFile, logFile]  // Use file descriptor for both stdout and stderr
    //     });
        
    //     child.on('error', (error) => {
    //         console.error('Failed to start command:', error);
    //         fs.closeSync(logFile);  // Close the file descriptor
    //         reject(error);
    //     });
        
    //     child.on('close', (code) => {
    //         fs.closeSync(logFile);  // close the file descriptor
    //         if (code !== 0) { // SANA failed during execution 
    //             const failedInfo: FailedJobInfoFile = {
    //                 status: 'failed',
    //                 log: path.join(jobLocation, 'error.log'),
    //                 command: optionString,
    //             };
    //             fs.writeFileSync(infoFilePath, JSON.stringify(failedInfo));
                
    //             // check if run.log exists
    //             const runLogPath = path.join(jobLocation, 'run.log');
    //             console.log('Does run.log exist after error?', fs.existsSync(runLogPath));
    //             if (fs.existsSync(runLogPath)) {
    //                 console.log('run.log contents:', fs.readFileSync(runLogPath, 'utf8'));
    //             }
                
    //             resolve({
    //                 jobId,
    //                 success: false,
    //                 status: 'Networks could not be aligned.',
    //                 redirect: `/lookup-job/${jobId}`,
    //             });
    //         } else { // SANA executed successfully
    //             // check if run.log exists
    //             const runLogPath = path.join(jobLocation, 'run.log');
    //             console.log('Does run.log exist after success?', fs.existsSync(runLogPath));
    //             if (fs.existsSync(runLogPath)) {
    //                 console.log('run.log contents:', fs.readFileSync(runLogPath, 'utf8'));
    //             }
                
    //             // Step 6: Create a zip for the files
    //             const zipName = `SANA_alignment_output_${id}.zip`;
    //             const zipPath = path.join(jobLocation, zipName); // process/{jobId}/SANA_alignment_output_{id}.zip
    //             const output = fs.createWriteStream(zipPath); // writeable stream where compressed data is written to the Zip file
    //             const archive = Archiver('zip',{ zlib: { level: 9 } });

    //             archive.on('entry', function (entry) {
    //                 console.log('Adding to zip:', entry.name);
    //             });

    //             output.on('pipe', () => {
    //                 console.log('Pipe started');
    //             });

    //             archive.on('warning', function (err) {
    //                 console.warn('Warning during zip creation:', err);
    //                 if (err.code === 'ENOENT') {
    //                     console.warn('File not found while zipping');
    //                 } else {
    //                     reject(err);
    //                 }
    //             });

    //             archive.on('error', (err) => {
    //                 console.error('Error during zip creation:', err);
    //                 reject(err);
    //             });

    //             output.on('close', () => {
    //                 console.log(`Zip file created at ${zipPath}`);
    //                 console.log(`Zip file size: ${archive.pointer()} bytes`);
    //                 if (!fs.existsSync(zipPath)) {
    //                     console.error('Zip file was not created!');
    //                     reject(new Error('Zip file creation failed'));
    //                     return;
    //                 }
    //                 // Step 7: Update info.json with status 'processed'
    //                 const successInfo: SuccessJobInfoFile = {
    //                     status: 'processed',
    //                     zipName: zipName,
    //                     command: optionString,
    //                 };
    //                 fs.writeFileSync(infoFilePath, JSON.stringify(successInfo));
    //                 resolve({
    //                     jobId,
    //                     success: true,
    //                     status: 'Networks successfully processed.',
    //                     redirect: `/lookup-job/${jobId}`,
    //                 });
    //             });

    //             archive.pipe(output); // sends compressed data from archive and sends to output file stream
    //             // archive.directory(jobLocation, false);
    //             archive.glob('**/*', { // adds all files in the jobLocation directory to the zip file (writeable stream)
    //                 cwd: jobLocation,
    //                 ignore: [zipName],
    //                 dot: true,
    //             });
    //             archive.finalize();
    //         }
    //     });
    // });
};



const getJob = async (jobId: string, protocol: string, host: string): Promise<ProcessJobData> => {
    // Step 1: Check that there is an id supplied - done in controller
    const jobDir = path.join(__dirname, '../process', jobId);

    // Step 2: Check that the job exists in the BullMQ queue
    const job = await getJobFromQueue(jobId);
    if (!job) {
        throw new HttpError('Job not found.', { status: 404 });
    }

    // Step 3: Get job state and data from BullMQ
    const bullMQState = await job.getState();
    const jobData = job.data;

    // Step 4: Handle failed jobs
    if (bullMQState === 'failed') {

        const logFilePath = path.join(jobDir, 'sana_runtime.log');
        let logContent = '';

        try {
            if (fs.existsSync(logFilePath)) {
                logContent = fs.readFileSync(logFilePath, 'utf8');
                logContent = logContent
                    .split('\n')
                    .map((line) => `<span>${line.trim()}</span>`)
                    .join('\n');
            } else {
                logContent = 'Run log file not found';
            }
        } catch (err) {
            console.error('Error reading sana_runtime.log:', err);
            logContent = jobData.error || 'Error reading run log file';
        }

        throw new HttpError('The alignment of the networks failed. See execution log below:', {
            status: 400,
            errorLog: logContent,
        });
    }

    // Step 5: Handle jobs that are still processing
    if (bullMQState === 'waiting' || bullMQState === 'active' || 
        jobData.status === 'preprocessing' || jobData.status === 'processing') {
        const redirectResponse: ProcessJobData = {
            jobId: jobId,
            success: true,
            status: 'Job is still being processed. Redirecting...',
            redirect: `/submit-job/${jobId}`,
        };
        return redirectResponse;
    }

    // Step 6: Handle completed/processed jobs
    if (bullMQState === 'completed') {
        if (!jobData.zipName) {
            throw new HttpError('Invalid job data: missing zip file name.', {
                status: 500,
            });
        }

        // Get execution log
        const execLogFilePath = path.join(jobDir, 'sana_runtime.log');
        let execLogFileOutput = '';

        if (fs.existsSync(execLogFilePath)) {
            try {
                const execLogFileContent = fs.readFileSync(execLogFilePath, 'utf8');
                const lines = execLogFileContent.split('\n');
                execLogFileOutput = lines.map((line) => `<span>${line.trim()}</span>`).join('');
            } catch (err) {
                execLogFileOutput = 'Problem opening execution log file.';
            }
        } else {
            // Fallback to execLogFileOutput from job data if available
            execLogFileOutput = jobData.execLogFileOutput || 'Job execution log file does not exist.';
        }

        // Construct base URL for download link
        const baseUrl = `${protocol}://${host}`;

        // Return the results
        const processedJobData: ProcessJobData = {
            success: true, 
            status: 'Results succeeded',
            jobId: jobId,
            note: `These results can be accessed on the results page using the Job ID ${jobId}, or directly accessed using ${baseUrl}/results?id=${jobId}.`,
            zipDownloadUrl: `${baseUrl}/api/download/${jobId}`,
            execLogFileOutput: execLogFileOutput,
        };

        return processedJobData;
    }

    // Step 7: Handle unexpected states
    throw new HttpError(`Job has an unexpected state: BullMQ=${bullMQState}, Status=${jobData.status}`, { status: 500 });
};

export { getJob, jobProcess };
