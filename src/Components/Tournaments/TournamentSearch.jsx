import React, { useState } from "react";
import "./tournament-search.css";

export default function TournamentSearch({ onSearch }) {
    const [query, setQuery] = useState("");

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    };

    const handleClear = () => {
        setQuery("");
        onSearch("");
    };

    return (
        <div className="tournament-search">
            <div className="search-input-wrapper">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="m21 21-4.35-4.35" strokeWidth="2" />
                </svg>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search tournaments..."
                    value={query}
                    onChange={handleChange}
                />
                {query && (
                    <button className="search-clear-btn" onClick={handleClear} aria-label="Clear search">
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}
