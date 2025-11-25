import { useEffect, useState } from "react";
import JavaScriptWarning from "../components/JavaScriptWarning";
import NetworkSelection from "../components/NetworkSelection";
import OptionsHelp from "../components/OptionsHelp";
import ProcessingStep from "../components/ProcessingStep";
import SelectVersion from "../components/SelectVersion";
import CollapsibleSection from "../components/CollapsibleSection";
import Alert from "../components/Alert";
import Button from "../components/Button";
import { useJobSubmission } from "../context/JobSubmissionContext.js";

const SubmitJob = () => {
    const [jsEnabled, setJsEnabled] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const {
        sanaVersion,
        file1,
        file2,
        fileError,
        similarityData,
        handleVersionChange,
        handleSubmit,
    } = useJobSubmission();

    const validateAndSubmit = () => {
        // Validate network files
        if (!file1 || !file2) {
            const whichFile = file1 ? "second" : "first";
            setAlertMessage(`The ${whichFile} network file has not been selected.`);
            setShowAlert(true);
            return;
        }

        // Validate similarity files for SANA2
        if (sanaVersion === 'SANA2' && similarityData.optionalFilesCount > 0) {
            const requiredFiles = similarityData.similarityFiles.slice(
                0,
                similarityData.optionalFilesCount
            );
            let validFileCount = 0;

            const allRequiredFilesExist = (() => {
                if (requiredFiles.length === 0) return false;
                for (let i = 0; i < requiredFiles.length; i++) {
                    const file = requiredFiles[i];
                    if (file === null || file === undefined) {
                        return false;
                    }
                    if (file instanceof File) {
                        validFileCount++;
                        continue;
                    }
                    if (
                        typeof file === "object" &&
                        file !== null &&
                        'name' in file &&
                        typeof (file as { name: unknown }).name === "string"
                    ) {
                        validFileCount++;
                    }
                }
                return validFileCount === requiredFiles.length;
            })();

            if (!allRequiredFilesExist) {
                setAlertMessage(
                    `Please select all ${similarityData.optionalFilesCount} similarity files.`
                );
                setShowAlert(true);
                return;
            }
        }

        // All validation passed, submit the job
        setIsProcessing(true);
        handleSubmit();
    };

    useEffect(() => {
        setJsEnabled(true);
    }, []);

    // Show file errors as alerts
    useEffect(() => {
        if (fileError && fileError.length > 0) {
            setAlertMessage(fileError[0]);
            setShowAlert(true);
        }
    }, [fileError]);

    return (
        <div>
            {!jsEnabled && <JavaScriptWarning />}
            {jsEnabled && (
                <div id="js-enabled">
                    <div id="query-page-content">
                        <div className="page-content-wrapper flex flex-col gap-4">
                            {showAlert && alertMessage && (
                                <Alert
                                    message={alertMessage}
                                    onClose={() => {
                                        setShowAlert(false);
                                        setAlertMessage(null);
                                    }}
                                />
                            )}
                            <div>
                                <header>
                                    <h1 className="text-4xl font-bold mt-4">
                                        Submit New Job
                                    </h1>
                                </header>
                                <hr />
                            </div>

                            {isProcessing ? (
                                <ProcessingStep />
                            ) : (
                                <form
                                    id="submit-new-job-form"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        validateAndSubmit();
                                    }}
                                >
                                    <div className="flex flex-col gap-4">
                                        <CollapsibleSection
                                            title="Select Version"
                                            sectionNumber={1}
                                            defaultOpen={false}
                                        >
                                            <SelectVersion
                                                sanaVersion={sanaVersion}
                                                handleVersionChange={handleVersionChange}
                                            />
                                        </CollapsibleSection>

                                        <CollapsibleSection
                                            title="Select Networks"
                                            sectionNumber={2}
                                            defaultOpen={false}
                                        >
                                            <NetworkSelection />
                                        </CollapsibleSection>

                                        <CollapsibleSection
                                            title="Alignment Options"
                                            sectionNumber={3}
                                            defaultOpen={false}
                                        >
                                            <OptionsHelp />
                                        </CollapsibleSection>

                                        <div className="mt-6 flex justify-center">
                                            <Button type="submit">
                                                Submit Job
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmitJob;
