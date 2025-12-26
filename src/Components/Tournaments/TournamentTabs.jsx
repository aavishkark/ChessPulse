import "./tournament-tabs.css";

export default function TournamentTabs({ activeTab, onTabChange }) {
    const tabs = [
        { id: "ongoing", label: "Live Now", icon: "🔴" },
        { id: "upcoming", label: "Upcoming", icon: "📅" },
        { id: "past", label: "Past Events", icon: "🏆" }
    ];

    return (
        <div className="tournament-tabs">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <span className="tab-icon">{tab.icon}</span>
                    <span className="tab-label">{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
