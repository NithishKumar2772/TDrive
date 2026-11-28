import { describe, expect, it } from 'vitest';
import { workspaceEnglish } from './catalogs/workspace/en';
import { localeOptions } from './messages';
import { workspaceText, type WorkspaceKey } from './workspace-messages';

describe('workspace translations', () => {
    it.each(localeOptions)('provides workspace copy and the right placeholders in $id', ({ id }) => {
        for (const key of Object.keys(workspaceEnglish) as WorkspaceKey[]) {
            const source = workspaceEnglish[key];
            const message = workspaceText(key, id);
            expect(message.trim(), `${id}.${key}`).not.toBe('');
            expect(message.match(/\{\w+\}/g)?.sort(), `${id}.${key}`)
                .toEqual(source.match(/\{\w+\}/g)?.sort());
        }
    });

    it('keeps search terms literal when inserting them into copy', () => {
        expect(workspaceText('noSearchResults', 'en', { query: '{name} <file>' }))
            .toBe('No results for "{name} <file>"');
    });
});
