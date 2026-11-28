import { asianCatalogs } from './catalogs/asia';
import { chineseCatalogs } from './catalogs/chinese';
import { englishMessages, type LocaleCatalog, type MessageKey } from './catalogs/en';
import { europeMenaCatalogs } from './catalogs/europe-mena';
import { westernEuropeanCatalogs } from './catalogs/western-europe';

const catalogs = {
    en: { name: 'English', messages: englishMessages },
    ...chineseCatalogs,
    ...westernEuropeanCatalogs,
    ...europeMenaCatalogs,
    ...asianCatalogs,
} satisfies Record<string, LocaleCatalog>;

export type Locale = keyof typeof catalogs;
export type { MessageKey } from './catalogs/en';

export function isLocale(value: unknown): value is Locale {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(catalogs, value);
}

export function localeDirection(locale: Locale): 'ltr' | 'rtl' {
    const catalog: LocaleCatalog = catalogs[locale];
    return catalog.direction ?? 'ltr';
}

const localeIds = Object.keys(catalogs) as Locale[];

export const localeOptions = localeIds.map((id) => ({
    id,
    name: catalogs[id].name,
    direction: localeDirection(id),
}));

export function translate(key: MessageKey, locale: Locale): string {
    return catalogs[locale].messages[key];
}
