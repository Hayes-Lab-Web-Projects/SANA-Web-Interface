import { useState } from "react";

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    sectionNumber?: number;
}

/**
 * A collapsible section component that shows/hides content on click.
 * Used for single-page forms with expandable sections.
 */
const CollapsibleSection = ({
    title,
    children,
    defaultOpen = false,
    sectionNumber,
}: CollapsibleSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors duration-200"
            >
                <span className="text-lg font-semibold text-gray-800">
                    {sectionNumber && `${sectionNumber}. `}{title}
                </span>
                <span className="text-gray-600 text-xl">
                    {isOpen ? "▼" : "▶"}
                </span>
            </button>
            {isOpen && (
                <div className="p-6 bg-white border-t border-gray-200">
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSection;
