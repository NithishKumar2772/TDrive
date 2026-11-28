<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import LockKeyholeIcon from '@lucide/svelte/icons/lock-keyhole';
    import UploadIcon from '@lucide/svelte/icons/upload';
    import ModalShell from './ModalShell.svelte';
    import SelectedUploadFiles from './SelectedUploadFiles.svelte';
    import { uploadOptionsModal } from './upload-options-modal-store';

    interface Props {
        onCancel: () => void;
        onConfirm: (choice: { encrypt: boolean }) => void;
    }

    let { onCancel, onConfirm }: Props = $props();
    let uploadMode = $state<'plain' | 'encrypt'>('plain');
    let wasOpen = false;

    const view = uploadOptionsModal.state;
    const count = $derived($view.payload?.count ?? 0);
    const displayCount = $derived($desktopLocale === 'en' ? String(count) : count.toLocaleString($desktopLocale));
    const summary = $derived(count === 1
        ? $desktopCopy('Upload 1 file')
        : $desktopCopy('Upload {count} files', { count: displayCount }));
    const queuedTitle = $derived(count === 1
        ? $desktopCopy('Add 1 file to the queue')
        : $desktopCopy('Add {count} files to the queue', { count: displayCount }));

    function confirm(): void {
        onConfirm({ encrypt: uploadMode === 'encrypt' });
    }

    $effect(() => {
        if ($view.open && !wasOpen) {
            // Asked once: the answer becomes the default for later uploads.
            uploadMode = 'plain';
        }
        wasOpen = $view.open;
    });
</script>

<ModalShell
    lang={$desktopLocale}
    hostId="upload-options-modal"
    open={$view.open}
    title={$view.payload?.queued ? queuedTitle : summary}
    titleId="upload-options-title"
    initialFocus='input[name="upload-mode"]:checked'
    restoreFocus="#file-list"
    onClose={onCancel}
>
    <SelectedUploadFiles names={$view.payload?.names ?? []} destination={$view.payload?.destination} queued={$view.payload?.queued} />
    {#if $view.payload?.personal !== false}
        <!-- Two choices side by side, the way a segmented control reads; the
             one chosen explains itself underneath. -->
        <div class="upload-mode" role="radiogroup" aria-label={$desktopCopy('Upload as')}>
            <label class="upload-mode-option">
                <input type="radio" name="upload-mode" value="plain" bind:group={uploadMode} />
                <UploadIcon size={15} strokeWidth={2} aria-hidden="true" />
                <span>{$desktopCopy('Standard')}</span>
            </label>
            <label class="upload-mode-option">
                <input type="radio" name="upload-mode" value="encrypt" bind:group={uploadMode} />
                <LockKeyholeIcon size={15} strokeWidth={2} aria-hidden="true" />
                <span>{$desktopCopy('Encrypted')}</span>
            </label>
        </div>
        <p class="upload-mode-help">
            {uploadMode === 'encrypt'
                ? $desktopCopy('File contents are encrypted with your password before they reach Telegram. Names and folders stay visible.')
                : $desktopCopy('Files are stored on Telegram as they are.')}
            {$desktopCopy('TDrive remembers this; change it in Settings › Encryption.')}
        </p>
    {/if}

    {#snippet actions()}
        <button id="upload-options-cancel" class="secondary-btn" type="button" onclick={onCancel}>{$desktopCopy('Cancel')}</button>
        <button id="upload-options-confirm" class="primary-btn" type="button" onclick={confirm}>{$view.payload?.queued ? $desktopCopy('Add to queue') : $desktopCopy('Continue')}</button>
    {/snippet}
</ModalShell>

<style>
    .upload-mode {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px;
        padding: 2px;
        border: 1px solid var(--color-border-soft);
        border-radius: var(--radius-md);
        background: var(--color-surface-1);
    }

    .upload-mode-option {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        min-height: 32px;
        border-radius: var(--radius-sm);
        color: var(--color-text-muted);
        font-size: var(--type-sm);
        font-weight: var(--weight-medium);
        cursor: pointer;
        transition: background-color var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard);
    }

    /* The radio stays real for the keyboard and screen readers; the option's
       fill shows which is chosen. */
    .upload-mode-option input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        opacity: 0;
        cursor: pointer;
    }

    .upload-mode-option:has(input:checked) {
        background: var(--color-surface-3);
        color: var(--color-text);
        box-shadow: var(--shadow-sm);
    }

    .upload-mode-option:has(input:focus-visible) { box-shadow: var(--focus-ring); }

    @media (hover: hover) {
        .upload-mode-option:not(:has(input:checked)):hover { color: var(--color-text); }
    }

    .upload-mode-help {
        margin: var(--space-2) 0 var(--space-4);
        color: var(--color-text-muted);
        font-size: var(--type-xs);
        line-height: var(--leading-normal);
    }

    :global(html.mobile) .upload-mode-option { min-height: 44px; font-size: var(--type-base); }

    @media (prefers-reduced-motion: reduce) {
        .upload-mode-option { transition: none; }
    }
</style>
