<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
    import type { ResumableUpload } from '../../api/resumable-uploads';
    import { checkUploadStatus, chooseSourceAndResume, discardUpload, pauseUpload, resumeUpload } from '../../modules/resumable-uploads';
    import { formatSizePair } from './transfer-view';

    interface Props { job: ResumableUpload; onOpen?: () => void }
    let { job, onOpen }: Props = $props();
    let busy = $state(false);
    let confirmingDiscard = $state(false);
    let confirmationStatus = $state<string | null>(null);
    $effect(() => {
        if (job.status === confirmationStatus) return;
        confirmationStatus = job.status;
        confirmingDiscard = false;
    });

    const percent = $derived(job.size > 0 ? Math.min(100, job.confirmedBytes / job.size * 100) : 0);
    const stateLabel = $derived(
        job.status === 'uploading' ? $desktopCopy('Uploading')
        : job.status === 'paused' ? $desktopCopy('Paused')
        : job.status === 'waiting_network' ? $desktopCopy('Waiting for connection')
        : job.status === 'needs_source' ? $desktopCopy('Source file needed')
        : job.status === 'uncertain' ? $desktopCopy('Checking needed')
        : job.status === 'uncertain_manifest' ? $desktopCopy('Needs review')
        : job.status === 'restart_required' ? $desktopCopy('Restart needed')
        : job.status === 'canceling' ? $desktopCopy('Discarding…')
        : $desktopCopy('Paused'),
    );
    const detail = $derived([stateLabel, $desktopCopy('{size} confirmed', { size: formatSizePair(job.confirmedBytes, job.size, $desktopCopy) })].join(' · '));
    const guidance = $derived(
        job.status === 'needs_source'
            ? $desktopCopy('The source moved or changed. Choose the original file to verify it.')
            : job.status === 'waiting_network'
                ? $desktopCopy('TDrive will retry when your connection returns. You can also retry now.')
            : job.status === 'uncertain_manifest'
                ? $desktopCopy('TDrive cannot yet confirm whether this file was published. Leave its parts in place.')
                : job.status === 'uncertain'
                    ? $desktopCopy('The last part needs checking before the upload can continue.')
                : job.status === 'restart_required'
                    ? $desktopCopy('The file changed during upload. Discard these parts, then start a new upload.')
                : '',
    );

    async function act(action: () => Promise<void>): Promise<void> {
        if (busy) return;
        busy = true;
        try { await action(); }
        finally { busy = false; }
    }
</script>

<div class="notif-row notif-row-transfer resumable-row" data-phase={job.status} lang={$desktopLocale}>
    <span class="notif-row-icon" data-kind="upload" aria-hidden="true">
        <ArrowUpIcon size={14} strokeWidth={2} aria-hidden="true" />
    </span>
    <div class="notif-row-body">
        <div class="notif-row-title" title={job.name}>{#if onOpen}<button class="preview-title" type="button" onclick={onOpen}>{job.name || $desktopCopy('Large upload')}</button>{:else}{job.name || $desktopCopy('Large upload')}{/if}</div>
        <div
            class="notif-row-progress"
            role="progressbar"
            aria-label={$desktopCopy('{name}, confirmed in Telegram', { name: job.name || $desktopCopy('Large upload') })}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(percent)}
        >
            <div class="notif-row-progress-fill" style={`width:${percent}%`} aria-hidden="true"></div>
        </div>
        {#if guidance}<div class="notif-row-note">{guidance}</div>{/if}
    </div>
    <div class="notif-row-meta"><div class="notif-row-state">{detail}</div></div>
    {#if job.status !== 'canceling'}
        <div class="actions">
            {#if job.status === 'paused' || job.status === 'uncertain' || job.status === 'waiting_network'}
                <button class="notif-row-copy" type="button" disabled={busy} aria-label={job.status === 'waiting_network' ? $desktopCopy('Retry {name}', { name: job.name }) : $desktopCopy('Resume {name}', { name: job.name })} onclick={() => resumeUpload(job.jobId)}>{job.status === 'waiting_network' ? $desktopCopy('Retry now') : $desktopCopy('Resume')}</button>
            {:else if job.status === 'needs_source'}
                <button class="notif-row-copy" type="button" disabled={busy} onclick={() => chooseSourceAndResume(job.jobId)}>{$desktopCopy('Choose file')}</button>
            {:else if job.status === 'uploading'}
                <button class="notif-row-copy" type="button" disabled={busy} onclick={() => void act(() => pauseUpload(job.jobId))}>{$desktopCopy('Pause')}</button>
            {:else if job.status === 'uncertain_manifest'}
                <button class="notif-row-copy" type="button" disabled={busy} onclick={() => void act(() => checkUploadStatus(job.jobId))}>{busy ? $desktopCopy('Checking…') : $desktopCopy('Check and retry')}</button>
            {/if}
            {#if job.status !== 'uploading' && job.status !== 'uncertain_manifest'}
                {#if confirmingDiscard}
                    <button class="notif-row-copy" type="button" disabled={busy} onclick={() => confirmingDiscard = false}>{$desktopCopy('Keep')}</button>
                    <button class="notif-row-copy danger" type="button" disabled={busy} onclick={() => void act(() => discardUpload(job.jobId))}>{$desktopCopy('Discard parts')}</button>
                {:else}
                    <button class="notif-row-copy danger" type="button" disabled={busy} onclick={() => confirmingDiscard = true}>{$desktopCopy('Discard')}</button>
                {/if}
            {/if}
        </div>
    {/if}
</div>

<style>
    .preview-title { max-width: 100%; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
    .preview-title:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
    .resumable-row { grid-template-columns: 22px minmax(0, 1fr) auto; row-gap: 8px; }
    .resumable-row .notif-row-meta { grid-column: 2 / -1; margin-left: 0; align-items: flex-start; }
    .resumable-row .notif-row-body { grid-column: 2 / -1; }
    .resumable-row .notif-row-progress { margin-top: 2px; }
    .resumable-row .notif-row-state { color: var(--color-text-soft); font-variant-numeric: tabular-nums; }
    .actions { grid-column: 2 / -1; display: flex; flex-wrap: wrap; gap: 6px; }
    .actions .notif-row-copy { min-height: 28px; }
    .actions .danger { color: var(--color-danger); }
    .actions .danger:hover { background: var(--overlay-danger-1); }
    .actions .notif-row-copy:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
    .actions .notif-row-copy:disabled { opacity: .55; cursor: wait; }
</style>
