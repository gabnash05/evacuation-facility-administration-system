import { EvacuationCentersList } from "./EvacuationCentersList";

interface TransferDestinationTabsProps {
    activeTab: "center" | "home" | "hospital" | "other";
    onTabChange: (tab: "center" | "home" | "hospital" | "other") => void;
    selectedCenterId: number | null;
    onCenterSelect: (centerId: number) => void;
}

export function TransferDestinationTabs({
    activeTab,
    onTabChange,
    selectedCenterId,
    onCenterSelect,
}: TransferDestinationTabsProps) {
    const tabs = [
        { value: "center", label: "Center" },
        { value: "home", label: "Home" },
        { value: "hospital", label: "Hospital" },
        { value: "other", label: "Other" },
    ];

    return (
        <div className="flex gap-4 w-full">
            {/* Vertical Tabs List */}
            <div className="flex flex-col gap-2 min-w-[140px]">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => onTabChange(tab.value as any)}
                        className={`
                            px-4 py-3 text-left rounded-md font-medium transition-colors
                            ${activeTab === tab.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1">
                {activeTab === "center" && (
                    <EvacuationCentersList
                        selectedCenterId={selectedCenterId}
                        onCenterSelect={onCenterSelect}
                    />
                )}

                {activeTab === "home" && (
                    <div className="border rounded-lg p-8 text-center text-muted-foreground">
                        Transfer to home location (Coming soon)
                    </div>
                )}

                {activeTab === "hospital" && (
                    <div className="border rounded-lg p-8 text-center text-muted-foreground">
                        Transfer to hospital (Coming soon)
                    </div>
                )}

                {activeTab === "other" && (
                    <div className="border rounded-lg p-8 text-center text-muted-foreground">
                        Transfer to other location (Coming soon)
                    </div>
                )}
            </div>
        </div>
    );
}