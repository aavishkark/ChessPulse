import "./tournament-tabs.css";
import { Radio, Calendar, Archive } from "lucide-react";

export default function TournamentTabs({ activeTab, onTabChange }) {
    const tabs = [
        { id: "ongoing", label: "Live Broadcasts", Icon: Radio, color: "#10b981", live: true },
        { id: "upcoming", label: "Upcoming Calendar", Icon: Calendar, color: "#a855f7", live: false },
        { id: "past", label: "Completed Archives", Icon: Archive, color: "#f59e0b", live: false }
    ];

    return (
        <div className="tournament-tabs">
            {tabs.map(tab => {
                const TabIcon = tab.Icon;
                return (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <span className="tab-icon" style={{ color: tab.color }}>
                            <TabIcon size={16} />
                        </span>
                        <span className="tab-label">{tab.label}</span>
                        {tab.live && <span className="tab-live-indicator" />}
                    </button>
                );
            })}
        </div>
    );
}
