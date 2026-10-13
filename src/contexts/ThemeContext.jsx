import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(() => {
        const stored = localStorage.getItem('darkMode');
        if (stored !== null) return stored === 'true';
        const legacy = localStorage.getItem('theme');
        if (legacy !== null) return legacy === 'dark';
        return true; // Default to dark mode for fintech / linear depth aesthetic
    });

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode.toString());
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
        const root = document.documentElement;
        const body = document.body;

        if (darkMode) {
            root.classList.add('dark');
            root.classList.remove('light');
            root.setAttribute('data-theme', 'dark');
            root.style.colorScheme = 'dark';

            body.classList.add('dark');
            body.classList.remove('light');
            body.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
            root.setAttribute('data-theme', 'light');
            root.style.colorScheme = 'light';

            body.classList.remove('dark');
            body.classList.add('light');
            body.setAttribute('data-theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
