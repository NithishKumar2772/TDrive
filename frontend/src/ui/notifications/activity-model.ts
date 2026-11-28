import type { ResumableUpload } from '../../api/resumable-uploads';
import type { ResumableDownload } from '../../api/resumable-downloads';
import type { SourceCopyResult } from '../../api/source-copies';
import { englishCopy, type DesktopTranslator } from '../i18n/desktop-copy';
import { isUnfinishedTransfer, type HistoryEvent, type TransferEvent } from './notif-store';
import type { UploadActivity, UploadActivityFile } from './upload-activity-store';
import { formatAge, transferDetailParts, transferPercent } from './transfer-view';

export type ActivityFilter = 'All' | 'Active' | 'Queued' | 'Needs attention' | 'History';
export const ACTIVITY_FILTERS: readonly ActivityFilter[] = ['All', 'Active', 'Queued', 'Needs attention', 'History'];
interface EntryBase { id: string; name: string; status: ActivityFilter; summary: string; at: number }
export type ActivityEntry =
    | EntryBase & { kind: 'batch'; batch: UploadActivity; transfer?: TransferEvent }
    | EntryBase & { kind: 'transfer'; transfer: TransferEvent }
    | EntryBase & { kind: 'upload'; job: ResumableUpload }
    | EntryBase & { kind: 'download'; job: ResumableDownload }
    | EntryBase & { kind: 'sourceCopy'; copy: SourceCopyResult };

export function fileCountLabel(count: number, desktopCopy: DesktopTranslator = englishCopy): string {
    const formatted = count.toLocaleString();
    return count === 1 ? desktopCopy('{count} file', { count: formatted })
        : desktopCopy('{count} files', { count: formatted });
}

export function batchFailedFileCount(batch: UploadActivity): number {
    return batch.failedFileCount ?? batch.files.filter((file) => file.status === 'failed').length;
}

/** A queued batch only runs while its drive is open; the backend rejects any other. */
export function isBatchPaused(batch: UploadActivity, activeDriveId: number | null | undefined): boolean {
    return batch.status === 'queued' && typeof activeDriveId === 'number' && batch.driveId !== activeDriveId;
}

export function batchLabel(batch: UploadActivity, jobs: readonly ResumableUpload[] = [], activeDriveId?: number | null, paused = false, desktopCopy: DesktopTranslator = englishCopy): string {
    const linked = jobs.filter((job) => batch.resumableJobIds?.includes(job.jobId));
    if (batch.status !== 'active' && batch.status !== 'queued' && linked.length > 0) {
        if (linked.some((job) => job.status === 'uploading')) return desktopCopy('Resuming upload');
        if (linked.some((job) => job.status === 'canceling')) return desktopCopy('Discarding upload');
        return desktopCopy('Upload recovery needs attention');
    }
    if (isBatchPaused(batch, activeDriveId)) return desktopCopy('Paused until {drive} is open', { drive: batch.driveTitle });
    return batch.status === 'queued' ? desktopCopy('Queued')
        : batch.status === 'active' ? (paused ? desktopCopy('Paused') : desktopCopy('Uploading'))
        : batch.status === 'done' ? desktopCopy('Completed')
        : batch.status === 'failed' ? desktopCopy('Needs attention') : desktopCopy('Canceled');
}

/** The list line: the state first, then the one figure worth reading beside it. */
export function batchSummary(batch: UploadActivity, jobs: readonly ResumableUpload[] = [], activeDriveId?: number | null, transfer?: TransferEvent, now = Date.now(), paused = false, desktopCopy: DesktopTranslator = englishCopy): string {
    const label = batchLabel(batch, jobs, activeDriveId, paused, desktopCopy);
    const failed = batchFailedFileCount(batch);
    const percent = batch.status === 'active' && transfer ? transferPercent(transfer) : null;
    const files = fileCountLabel(batch.fileCount, desktopCopy);
    const figure = percent !== null ? `${Math.round(percent)}%`
        : batch.status === 'failed' && failed > 0 ? desktopCopy('{count} of {files} failed', { count: failed, files })
        : files;
    const age = batch.status === 'queued' || batch.status === 'active' ? '' : formatAge(batch.finishedAt, now, desktopCopy);
    return [label, figure, age].filter(Boolean).join(' · ');
}

export function batchActivityFilter(batch: UploadActivity, jobs: readonly ResumableUpload[]): ActivityFilter {
    if (batch.status === 'queued') return 'Queued';
    if (batch.status === 'active') return 'Active';
    const linked = jobs.filter((job) => batch.resumableJobIds?.includes(job.jobId));
    if (linked.some((job) => job.status === 'uploading' || job.status === 'canceling')) return 'Active';
    if (linked.length || batch.status === 'failed') return 'Needs attention';
    return 'History';
}

const FILTER_RANK: Record<ActivityFilter, number> = { Active: 0, Queued: 1, 'Needs attention': 2, History: 3, All: 4 };

/**
 * Running work first, then the queue in the order it will run, then what needs
 * a decision, then history newest first.
 */
function compareEntries(a: ActivityEntry, b: ActivityEntry): number {
    const rank = FILTER_RANK[a.status] - FILTER_RANK[b.status];
    if (rank) return rank;
    return a.status === 'Queued' ? a.at - b.at : b.at - a.at;
}

export function activityEntries(batches: readonly UploadActivity[], events: readonly HistoryEvent[], uploads: readonly ResumableUpload[], downloads: readonly ResumableDownload[], options: {
    allEvents?: readonly HistoryEvent[];
    activeDriveId?: number | null;
    now?: number;
    uploadsPaused?: boolean;
    sourceCopies?: readonly SourceCopyResult[];
    checkingCopies?: ReadonlySet<string>;
    desktopCopy?: DesktopTranslator;
} = {}): ActivityEntry[] {
    const { allEvents = events, activeDriveId, now = Date.now(), uploadsPaused = false, sourceCopies = [], checkingCopies, desktopCopy = englishCopy } = options;
    const entries: ActivityEntry[] = batches.map((batch) => {
        const transfer = allEvents.find((event): event is TransferEvent => event.kind === 'transfer' && event.id === batch.transferId);
        return {
            kind: 'batch', id: batch.id, name: batch.name,
            status: batchActivityFilter(batch, uploads),
            summary: batchSummary(batch, uploads, activeDriveId, transfer, now, uploadsPaused, desktopCopy),
            at: batch.status === 'queued' ? batch.addedAt : batch.finishedAt || batch.startedAt || batch.addedAt,
            batch, transfer,
        };
    });
    const representedJobs = new Set(batches.flatMap((batch) => batch.resumableJobIds ?? []));
    // The batch owns its aggregate row: one entry with full file detail, not two.
    const batchTransfers = new Set(batches.map((batch) => batch.transferId).filter(Boolean));
    for (const job of uploads.filter((job) => !representedJobs.has(job.jobId))) entries.push({
        kind: 'upload', id: `upload:${job.jobId}`, name: job.name || desktopCopy('Large upload'),
        status: job.status === 'uploading' || job.status === 'canceling' ? 'Active' : 'Needs attention',
        summary: uploadStatus(job.status, desktopCopy), at: now, job,
    });
    for (const job of downloads) entries.push({
        kind: 'download', id: `download:${job.jobId}`, name: job.name || desktopCopy('Download'),
        status: ['downloading', 'verifying', 'saving'].includes(job.status) ? 'Active' : 'Needs attention',
        summary: downloadStatus(job.status, desktopCopy), at: now, job,
    });
    for (const copy of sourceCopies) {
        const checking = checkingCopies?.has(copy.id);
        const summary = {
            saved: desktopCopy('Saved to My Drive'),
            pending: desktopCopy('Copy to My Drive pending'),
            failed: desktopCopy('Could not save to My Drive'),
            canceled: desktopCopy('Copy canceled'),
        }[copy.status];
        entries.push({
            kind: 'sourceCopy', id: `source-copy:${copy.id}`, name: copy.name,
            status: checking ? 'Active' : copy.status === 'pending' ? 'Needs attention' : 'History',
            summary: checking ? desktopCopy('Checking copy…') : summary, at: now, copy,
        });
    }
    for (const transfer of events) {
        if (transfer.kind !== 'transfer' || batchTransfers.has(transfer.id)) continue;
        entries.push({
            kind: 'transfer', id: transfer.id, name: transfer.name || (transfer.direction === 'up' ? desktopCopy('Upload') : desktopCopy('Download')),
            status: transfer.status === 'queued' ? 'Queued' : transfer.status === 'failed' ? 'Needs attention' : isUnfinishedTransfer(transfer.status) ? 'Active' : 'History',
            summary: transferDetailParts(transfer, now, desktopCopy).map((part) => part.text).join(' · '),
            at: transfer.finishedAt || transfer.startedAt, transfer,
        });
    }
    return entries.sort(compareEntries);
}

function uploadStatus(status: ResumableUpload['status'], desktopCopy: DesktopTranslator): string {
    switch (status) {
        case 'uploading': return desktopCopy('uploading');
        case 'paused': return desktopCopy('paused');
        case 'waiting_network': return desktopCopy('waiting network');
        case 'needs_source': return desktopCopy('needs source');
        case 'uncertain': return desktopCopy('uncertain');
        case 'uncertain_manifest': return desktopCopy('uncertain manifest');
        case 'restart_required': return desktopCopy('restart required');
        case 'canceling': return desktopCopy('canceling');
        case 'completed': return desktopCopy('completed');
    }
}

function downloadStatus(status: ResumableDownload['status'], desktopCopy: DesktopTranslator): string {
    switch (status) {
        case 'downloading': return desktopCopy('downloading');
        case 'waiting_network': return desktopCopy('waiting network');
        case 'waiting_unlock': return desktopCopy('waiting unlock');
        case 'needs_destination': return desktopCopy('needs destination');
        case 'source_changed': return desktopCopy('source changed');
        case 'verifying': return desktopCopy('verifying');
        case 'saving': return desktopCopy('saving');
        case 'completed': return desktopCopy('completed');
        case 'error': return desktopCopy('error');
        case 'paused': return desktopCopy('paused');
    }
}

export interface FileFolder { folder: string; files: UploadActivityFile[] }

/**
 * A batch's files by the folder they sit in, in the order the upload reached
 * them: loose files first, then each folder of the selection.
 */
export function groupFilesByFolder(files: readonly UploadActivityFile[]): FileFolder[] {
    const groups = new Map<string, UploadActivityFile[]>([['', []]]);
    for (const file of [...files].sort((a, b) => a.index - b.index)) {
        const path = file.path ?? '';
        const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
        const group = groups.get(folder);
        if (group) group.push(file);
        else groups.set(folder, [file]);
    }
    return [...groups].filter(([, members]) => members.length).map(([folder, members]) => ({ folder, files: members }));
}

/** Batch file names remain searchable even when they are outside the DOM page. */
export function matchesActivity(entry: ActivityEntry, query: string): boolean {
    const text = query.trim().toLocaleLowerCase();
    if (!text) return true;
    if (`${entry.name} ${entry.summary}`.toLocaleLowerCase().includes(text)) return true;
    return entry.kind === 'batch' && (entry.batch.files.some((file) => (file.path ?? file.name).toLocaleLowerCase().includes(text))
        || `${entry.batch.driveTitle} ${entry.batch.destination}`.toLocaleLowerCase().includes(text));
}

export function activityTimestamp(timestamp?: number, locale?: string, desktopCopy: DesktopTranslator = englishCopy): string {
    return timestamp && timestamp > 0
        ? new Date(timestamp).toLocaleString(locale === 'en' ? undefined : locale, { dateStyle: 'medium', timeStyle: 'short' })
        : desktopCopy('Not recorded');
}
