<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import ModalShell from './ModalShell.svelte';
    import { closeLeaveDriveModalView, leaveDriveModalState, type LeaveDriveTarget } from './leave-drive-modal-store';

    interface Props {
        onConfirm: (target: LeaveDriveTarget) => void | Promise<void>;
    }

    let { onConfirm }: Props = $props();

    const subtitle = $derived.by(() => {
        const title = $leaveDriveModalState.target?.title || '';
        return title
            ? $desktopCopy('Leave "{name}"? You can rejoin later with the invite link.', { name: title })
            : $desktopCopy('You can rejoin later with the invite link.');
    });

    function canClose(): boolean {
        return !$leaveDriveModalState.inFlight;
    }

    function close(): void {
        if (!canClose()) return;
        closeLeaveDriveModalView();
    }

    function confirm(): void {
        const target = $leaveDriveModalState.target;
        if (!target || $leaveDriveModalState.inFlight) return;
        void onConfirm(target);
    }
</script>

<ModalShell
    lang={$desktopLocale}
    hostId="leave-drive-modal"
    open={$leaveDriveModalState.open}
    title={$desktopCopy("Leave drive?")}
    titleId="leave-drive-title"
    {subtitle}
    initialFocus="#leave-drive-cancel"
    restoreFocus="#drives-nav"
    onClose={close}
>
    {#snippet actions()}
        <button
            id="leave-drive-cancel"
            class="secondary-btn"
            type="button"
            disabled={$leaveDriveModalState.inFlight}
            onclick={close}
        >
            {$desktopCopy("Cancel")}
        </button>
        <button
            id="leave-drive-confirm"
            class="primary-btn danger-btn"
            type="button"
            disabled={$leaveDriveModalState.inFlight}
            onclick={confirm}
        >
            {$desktopCopy("Leave")}
        </button>
    {/snippet}
</ModalShell>
