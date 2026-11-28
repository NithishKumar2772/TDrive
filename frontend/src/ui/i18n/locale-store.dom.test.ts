import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('locale preference storage', () => {
    beforeEach(() => {
        const storage = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it.each(['zh-CN', 'system'] as const)('persists and restores the %s preference after reload', async (preference) => {
        const current = await import('./locale-store');
        current.setLocalePreference(preference);
        expect(window.localStorage.getItem(current.LOCALE_STORAGE_KEY)).toBe(preference);

        vi.resetModules();
        const restarted = await import('./locale-store');
        expect(get(restarted.localePreference)).toBe(preference);
    });
});
