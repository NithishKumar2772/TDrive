import { get } from 'svelte/store';
import { afterEach, describe, expect, it } from 'vitest';
import catalogs from './catalogs/desktop';
import { desktopCopy, desktopText, englishCopy } from './desktop-copy';
import { setLocalePreference } from './locale-store';
import { localeOptions } from './messages';

afterEach(() => setLocalePreference('system'));

describe('desktop copy', () => {
    it('ships every non-English locale and preserves the source placeholders', () => {
        const sources = Object.keys(catalogs.de);
        const placeholders = (text: string) => (text.match(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g) ?? []).sort();
        expect(Object.keys(catalogs).sort()).toEqual(
            localeOptions.filter((option) => option.id !== 'en').map((option) => option.id).sort(),
        );
        for (const [language, strings] of Object.entries(catalogs)) {
            const messages: Readonly<Record<string, string>> = strings;
            for (const source of sources) {
                const translated = messages[source];
                expect(translated?.trim(), `${language}: ${source}`).toBeTruthy();
                expect(placeholders(translated), `${language}: ${source}`).toEqual(placeholders(source));
            }
        }
    });

    it('uses the active locale for notification copy and live dialogs', () => {
        setLocalePreference('en');
        const titles: string[] = [];
        const stop = desktopCopy.subscribe((copy) => titles.push(copy('New shared drive')));
        try {
            setLocalePreference('hi');
            expect(titles).toEqual(['New shared drive', 'नई साझा ड्राइव']);
            expect(desktopText('Drive "{name}" created', { name: 'QA drive' }))
                .toBe('ड्राइव “QA drive” बन गई');
            expect(get(desktopCopy)('Drive name')).toBe('ड्राइव का नाम');
        } finally {
            stop();
        }
    });

    it('inserts values literally and leaves unrecognized input alone', () => {
        setLocalePreference('hi');
        expect(englishCopy('Deleting {name} ({count})', { name: '{count} $& <folder>', count: 0 }))
            .toBe('Deleting {count} $& <folder> (0)');
        expect(desktopText('User-provided text <file>')).toBe('User-provided text <file>');
        expect(desktopText('__proto__')).toBe('__proto__');
    });
});
