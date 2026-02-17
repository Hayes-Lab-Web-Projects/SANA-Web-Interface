interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div 
                    className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
                    role="status"
                    aria-label="Loading"
                ></div>
                <p className="text-gray-600 text-lg font-medium" aria-live="polite">{message}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;