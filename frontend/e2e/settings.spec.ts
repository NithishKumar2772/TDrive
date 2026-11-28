/**
 * The desktop Settings window: one place for the account, appearance, backup,
 * encryption and updates, opened from the account menu or with ⌘, / Ctrl+,.
 * It is a modal, so the keyboard contract matters as much as what it shows.
 */

import { bootTDrive, expect, resolves, test } from './wails-mock';
import { openSettingsSection } from './settings-helpers';

test('the shortcut opens Settings, arrows move between sections, Escape returns focus', async ({ page }) => {
    await bootTDrive(page);
    const search = page.locator('#search-input');
    await search.focus();

    await page.keyboard.press('ControlOrMeta+Comma');
    const settings = page.getByRole('dialog', { name: 'Settings' });
    await expect(settings).toBeVisible();
    const account = settings.getByRole('button', { name: 'Account', exact: true });
    await expect(account).toBeFocused();
    await expect(account).toHaveAttribute('aria-current', 'page');

    await page.keyboard.press('ArrowDown');
    const appearance = settings.getByRole('button', { name: 'Appearance', exact: true });
    await expect(appearance).toBeFocused();
    await expect(settings.getByRole('heading', { name: 'Appearance', level: 3 })).toBeVisible();
    await expect(settings.getByRole('radiogroup', { name: 'Light theme' })).toBeVisible();
    await expect(settings.getByRole('radiogroup', { name: 'Dark theme' })).toBeVisible();

    // Back where the reader was before the shortcut.
    await page.keyboard.press('Escape');
    await expect(settings).toBeHidden();
    await expect(search).toBeFocused();
});

test('closing Settings opened from the account menu returns to the account button', async ({ page }) => {
    await bootTDrive(page);
    const settings = await openSettingsSection(page, 'Encryption');
    await page.keyboard.press('Escape');
    await expect(settings).toBeHidden();
    await expect(page.locator('#profile-trigger')).toBeFocused();
});

test('the account menu keeps only Settings, updates and log out', async ({ page }) => {
    await bootTDrive(page);
    await page.locator('#profile-trigger').click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem')).toHaveText([/Settings…/, /Check for updates/, /Log out/]);
});

test('choosing a theme for the other mode keeps the current one on screen', async ({ page }) => {
    await bootTDrive(page);
    const settings = await openSettingsSection(page, 'Appearance');
    const before = await page.locator('html').getAttribute('data-theme');

    await settings.getByRole('radiogroup', { name: 'Light theme' }).getByRole('radio', { name: 'Chalk' }).click();
    await expect(settings.getByRole('radio', { name: 'Chalk' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', before ?? '');

    await settings.getByRole('radio', { name: 'Light', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'chalk');
});

test('Mount is hidden where drives have no letters', async ({ page }) => {
    await bootTDrive(page);
    const settings = await openSettingsSection(page, 'Account');
    await expect(settings.getByRole('button', { name: 'Mount', exact: true })).toHaveCount(0);
});

test('Mount saves the Windows drive letter for the next mount', async ({ page }) => {
    const mock = await bootTDrive(page, {
        GetMountDriveLetter: resolves({ available: true, letter: 'T:' }),
        SetMountDriveLetter: resolves({ available: true, letter: 'Q:' }),
    });
    const settings = await openSettingsSection(page, 'Mount');
    const letter = settings.getByLabel('Drive letter', { exact: true });
    await expect(letter).toHaveValue('T:');
    await page.screenshot({ path: test.info().outputPath('mount-settings.png') });

    await letter.selectOption('Q:');
    await expect(letter).toHaveValue('Q:');
    await expect.poll(async () => (await mock.calls('SetMountDriveLetter')).map((call) => call.args)).toEqual([['Q:']]);
});

test('switching to Hindi updates the desktop workspace and preserves file names', async ({ page }) => {
    await bootTDrive(page, {
        GetFolderContents: resolves({
            folders: [],
            files: [{
                name: 'Untouched filename.txt', size: 2_560, msg_id: 41, parent_id: '',
                upload_time: 1_735_689_600, uploader_id: 7, encrypted: false, plaintext_size: 0,
            }],
        }),
    });
    await expect(page.locator('#nav-photos')).toHaveText('Media');
    await expect(page.getByText('Untouched filename.txt', { exact: true })).toBeVisible();

    const settings = await openSettingsSection(page, 'Language');
    await settings.locator('#settings-language').selectOption('hi');
    await page.keyboard.press('Escape');

    await expect(page.locator('#nav-photos')).toHaveText('मीडिया');
    await expect(page.locator('#nav-trash')).toHaveText('कूड़ेदान');
    await expect(page.locator('#drives-nav')).toContainText('मेरे साथ साझा किए गए');
    await expect(page.locator('#drives-nav')).toContainText('स्रोत');
    await expect(page.locator('#open-new-drive')).toHaveText('नई साझा ड्राइव');
    await expect(page.locator('#open-join-drive')).toHaveText('लिंक से जुड़ें');
    await expect(page.locator('#mount-drive-button')).toHaveText('ड्राइव माउंट');
    await expect(page.locator('.storage-info')).toContainText('स्टोरेज');
    await expect(page.locator('#search-input')).toHaveAttribute('placeholder', 'फ़ाइलें खोजें...');
    await expect(page.locator('#upload-btn')).toHaveText('नया');
    await expect(page.getByRole('columnheader', { name: /नाम/ })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /तारीख/ })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /आकार/ })).toBeVisible();
    await expect(page.getByText('Untouched filename.txt', { exact: true })).toBeVisible();
    const localizedDate = await page.evaluate(() => new Date(1_735_689_600_000).toLocaleDateString('hi', {
        day: 'numeric', month: 'short', year: 'numeric',
    }));
    const row = page.locator('#file-list [data-name="Untouched filename.txt"]');
    const dateCell = row.locator('[aria-colindex="2"]');
    await expect(row).toHaveAttribute('lang', 'en');
    await expect(dateCell).toHaveAttribute('lang', 'hi');
    await expect(dateCell).toHaveText(localizedDate);

    await page.reload();
    await expect(page.locator('#nav-photos')).toHaveText('मीडिया');
    await page.locator('#profile-trigger').click();
    await page.locator('#profile-menu-settings').click();
    await page.locator('#settings-nav-language').click();
    await page.locator('#settings-language').selectOption('en');
    await page.keyboard.press('Escape');
    await expect(page.locator('#nav-photos')).toHaveText('Media');
    await expect(page.locator('#search-input')).toHaveAttribute('placeholder', 'Search files...');
});

test('Arabic mirrors Settings and keeps the selected language after reload', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await bootTDrive(page);
    await openSettingsSection(page, 'Language');

    const dialog = page.locator('#settings-modal [role="dialog"]');
    const language = dialog.locator('#settings-language');
    await language.selectOption('ar');
    await expect(dialog).toHaveAttribute('lang', 'ar');
    await expect(dialog).toHaveCSS('direction', 'rtl');
    const nav = dialog.getByRole('navigation');
    const content = dialog.getByRole('region');
    const rtlNav = await nav.boundingBox();
    const rtlContent = await content.boundingBox();
    if (!rtlNav || !rtlContent) throw new Error('Settings layout did not render');
    expect(rtlNav.x).toBeGreaterThan(rtlContent.x);

    await nav.locator('#settings-nav-appearance').click();
    const englishPanel = dialog.locator('.settings-body');
    await expect(englishPanel).toHaveAttribute('lang', 'en');
    await expect(englishPanel).toHaveCSS('direction', 'ltr');
    await expect(englishPanel.getByRole('radiogroup', { name: 'Light theme' })).toBeVisible();

    await nav.locator('#settings-nav-encryption').click();
    const encrypt = dialog.getByRole('switch');
    const track = encrypt.locator('.ui-switch');
    const thumb = track.locator('.ui-switch-thumb');
    await expect(encrypt).toHaveAttribute('aria-checked', 'false');
    const unchecked = await thumb.boundingBox();
    await encrypt.click();
    await expect(encrypt).toHaveAttribute('aria-checked', 'true');
    const checked = await thumb.boundingBox();
    const trackBounds = await track.boundingBox();
    if (!unchecked || !checked || !trackBounds) throw new Error('Encryption switch did not render');
    expect(checked.x).toBeLessThan(unchecked.x);
    expect(checked.x).toBeGreaterThanOrEqual(trackBounds.x);
    expect(checked.x + checked.width).toBeLessThanOrEqual(trackBounds.x + trackBounds.width);

    await page.reload();
    await page.locator('#profile-trigger').click();
    await page.locator('#profile-menu-settings').click();
    await expect(dialog).toHaveAttribute('lang', 'ar');
    await nav.locator('#settings-nav-language').click();
    await expect(language).toHaveValue('ar');

    await language.selectOption('en');
    await expect(dialog).toHaveAttribute('lang', 'en');
    await expect(dialog).toHaveCSS('direction', 'ltr');
    const ltrNav = await nav.boundingBox();
    const ltrContent = await content.boundingBox();
    if (!ltrNav || !ltrContent) throw new Error('Settings layout did not render');
    expect(ltrNav.x).toBeLessThan(ltrContent.x);
});

test('Hindi applies to shared-drive forms, notifications, and Activity', async ({ page }) => {
    const mock = await bootTDrive(page, {
        CreateSharedDrive: resolves({ id: 0, title: 'QA drive', kind: 'shared' }),
    });
    const settings = await openSettingsSection(page, 'Language');
    await settings.locator('#settings-language').selectOption('hi');
    await page.keyboard.press('Escape');

    await page.locator('#open-new-drive').click();
    const dialog = page.getByRole('dialog', { name: 'नई साझा ड्राइव' });
    await expect(dialog).toHaveAttribute('lang', 'hi');
    await expect(dialog.getByRole('checkbox', { name: /जुड़ने के लिए मंज़ूरी ज़रूरी है/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'रद्द करें' })).toBeVisible();
    await dialog.getByLabel('ड्राइव का नाम').fill('QA drive');
    await dialog.getByRole('button', { name: 'बनाएँ', exact: true }).click();
    await expect(page.locator('.toast-success .toast-title')).toHaveText('ड्राइव “QA drive” बन गई');
    expect(await mock.calls('CreateSharedDrive')).toMatchObject([{ args: ['QA drive', false] }]);

    await page.locator('#notif-bell').click();
    await expect(page.locator('.activity-panel[role="dialog"]')).toHaveAttribute('lang', 'hi');
});
