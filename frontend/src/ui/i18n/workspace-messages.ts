import { eastAsianWorkspace } from './catalogs/workspace/east-asia';
import { workspaceEnglish, type WorkspaceCatalog, type WorkspaceKey } from './catalogs/workspace/en';
import { europeMenaWorkspace } from './catalogs/workspace/europe-mena';
import { southSoutheastWorkspace } from './catalogs/workspace/south-southeast';
import { westernWorkspace } from './catalogs/workspace/west';
import type { Locale } from './messages';

const workspaceCatalogs = {
    en: workspaceEnglish,
    ...eastAsianWorkspace,
    ...westernWorkspace,
    ...europeMenaWorkspace,
    ...southSoutheastWorkspace,
} satisfies Record<Locale, WorkspaceCatalog>;

export type { WorkspaceKey } from './catalogs/workspace/en';
export type WorkspaceValues = Readonly<Partial<Record<'column' | 'name' | 'query', string>>>;

export function workspaceText(key: WorkspaceKey, locale: Locale, values?: WorkspaceValues): string {
    const template = workspaceCatalogs[locale][key];
    if (!values) return template;
    return template.replace(/\{(column|name|query)\}/g, (token: string, field: keyof WorkspaceValues) =>
        values[field] ?? token);
}
