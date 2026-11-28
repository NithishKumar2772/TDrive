<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    /**
     * The one question asked before anything leaves the trash for good. It sits
     * over the trash dialog; modal-a11y treats nested dialogs as one stack, so
     * this owns the keyboard, Escape and Android BACK while it is up.
     */
    import FileIcon from '@lucide/svelte/icons/file';
    import FolderIcon from '@lucide/svelte/icons/folder';
    import { formatBytes } from '../../utils';
    import ModalShell from '../modals/ModalShell.svelte';
    import { trashConfirmModal, type TrashConfirmation } from './trash-confirm-store';

    interface Props {
        onConfirm: () => void | Promise<void>;
    }

    let { onConfirm }: Props = $props();

    const view = trashConfirmModal.state;
    const target = $derived($view.payload);

    function close(): void {
        if ($view.busy) return;
        trashConfirmModal.close();
    }

    function confirm(): void {
        if ($view.busy) return;
        // The controller closes this dialog before the async work starts.
        void onConfirm();
    }

    function title(confirmation: TrashConfirmation): string {
        return confirmation.kind === 'empty' ? $desktopCopy('Empty the trash?') : $desktopCopy('Delete permanently?');
    }

    function subtitle(confirmation: TrashConfirmation): string {
        if (confirmation.kind === 'empty') {
            const { count, bytes } = confirmation;
            let summary = confirmation.summary;
            if ($desktopLocale !== 'en' && count) {
                const items = count === 1
                    ? $desktopCopy('1 item')
                    : $desktopCopy('{count} items', { count: count.toLocaleString($desktopLocale) });
                summary = bytes && bytes > 0 ? `${items} · ${formatBytes(bytes, $desktopLocale)}` : items;
            }
            return summary
                ? $desktopCopy("This deletes {summary} from Telegram right away. It can't be undone.", { summary })
                : $desktopCopy("This deletes everything in the trash from Telegram right away. It can't be undone.");
        }
        return confirmation.isFolder
            ? $desktopCopy("This deletes the folder and every file inside it from Telegram right away. It can't be undone.")
            : $desktopCopy("This deletes the file from Telegram right away. It can't be undone.");
    }
</script>

<ModalShell
    lang={$desktopLocale}
    hostId="trash-confirm-modal"
    open={$view.open}
    title={target ? title(target) : ''}
    titleId="trash-confirm-title"
    subtitle={target ? subtitle(target) : ''}
    initialFocus="#trash-confirm-cancel"
    restoreFocus="#trash-empty-btn"
    onClose={close}
>
    {#if target?.kind === 'purge'}
        <!-- What is about to go, as the row it is: a bare name in a frame read
             as a text field waiting to be typed into. -->
        <div class="trash-confirm-target">
            <span class="trash-confirm-icon" aria-hidden="true">
                {#if target.isFolder}
                    <FolderIcon size={16} strokeWidth={1.9} />
                {:else}
                    <FileIcon size={16} strokeWidth={1.9} />
                {/if}
            </span>
            <span class="trash-confirm-name" title={target.name}>{target.name}</span>
            <span class="trash-confirm-kind">{target.isFolder ? $desktopCopy("Folder") : $desktopCopy("File")}</span>
        </div>
    {/if}

    {#snippet actions()}
        <button id="trash-confirm-cancel" class="secondary-btn" type="button" disabled={$view.busy} onclick={close}>
            {$desktopCopy("Cancel")}
        </button>
        <button id="trash-confirm-accept" class="primary-btn danger-btn" type="button" disabled={$view.busy} onclick={confirm}>
            {target?.kind === 'empty' ? $desktopCopy("Empty trash") : $desktopCopy("Delete permanently")}
        </button>
    {/snippet}
</ModalShell>

<style>
    /* The target reads as one row of the list it came from, and stands clear of
       the buttons: it used to sit right on top of them. */
    .trash-confirm-target {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        min-width: 0;
        margin: 2px 0 var(--space-4);
        padding: var(--space-3);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface-control);
    }

    .trash-confirm-icon {
        flex: 0 0 auto;
        display: inline-flex;
        color: var(--text-muted);
    }

    .trash-confirm-name {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--font-size-sm);
        font-weight: var(--weight-semibold);
    }

    .trash-confirm-kind {
        flex: 0 0 auto;
        color: var(--text-muted);
        font-size: var(--font-size-xs);
    }

    :global(html.mobile) .trash-confirm-name {
        font-size: var(--mobile-type-body);
    }
</style>
