import { derived, get } from 'svelte/store';
import { isMobilePlatform } from '../../api/runtime';
import { appView } from '../app/app-store';
import { englishMessages } from './catalogs/en';
import catalogs from './catalogs/desktop';
import { workspaceEnglish } from './catalogs/workspace/en';
import { locale } from './locale-store';
import { translate, type Locale, type MessageKey } from './messages';
import { workspaceText, type WorkspaceKey } from './workspace-messages';

export type DesktopValues = Readonly<Record<string, string | number | null | undefined>>;
export type DesktopTranslator = (source: string, values?: DesktopValues) => string;

const desktopCatalogs: Partial<Record<Locale, Readonly<Record<string, string>>>> = catalogs;
const workspaceKeys = new Map(Object.entries(workspaceEnglish).map(([key, source]) => [source as string, key as WorkspaceKey]));
const settingsKeys = new Map(Object.entries(englishMessages).map(([key, source]) => [source as string, key as MessageKey]));

function interpolate(source: string, values?: DesktopValues): string {
    if (!values) return source;
    return source.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (placeholder: string, key: string) => {
        const value = Object.prototype.hasOwnProperty.call(values, key) ? values[key] : undefined;
        return value === undefined || value === null ? placeholder : String(value);
    });
}

export const englishCopy: DesktopTranslator = interpolate;

export const desktopLocale = derived([locale, appView], ([$locale]): Locale => isMobilePlatform() ? 'en' : $locale);

export const desktopCopy = derived(desktopLocale, ($locale): DesktopTranslator => {
    const copy = desktopCatalogs[$locale];
    return (source, values) => {
        if ($locale === 'en') return interpolate(source, values);
        if (copy && Object.prototype.hasOwnProperty.call(copy, source)) return interpolate(copy[source], values);
        const workspaceKey = workspaceKeys.get(source);
        if (workspaceKey) return interpolate(workspaceText(workspaceKey, $locale), values);
        const settingsKey = settingsKeys.get(source);
        return interpolate(settingsKey ? translate(settingsKey, $locale) : source, values);
    };
});

export function desktopText(source: string, values?: DesktopValues): string {
    return get(desktopCopy)(source, values);
}
