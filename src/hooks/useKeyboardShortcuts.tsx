import { useEffect } from 'react';

export interface ShortcutConfig {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in input/textarea
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            const shortcut = shortcuts.find(s =>
                s.key.toLowerCase() === e.key.toLowerCase() &&
                (s.ctrlKey === undefined || s.ctrlKey === e.ctrlKey) &&
                (s.shiftKey === undefined || s.shiftKey === e.shiftKey) &&
                (s.altKey === undefined || s.altKey === e.altKey)
            );

            if (shortcut) {
                e.preventDefault();
                shortcut.action();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [shortcuts, enabled]);
}

// Shortcut hints component
export function ShortcutHints({ shortcuts }: { shortcuts: ShortcutConfig[] }) {
    const getKeyDisplay = (shortcut: ShortcutConfig) => {
        let key = shortcut.key;
        // Format special keys
        if (key === ' ') key = 'Space';
        if (key === 'Escape') key = 'Esc';
        return key.toUpperCase();
    };

    return (
        <div className="space-y-2">
            {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 group">
                    <span className="text-sm font-medium text-black/70 group-hover:text-black transition-colors">
                        {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                        {shortcut.ctrlKey && (
                            <kbd className="px-2 py-1 bg-black text-white text-xs font-bold rounded-md shadow-[2px_2px_0px_0px_rgba(74,222,128,1)]">
                                Ctrl
                            </kbd>
                        )}
                        {shortcut.shiftKey && (
                            <kbd className="px-2 py-1 bg-black text-white text-xs font-bold rounded-md shadow-[2px_2px_0px_0px_rgba(74,222,128,1)]">
                                Shift
                            </kbd>
                        )}
                        {shortcut.altKey && (
                            <kbd className="px-2 py-1 bg-black text-white text-xs font-bold rounded-md shadow-[2px_2px_0px_0px_rgba(74,222,128,1)]">
                                Alt
                            </kbd>
                        )}
                        {(shortcut.ctrlKey || shortcut.shiftKey || shortcut.altKey) && (
                            <span className="text-black/30 font-bold text-xs">+</span>
                        )}
                        <kbd className="px-2 py-1 bg-black text-white text-xs font-bold rounded-md min-w-[2rem] text-center shadow-[2px_2px_0px_0px_rgba(74,222,128,1)]">
                            {getKeyDisplay(shortcut)}
                        </kbd>
                    </div>
                </div>
            ))}
        </div>
    );
}
