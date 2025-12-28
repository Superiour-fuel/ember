
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AccessibilitySettings {
    useClonedVoice: boolean;
    audioQuality: "high" | "fast";
    voiceSpeed: number;
    fontSize: "small" | "medium" | "large" | "xl";
    highContrast: boolean;
    reduceAnimations: boolean;
    keyboardShortcuts: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
    updateSettings: (settings: Partial<AccessibilitySettings>) => void;
    resetSettings: () => void;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
    useClonedVoice: false,
    audioQuality: "fast",
    voiceSpeed: 1,
    fontSize: "medium",
    highContrast: false,
    reduceAnimations: false,
    keyboardShortcuts: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AccessibilitySettings>(() => {
        const saved = localStorage.getItem("ember_settings");
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem("ember_settings", JSON.stringify(settings));

        // Apply global classes
        const html = document.documentElement;

        // Font Size
        html.setAttribute("data-font-size", settings.fontSize);

        // High Contrast
        if (settings.highContrast) {
            html.classList.add("high-contrast");
        } else {
            html.classList.remove("high-contrast");
        }

        // Animations (Reduced Motion)
        if (settings.reduceAnimations) {
            html.classList.add("reduce-animations");
        } else {
            html.classList.remove("reduce-animations");
        }

    }, [settings]);

    const updateSettings = (updates: Partial<AccessibilitySettings>) => {
        setSettings((prev) => ({ ...prev, ...updates }));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return (
        <AccessibilityContext.Provider value={{ ...settings, updateSettings, resetSettings }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error("useAccessibility must be used within an AccessibilityProvider");
    }
    return context;
}
