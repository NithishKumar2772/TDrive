import { describe, expect, it } from 'vitest';
import { englishMessages } from './catalogs/en';
import { resolveLocale } from './locale-store';
import { localeOptions, translate, type MessageKey } from './messages';

describe('locale selection', () => {
    it('resolves Traditional Chinese system locales', () => {
        expect(resolveLocale('system', 'zh-TW')).toBe('zh-TW');
        expect(resolveLocale('system', 'zh-Hant-HK')).toBe('zh-TW');
        expect(resolveLocale('system', 'zh_TW_u_nu_hanidec')).toBe('zh-TW');
        expect(resolveLocale('system', 'zh-HK-u-ca-chinese')).toBe('zh-TW');
        expect(resolveLocale('system', 'zh-MO-u-nu-latn')).toBe('zh-TW');
    });

    it('resolves Simplified Chinese system locales', () => {
        expect(resolveLocale('system', 'zh-CN')).toBe('zh-CN');
        expect(resolveLocale('system', 'zh-SG')).toBe('zh-CN');
        expect(resolveLocale('system', 'zh-Hans')).toBe('zh-CN');
        expect(resolveLocale('system', 'zh')).toBe('zh-CN');
    });

    it('gives an explicit Chinese script priority over the region', () => {
        expect(resolveLocale('system', 'zh-Hans-HK')).toBe('zh-CN');
        expect(resolveLocale('system', 'zh-Hant-CN')).toBe('zh-TW');
    });

    it('falls back to English for other system locales', () => {
        expect(resolveLocale('system', 'en-US')).toBe('en');
        expect(resolveLocale('system', 'zh-CN-')).toBe('en');
        expect(resolveLocale('system', undefined)).toBe('en');
    });

    it('honours an explicit language preference', () => {
        expect(resolveLocale('zh-TW', 'zh-CN')).toBe('zh-TW');
        expect(resolveLocale('zh-CN', 'en-US')).toBe('zh-CN');
        expect(resolveLocale('ar', 'ja-JP')).toBe('ar');
    });

    it.each([
        ['es-419', 'es'],
        ['fr_CA', 'fr'],
        ['ja-JP', 'ja'],
        ['ar-EG', 'ar'],
        ['iw-IL', 'he'],
        ['in-ID', 'id'],
        ['pt-Latn-PT-u-nu-latn', 'pt-PT'],
        ['pt-AO', 'pt-PT'],
        ['pt-BR', 'pt-BR'],
        ['pt', 'pt-BR'],
    ] as const)('matches the supported translation for %s', (tag, expected) => {
        expect(resolveLocale('system', tag)).toBe(expected);
    });

    it('honours the browser preference order and skips unavailable translations', () => {
        expect(resolveLocale('system', ['sv-SE', 'ko-KR', 'en-US'])).toBe('ko');
        expect(resolveLocale('system', ['en-GB', 'ko-KR'])).toBe('en');
        expect(resolveLocale('system', ['invalid_', 'sv-SE'])).toBe('en');
    });

    it('skips browser preferences that explicitly request an unavailable script', () => {
        expect(resolveLocale('system', ['hi-Latn-IN', 'en-IN'])).toBe('en');
        expect(resolveLocale('system', ['zh-Latn-CN', 'ja-JP'])).toBe('ja');
        expect(resolveLocale('system', ['ru-Latn', 'pt-Latn-PT'])).toBe('pt-PT');
    });

    it.each(localeOptions)('can render every Settings message in $id', ({ id, name }) => {
        expect(resolveLocale('system', id)).toBe(id);
        expect(name.trim()).not.toBe('');
        for (const key of Object.keys(englishMessages) as MessageKey[]) {
            expect(translate(key, id).trim(), `${id}.${key}`).not.toBe('');
        }
    });
});
