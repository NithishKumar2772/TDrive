import type { BiometricKind } from '../../types';

export function biometricLabel(kind: BiometricKind | undefined, desktopText: (source: string) => string = (source) => source): string {
    switch (kind) {
        case 'touch_id': return 'Touch ID';
        case 'face_id': return 'Face ID';
        case 'windows_hello': return 'Windows Hello';
        default: return desktopText('biometrics');
    }
}

export function biometricUnavailableMessage(reason: string, desktopText: (source: string) => string = (source) => source): string {
    switch (reason) {
        case 'unsupported': return desktopText('Biometric unlock is not supported on this device. Your encryption password is always available.');
        case 'not_enrolled': return desktopText('Set up biometrics in your device settings, then reopen encryption settings.');
        case 'locked_out': return desktopText('Biometrics are temporarily locked. Unlock your device or use your encryption password.');
        case 'signing_required': return desktopText('Biometric unlock requires a signed TDrive build. Use your encryption password.');
        case 'invalidated': return desktopText('Biometric enrollment changed. Remove it and enable biometrics again with your encryption password.');
        default: return desktopText('Biometrics are unavailable right now. Your encryption password is always available.');
    }
}
