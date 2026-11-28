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

    it.each(['zh-CN', 'zh-TW', 'pt-PT', 'ar', 'system'] as const)('persists and restores the %s preference after reload', async (preference) => {
        const current = await import('./locale-store');
        current.setLocalePreference(preference);
        expect(window.localStorage.getItem(current.LOCALE_STORAGE_KEY)).toBe(preference);

        vi.resetModules();
        const restarted = await import('./locale-store');
        expect(get(restarted.localePreference)).toBe(preference);
    });

    it('ignores a saved value that is not an offered language', async () => {
        window.localStorage.setItem('tdrive.locale.v1', 'constructor');
        const { localePreference } = await import('./locale-store');
        expect(get(localePreference)).toBe('system');
    });

    it('listens for browser language changes while honouring an explicit selection', async () => {
        let languages = ['sv-SE', 'es-419'];
        vi.stubGlobal('navigator', {
            get language() { return languages[0]; },
            get languages() { return languages; },
        });
        const { locale, setLocalePreference } = await import('./locale-store');
        const observed: string[] = [];
        const unsubscribe = locale.subscribe((value) => observed.push(value));
        try {
            languages = ['ar-EG'];
            window.dispatchEvent(new Event('languagechange'));
            setLocalePreference('ja');
            languages = ['fr-FR'];
            window.dispatchEvent(new Event('languagechange'));
            setLocalePreference('system');
            expect(observed).toEqual(['es', 'ar', 'ja', 'fr']);
        } finally {
            unsubscribe();
        }
    });
});
