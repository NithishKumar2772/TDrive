<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import CircleXIcon from '@lucide/svelte/icons/circle-x';
    import XIcon from '@lucide/svelte/icons/x';
    import type { FailedUploadsPayload } from '../modals/failed-uploads-store';
    interface Props {
        reports: FailedUploadsPayload[];
        // The bell panel and the phone Transfers tab each own their section
        // chrome; the rows match whichever list they sit beside.
        variant?: 'panel' | 'mobile';
        onReview: (report: FailedUploadsPayload) => void;
        onDismiss: (report: FailedUploadsPayload) => void;
    }
    let { reports, variant = 'panel', onReview, onDismiss }: Props = $props();

    function summary(report: FailedUploadsPayload): string {
        const retryable = report.failures.filter((failure) => failure.retryable).length;
        return retryable ? $desktopCopy('{drive} · {count} ready to retry', { drive: report.driveTitle, count: retryable }) : report.driveTitle;
    }
</script>

{#if reports.length}
    <section lang={$desktopLocale} aria-label={$desktopCopy('Upload failures')} class="failed-upload-reports" data-variant={variant}>
        {#if variant === 'mobile'}
            <div class="transfers-section-head"><h2 class="mobile-section-label">{$desktopCopy('Needs attention')}</h2></div>
        {:else}
            <h3 class="notif-section-label">{$desktopCopy('Needs attention')}</h3>
        {/if}
        <div class={variant === 'mobile' ? 'transfers-group' : 'notif-section'} role="list">
            {#each reports as report (report)}
                <div class="notif-row failed-upload-report" role="listitem">
                    <span class="notif-row-icon" data-kind="error" aria-hidden="true">
                        <CircleXIcon size={14} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <div class="notif-row-body">
                        <div class="notif-row-title">
                            {report.failures.length === 1
                                ? $desktopCopy("{count} file didn't upload", { count: report.failures.length })
                                : $desktopCopy("{count} files didn't upload", { count: report.failures.length })}
                        </div>
                        <div class="notif-row-sub">{summary(report)}</div>
                    </div>
                    <div class="failed-upload-actions">
                        <button class="failed-upload-review" type="button" aria-label={$desktopCopy('Review failed files')} onclick={() => onReview(report)}>{$desktopCopy('Review')}</button>
                        <button class="notif-row-cancel" type="button" aria-label={$desktopCopy('Dismiss failed files in {drive}', { drive: report.driveTitle })} onclick={() => onDismiss(report)}>
                            <XIcon size={14} strokeWidth={2} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    </section>
{/if}

<style>
    .failed-upload-reports[data-variant='panel'] { margin-bottom: 14px; }
    .failed-upload-report { grid-template-columns: 22px minmax(0, 1fr) auto; }
    .failed-upload-actions { display: flex; align-items: center; gap: 4px; }
    .failed-upload-review {
        min-height: 26px;
        padding: 3px 9px;
        border: 1px solid var(--overlay-accent-2);
        border-radius: var(--radius-sm);
        background: var(--overlay-accent-1);
        color: var(--accent);
        font: inherit;
        font-size: var(--type-xs);
        font-weight: var(--weight-semibold);
        cursor: pointer;
        transition: background-color var(--motion-med) var(--ease-standard);
    }
    @media (hover: hover) {
        .failed-upload-review:hover { background: var(--overlay-accent-2); }
    }
    .failed-upload-review:focus-visible,
    .failed-upload-actions .notif-row-cancel:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .failed-upload-actions .notif-row-cancel { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
    /* Larger touch targets on phones. */
    [data-variant='mobile'] .failed-upload-review { min-height: 36px; padding: 0 14px; font-size: var(--type-sm); }
    [data-variant='mobile'] .failed-upload-actions .notif-row-cancel { width: 40px; height: 40px; }
</style>
