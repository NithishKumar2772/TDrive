<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
    import { isAndroidPlatform } from '../../api';
    import type { ResumableDownload } from '../../api/resumable-downloads';
    import { discardDownload, pauseDownload, resumePausedDownload, saveRecoveredDownload } from '../../modules/resumable-downloads';
    import { canSaveToDownloads } from '../../modules/android-downloads';
    import { formatBytes } from '../../utils';
    import { formatEta, formatSizePair } from './transfer-view';

    interface Props { job: ResumableDownload; mobile?: boolean; onOpen?: () => void }
    let { job, mobile = false, onOpen }: Props = $props();
    let busy = $state(false);
    let confirmingDiscard = $state(false);
    let confirmationStatus = $state<string | null>(null);

    $effect(() => {
        if (job.status === confirmationStatus) return;
        confirmationStatus = job.status;
        confirmingDiscard = false;
    });

    const percent = $derived(job.totalBytes > 0 ? Math.min(100, job.verifiedBytes / job.totalBytes * 100) : 0);
    const stateLabel = $derived(
        job.status === 'downloading' ? $desktopCopy('Downloading')
        : job.status === 'waiting_network' ? $desktopCopy('Waiting for connection')
        : job.status === 'waiting_unlock' ? $desktopCopy('Unlock to continue')
        : job.status === 'needs_destination' ? $desktopCopy('Save location needed')
        : job.status === 'source_changed' ? $desktopCopy('Source changed')
        : job.status === 'verifying' ? $desktopCopy('Verifying')
        : job.status === 'saving' ? $desktopCopy('Saving')
        : job.status === 'completed' ? $desktopCopy('Ready to save')
        : job.status === 'error' ? $desktopCopy('Needs attention')
        : $desktopCopy('Paused'),
    );
    const rate = $derived(job.status === 'downloading' && job.speed > 0 ? `${formatBytes(job.speed)}/s` : '');
    const eta = $derived(job.status === 'downloading' && job.speed > 0 && percent >= 5
        && (job.totalBytes - job.verifiedBytes) / job.speed <= 24 * 60 * 60
        ? formatEta((job.totalBytes - job.verifiedBytes) / job.speed, $desktopCopy)
        : '');
    const detail = $derived([stateLabel, $desktopCopy('{size} downloaded', { size: formatSizePair(job.verifiedBytes, job.totalBytes, $desktopCopy) }), rate, eta].filter(Boolean).join(' · '));
    const guidance = $derived(
        job.status === 'waiting_network' ? $desktopCopy('TDrive will continue when your connection returns.')
        : job.status === 'waiting_unlock' ? $desktopCopy('Unlock your vault, then resume this download.')
        : job.status === 'needs_destination' ? $desktopCopy('Choose a new save location to keep these downloaded bytes.')
        : job.status === 'source_changed' ? $desktopCopy('This file changed in Telegram. Start a fresh download from Files.')
        : job.status === 'completed' && isAndroidPlatform()
            ? canSaveToDownloads() ? $desktopCopy('The file is verified. Save it to your Downloads folder.') : $desktopCopy('This build cannot save to Downloads. Update TDrive to finish saving.')
        : job.error,
    );

    async function act(action: () => Promise<void>): Promise<void> {
        if (busy) return;
        busy = true;
        try { await action(); }
        finally { busy = false; }
    }
</script>

<div class:mobile class="download-row" data-phase={job.status} lang={$desktopLocale} role={mobile ? 'listitem' : undefined}>
    <span class="glyph" aria-hidden="true"><ArrowDownIcon size={mobile ? 15 : 14} strokeWidth={2} /></span>
    <div class="name" title={job.name}>{#if onOpen}<button class="preview-title" type="button" onclick={onOpen}>{job.name || $desktopCopy('Download')}</button>{:else}{job.name || $desktopCopy('Download')}{/if}</div>
    <div
        class="track"
        role="progressbar"
        aria-label={$desktopCopy('{name}, bytes received', { name: job.name || $desktopCopy('Download') })}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(percent)}
    ><div class="fill" style={`width:${percent}%`} aria-hidden="true"></div></div>
    <div class="detail">{detail}</div>
    {#if guidance}<p class="note">{guidance}</p>{/if}
    <div class="actions">
        {#if job.status === 'downloading' || job.status === 'verifying' || job.status === 'saving'}
            <button type="button" disabled={busy} aria-label={$desktopCopy('Pause {name}', { name: job.name })} onclick={() => void act(() => pauseDownload(job.jobId))}>{$desktopCopy('Pause')}</button>
        {:else if job.status === 'completed'}
            {#if isAndroidPlatform() && canSaveToDownloads()}
                <button type="button" disabled={busy} aria-label={$desktopCopy('Save {name} to Downloads', { name: job.name })} onclick={() => void act(() => saveRecoveredDownload(job.jobId))}>{$desktopCopy('Save to Downloads')}</button>
            {/if}
        {:else if job.status !== 'source_changed'}
            <button type="button" disabled={busy} aria-label={job.status === 'needs_destination' ? $desktopCopy('Choose location for {name}', { name: job.name }) : $desktopCopy('Resume {name}', { name: job.name })} onclick={() => void act(() => resumePausedDownload(job.jobId))}>
                {job.status === 'needs_destination' ? $desktopCopy('Choose location') : job.status === 'waiting_network' || job.status === 'error' ? $desktopCopy('Retry now') : $desktopCopy('Resume')}
            </button>
        {/if}
        {#if job.status !== 'downloading' && job.status !== 'verifying' && job.status !== 'saving' && job.status !== 'completed'}
            {#if confirmingDiscard}
                <button type="button" disabled={busy} onclick={() => confirmingDiscard = false}>{$desktopCopy('Keep')}</button>
                <button type="button" class="danger" disabled={busy} aria-label={$desktopCopy('Discard downloaded bytes for {name}', { name: job.name })} onclick={() => void act(() => discardDownload(job.jobId))}>{$desktopCopy('Discard bytes')}</button>
            {:else}
                <button type="button" class="danger" disabled={busy} aria-label={$desktopCopy('Discard {name}', { name: job.name })} onclick={() => confirmingDiscard = true}>{$desktopCopy('Discard')}</button>
            {/if}
        {/if}
    </div>
</div>

<style>
    .preview-title { max-width: 100%; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
    .preview-title:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
    .download-row { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 7px 10px; padding: 10px 12px; align-items: center; }
    .glyph { display: grid; place-items: center; width: 22px; height: 22px; color: var(--color-accent); }
    .name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: var(--weight-medium); }
    .track, .detail, .note, .actions { grid-column: 2 / -1; }
    .track { height: 5px; border-radius: var(--radius-pill); background: var(--overlay-neutral-2); overflow: hidden; }
    .fill { height: 100%; border-radius: inherit; background: var(--color-accent); transition: width var(--motion-med) var(--ease-standard); }
    .detail, .note { margin: 0; color: var(--color-text-muted); font-size: var(--type-xs); line-height: 1.45; }
    .detail { font-variant-numeric: tabular-nums; }
    .actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .actions button { min-height: 28px; padding: 4px 8px; border: 0; border-radius: var(--radius-md); background: var(--overlay-accent-1); color: var(--color-accent); font: inherit; cursor: pointer; }
    .actions button.danger { background: var(--overlay-danger-1); color: var(--color-danger); }
    .actions button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
    .actions button:disabled { opacity: .55; cursor: wait; }
    .mobile { grid-template-columns: 28px minmax(0, 1fr); gap: 7px 12px; padding: 12px 14px; }
    .mobile .glyph { width: 28px; height: 28px; border-radius: var(--radius-pill); background: var(--overlay-accent-1); }
    .mobile .name { font-size: var(--mobile-type-body); }
    .mobile .detail { font-size: var(--mobile-type-meta); }
    .mobile .note { font-size: var(--mobile-type-caption); }
    .mobile .actions button { min-height: 44px; padding: 0 12px; font-size: var(--mobile-type-meta); }
    @media (prefers-reduced-motion: reduce) { .fill { transition: none; } }
</style>
