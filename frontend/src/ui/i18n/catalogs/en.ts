export const englishMessages = {
    settings: 'Settings',
    account: 'Account',
    appearance: 'Appearance',
    photoBackup: 'Photo backup',
    encryption: 'Encryption',
    mount: 'Mount',
    updates: 'Updates',
    updateReady: 'Update ready',
    language: 'Language',
    languageDescription: 'Choose the language for translated parts of TDrive.',
    systemDefault: 'System default',
    closeSettings: 'Close settings',
    loadingAccount: 'Loading account…',
    telegramAccount: 'Telegram account',
    logOut: 'Log out',
    logOutDescription: 'Sign this device out of Telegram. Your files stay in your Telegram account.',
    encryptUploads: 'Encrypt uploads',
    encryptUploadsDescription: 'New uploads to My Drive are encrypted with your password. Names and folders stay visible.',
    passwordAndDeviceUnlock: 'Password and device unlock',
    changeEncryptionPassword: 'Change your encryption password and hint, or unlock with this device.',
    setEncryptionPassword: 'You set a password the first time you encrypt an upload.',
    manage: 'Manage…',
} as const;

export type MessageKey = keyof typeof englishMessages;
export type LocaleCatalog = {
    readonly name: string;
    readonly direction?: 'rtl';
    readonly messages: Readonly<Record<MessageKey, string>>;
};
