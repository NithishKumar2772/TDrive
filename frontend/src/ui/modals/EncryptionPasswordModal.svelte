<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import ModalShell from './ModalShell.svelte';
    import { encryptionPasswordModal } from './encryption-password-modal-store';
    import FingerprintIcon from '@lucide/svelte/icons/fingerprint';
    import { biometricLabel } from './biometric-labels';

    interface Props {
        onCancel: () => void;
        onSubmit: (password: string) => void | Promise<void>;
        onBiometric?: () => void | Promise<void>;
    }

    let { onCancel, onSubmit, onBiometric = () => {} }: Props = $props();
    let password = $state('');
    let passwordInput = $state<HTMLInputElement | null>(null);
    let wasOpen = false;

    const view = encryptionPasswordModal.state;
    const hint = $derived(($view.payload?.hint ?? '').trim());
    const biometric = $derived($view.payload?.biometric);
    const biometricBusy = $derived(Boolean($view.payload?.biometricBusy));

    function clearPassword(): void {
        password = '';
        if (passwordInput) passwordInput.value = '';
    }

    function cancel(): void {
        if ($view.busy && !biometricBusy) return;
        clearPassword();
        onCancel();
    }

    function submit(): void {
        if ($view.busy) return;
        const submittedPassword = password;
        clearPassword();
        void onSubmit(submittedPassword);
    }

    function unlockWithBiometric(): void {
        if ($view.busy) return;
        clearPassword();
        void onBiometric();
    }

    function onInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            submit();
        }
    }

    $effect.pre(() => {
        if (!$view.open) {
            clearPassword();
            wasOpen = false;
            return;
        }
        if (!wasOpen) clearPassword();
        wasOpen = true;
    });
</script>

<ModalShell
    lang={$desktopLocale}
    hostId="encryption-password-modal"
    open={$view.open}
    title={$desktopCopy('Unlock encrypted files')}
    titleId="encryption-password-title"
    cardClass="encryption-unlock-card"
    initialFocus="#encryption-password-input"
    restoreFocus="#file-list"
    onClose={cancel}
>
    <input
        id="encryption-password-input"
        type="password"
        aria-label={$desktopCopy('Encryption password')}
        aria-describedby={hint && $view.error ? 'encryption-password-hint encryption-password-error' : hint ? 'encryption-password-hint' : $view.error ? 'encryption-password-error' : undefined}
        placeholder={$desktopCopy('Password')}
        autocomplete="current-password"
        bind:this={passwordInput}
        bind:value={password}
        disabled={$view.busy}
        onkeydown={onInputKeydown}
    />
    {#if $view.error}
        <div id="encryption-password-error" class="modal-error" role="alert">{$view.error}</div>
    {/if}
    {#if hint}
        <p id="encryption-password-hint" class="modal-subtitle">
            {$desktopCopy('Hint:')} <span id="encryption-password-hint-text" dir="auto">{hint}</span>
        </p>
    {/if}
    {#if biometric?.available && biometric.enrolled}
        <button id="encryption-password-biometric" class="secondary-btn biometric-unlock-btn" type="button" disabled={$view.busy} onclick={unlockWithBiometric}>
            <FingerprintIcon size={18} aria-hidden="true" />
            {biometricBusy
                ? $desktopCopy('Waiting for authentication…')
                : $desktopCopy('Use {method}', { method: biometricLabel(biometric.kind, $desktopCopy) })}
        </button>
    {/if}
    <p class="field-help unlock-session-help">{$desktopCopy('Files stay unlocked until you lock, sign out or close the app.')}</p>

    {#snippet actions()}
        <button id="encryption-password-cancel" class="secondary-btn" type="button" disabled={$view.busy && !biometricBusy} onclick={cancel}>
            {$desktopCopy('Cancel')}
        </button>
        <button id="encryption-password-confirm" class="primary-btn" type="button" disabled={$view.busy} onclick={submit}>
            {$desktopCopy('Unlock with password')}
        </button>
    {/snippet}
</ModalShell>

<style>
    .biometric-unlock-btn { width: 100%; display: flex; justify-content: center; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3); }
    .unlock-session-help { margin-top: 0; }
    :global(.encryption-unlock-card .modal-title) { margin-bottom: var(--space-4); }
</style>
