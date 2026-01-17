import { createContext, useState, useContext, useEffect } from 'react';

const BoardCustomizationContext = createContext(null);

export const useBoardCustomization = () => {
    const context = useContext(BoardCustomizationContext);
    if (!context) {
        throw new Error('useBoardCustomization must be used within BoardCustomizationProvider');
    }
    return context;
};

const DEFAULT_SETTINGS = {
    darkSquareColor: '#779952',
    lightSquareColor: '#edeed1',
    showNotation: true,
    highlightColor: 'rgba(255, 255, 0, 0.4)',
    selectedSquareColor: 'rgba(20, 85, 30, 0.5)',
    pieceSet: 'cburnett',
    animationSpeed: 200,
    arrowColor: 'rgba(255, 170, 0, 0.8)',
    soundEnabled: true,
    soundTheme: 'standard',
};

export const BoardCustomizationProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('boardCustomization');
        if (saved) {
            try {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to parse board settings:', e);
                return DEFAULT_SETTINGS;
            }
        }
        return DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem('boardCustomization', JSON.stringify(settings));
    }, [settings]);

    const updateBoardSettings = (newSettings) => {
        console.log('[Context] Updating settings:', newSettings);
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetToDefaults = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    const value = {
        ...settings,
        updateBoardSettings,
        resetToDefaults,
    };

    return (
        <BoardCustomizationContext.Provider value={value}>
            {children}
        </BoardCustomizationContext.Provider>
    );
};
