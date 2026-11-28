import { describe, expect, it } from 'vitest';
import { resolveLocale } from './locale-store';

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
    });
});
