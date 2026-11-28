<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import ModalShell from './ModalShell.svelte';
    import SelectedUploadFiles from './SelectedUploadFiles.svelte';
    import { importOptionsModal, type ImportChoice } from './import-options-modal-store';
    import type { ImportFileConflict } from '../../types';

    interface Props {
        onCancel: () => void;
        onConfirm: (choice: ImportChoice) => void;
        onToggle: (encrypt: boolean, extract: boolean) => void;
    }

    let { onCancel, onConfirm, onToggle }: Props = $props();
    let extract = $state(false);
    let encrypt = $state(false);
    let merge = $state(false);
    let fileConflict = $state<ImportFileConflict>('skip');
    let wasOpen = false;

    const view = importOptionsModal.state;
    const canMerge = $derived($view.payload?.allowFolderMerge === true && $view.payload.plan.folders > 0);

    function humanBytes(n: number): string {
        if (!Number.isFinite(n) || n <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = n;
        let i = 0;
        while (value >= 1024 && i < units.length - 1) {
            value /= 1024;
            i++;
        }
        const fractionDigits = value < 10 && i > 0 ? 1 : 0;
        const rounded = $desktopLocale === 'en' ? value.toFixed(fractionDigits)
            : value.toLocaleString($desktopLocale, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
        return `${rounded} ${units[i]}`;
    }

    function displayCount(count: number): string {
        return $desktopLocale === 'en' ? String(count) : count.toLocaleString($desktopLocale);
    }

    const summary = $derived.by(() => {
        const plan = $view.payload?.plan;
        if (!plan) return '';
        const parts = [plan.files === 1 ? $desktopCopy('1 file') : $desktopCopy('{count} files', { count: displayCount(plan.files) })];
        if (plan.folders > 0) {
            parts.push(plan.folders === 1 ? $desktopCopy('1 folder') : $desktopCopy('{count} folders', { count: displayCount(plan.folders) }));
        }
        if (plan.archives > 0) {
            parts.push(plan.archives === 1 ? $desktopCopy('1 archive') : $desktopCopy('{count} archives', { count: displayCount(plan.archives) }));
        }
        let text = parts.join('  ·  ');
        if (plan.bytes > 0) text += `  ·  ${humanBytes(plan.bytes)}`;
        return text;
    });

    const note = $derived.by(() => {
        const plan = $view.payload?.plan;
        if (!plan) return '';
        const reportedErrors = Number(plan.errorCount);
        const errors = Number.isFinite(reportedErrors)
            ? Math.max(0, Math.floor(reportedErrors))
            : (Array.isArray(plan.errors) ? plan.errors.length : 0);
        const notes: string[] = [];
        if (plan.oversize > 0) {
            const limit = humanBytes(plan.maxBytes);
            notes.push(plan.oversize === 1
                ? $desktopCopy("1 file over {limit} will be skipped (Telegram's per-file limit).", { limit })
                : $desktopCopy("{count} files over {limit} will be skipped (Telegram's per-file limit).", { count: displayCount(plan.oversize), limit }));
        }
        if (plan.empty) {
            notes.push(plan.empty === 1
                ? $desktopCopy("1 empty file will be skipped (empty files can't be uploaded).")
                : $desktopCopy("{count} empty files will be skipped (empty files can't be uploaded).", { count: displayCount(plan.empty) }));
        }
        if (plan.ignored > 0) {
            notes.push(plan.ignored === 1
                ? $desktopCopy('1 generated/cache entry will be skipped.')
                : $desktopCopy('{count} generated/cache entries will be skipped.', { count: displayCount(plan.ignored) }));
        }
        if (errors > 0) {
            notes.push(errors === 1
                ? $desktopCopy('1 item could not be scanned and may be skipped or uploaded as-is.')
                : $desktopCopy('{count} items could not be scanned and may be skipped or uploaded as-is.', { count: displayCount(errors) }));
        }
        if (plan.limitExceeded) {
            notes.push($desktopCopy('Keep it under {limit} items by removing generated/cache folders or splitting it into smaller batches.', {
                limit: plan.maxItems.toLocaleString($desktopLocale === 'en' ? undefined : $desktopLocale),
            }));
        }
        return notes.join(' ');
    });

    function toggled(): void {
        onToggle(encrypt, extract);
    }

    $effect(() => {
        if ($view.open && !wasOpen) {
            extract = false;
            merge = false;
            fileConflict = 'skip';
            // Starts from the remembered upload choice; the plan was made with it.
            encrypt = $view.payload?.encrypt === true;
        }
        wasOpen = $view.open;
    });
</script>

<ModalShell
    lang={$desktopLocale}
    hostId="import-options-modal"
    open={$view.open}
    title={$view.payload?.queued ? $desktopCopy('Add import to queue') : $desktopCopy('Import')}
    titleId="import-options-title"
    subtitle={summary}
    initialFocus="#import-options-extract"
    restoreFocus="#file-list"
    onClose={onCancel}
>
    <SelectedUploadFiles names={$view.payload?.names ?? []} destination={$view.payload?.destination} queued={$view.payload?.queued} label={$desktopCopy('Selected items')} />
    {#if $view.payload?.hasArchives}
        <label id="import-options-extract-row" class="modal-choice-row">
            <input id="import-options-extract" type="checkbox" bind:checked={extract} onchange={toggled} />
            <span>
                <strong>{$desktopCopy('Extract archives')}</strong>
                <small>{$desktopCopy('Unpack archive contents into folders instead of uploading the archive file.')}</small>
            </span>
        </label>
    {/if}
    {#if $view.payload?.personal}
        <label id="import-options-encrypt-row" class="modal-choice-row">
            <input id="import-options-encrypt" type="checkbox" bind:checked={encrypt} onchange={toggled} />
            <span>
                <strong>{$desktopCopy('Encrypt before upload')}</strong>
                <small>{$desktopCopy('TDrive encrypts file contents before sending them to Telegram. Names and folders stay visible.')}</small>
            </span>
        </label>
    {/if}
    {#if canMerge}
        <label class="modal-choice-row">
            <input id="import-options-merge" type="checkbox" bind:checked={merge} />
            <span>
                <strong>{$desktopCopy('Merge matching folders')}</strong>
                <small>{$desktopCopy('Add to existing folders with the same name. Otherwise, import as separate folders.')}</small>
            </span>
        </label>
        {#if merge}
            <div class="modal-choice-group" role="radiogroup" aria-label={$desktopCopy('Files with the same name')}>
                <label class="modal-choice-row">
                    <input type="radio" name="import-file-conflict" value="skip" bind:group={fileConflict} />
                    <span>{$desktopCopy('Skip files with the same name')}</span>
                </label>
                <label class="modal-choice-row">
                    <input type="radio" name="import-file-conflict" value="keep-both" bind:group={fileConflict} />
                    <span>
                        {$desktopCopy('Keep both files')}
                        <small>{$desktopCopy('The new copy gets a number, like Report (1).txt.')}</small>
                    </span>
                </label>
            </div>
        {/if}
    {/if}
    {#if note}
        <p id="import-options-note" class="import-options-note">{note}</p>
    {/if}

    {#snippet actions()}
        <button id="import-options-cancel" class="secondary-btn" type="button" onclick={onCancel}>{$desktopCopy('Cancel')}</button>
        <button
            id="import-options-confirm"
            class="primary-btn"
            type="button"
            disabled={$view.payload?.plan.limitExceeded || $view.payload?.replanning}
            aria-busy={$view.payload?.replanning}
            onclick={() => onConfirm({ encrypt, extract, ...(canMerge && merge ? { folderMerge: fileConflict } : {}) })}
        >
            {$view.payload?.replanning ? $desktopCopy('Checking…') : $view.payload?.queued ? $desktopCopy('Add to queue') : $desktopCopy('Import')}
        </button>
    {/snippet}
</ModalShell>
