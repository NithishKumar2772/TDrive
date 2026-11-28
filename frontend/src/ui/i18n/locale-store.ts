import { derived, readable, writable } from 'svelte/store';
import { isLocale, type Locale } from './messages';

export type LocalePreference = 'system' | Locale;
export const LOCALE_STORAGE_KEY = 'tdrive.locale.v1';

// CLDR uses European Portuguese as the parent locale for these regions.
const europeanPortugueseRegions = new Set(['AO', 'CH', 'CV', 'FR', 'GQ', 'GW', 'LU', 'MO', 'MZ', 'PT', 'ST', 'TL']);

function matchSystemLocale(tag: string): Locale | undefined {
    try {
        const { language, script, region } = new Intl.Locale(tag.replace(/_/g, '-'));
        if (language === 'zh') {
            if (script === 'Hant') return 'zh-TW';
            if (script === 'Hans') return 'zh-CN';
            if (script) return undefined;
            return region === 'TW' || region === 'HK' || region === 'MO' ? 'zh-TW' : 'zh-CN';
        }
        // The other catalogs use the language's default writing system.
        if (script && new Intl.Locale(language).maximize().script !== script) return undefined;
        if (language === 'pt') {
            return region && europeanPortugueseRegions.has(region) ? 'pt-PT' : 'pt-BR';
        }
        return isLocale(language) ? language : undefined;
    } catch {
        return undefined;
    }
}

export function resolveLocale(preference: LocalePreference, systemLanguages?: string | readonly string[]): Locale {
    if (preference !== 'system') return preference;
    const candidates = typeof systemLanguages === 'string' ? [systemLanguages] : systemLanguages ?? [];
    for (const candidate of candidates) {
        const match = matchSystemLocale(candidate);
        if (match) return match;
    }
    return 'en';
}

function readPreference(): LocalePreference {
    try {
        const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        return saved === 'system' || isLocale(saved) ? saved : 'system';
    } catch {
        return 'system';
    }
}

const systemLanguages = readable<readonly string[]>([], (set) => {
    if (typeof window === 'undefined') return;
    const refresh = () => {
        set(navigator.languages?.length ? navigator.languages : [navigator.language]);
    };
    refresh();
    window.addEventListener('languagechange', refresh);
    return () => window.removeEventListener('languagechange', refresh);
});

export const localePreference = writable<LocalePreference>(readPreference());
export const locale = derived([localePreference, systemLanguages], ([$preference, $languages]) => resolveLocale($preference, $languages));

export function setLocalePreference(preference: LocalePreference): void {
    localePreference.set(preference);
    try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, preference);
    } catch {
        // The in-memory preference still applies when storage is unavailable.
    }
}
