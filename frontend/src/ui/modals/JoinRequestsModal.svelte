<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import ModalShell from './ModalShell.svelte';
    import {
        joinRequestsList,
        joinRequestsModal,
        type JoinRequestRow,
    } from './join-requests-modal-store';

    interface Props {
        onAction: (userId: number, approved: boolean) => void | Promise<void>;
        onRetry: () => void;
    }

    let { onAction, onRetry }: Props = $props();

    const view = joinRequestsModal.state;
    const list = joinRequestsList;
    const subtitle = $derived($desktopCopy('Pending requests for {name}.', {
        name: $view.payload?.title ?? $desktopCopy('this drive'),
    }));

    function close(): void {
        joinRequestsModal.close();
    }

    function detailFor(row: JoinRequestRow): string {
        const pieces: string[] = [];
        if (row.username) pieces.push(row.username);
        if (row.requestedAt) {
            const locale = $desktopLocale === 'en' ? undefined : $desktopLocale;
            pieces.push(new Date(row.requestedAt * 1000).toLocaleString(locale));
        }
        return pieces.join(' · ');
    }
</script>

<ModalShell
    lang={$desktopLocale}
    hostId="join-requests-modal"
    open={$view.open}
    title={$desktopCopy("Join requests")}
    titleId="join-requests-title"
    {subtitle}
    initialFocus="#join-requests-close"
    restoreFocus="#drives-nav"
    onClose={close}
>
    <div id="join-requests-list" class="join-requests-list">
        {#if $list.status === 'loading'}
            <div class="modal-empty">{$desktopCopy("Loading requests…")}</div>
        {:else if $list.status === 'error'}
            <div class="modal-error join-requests-error" role="alert">
                <span>{$desktopCopy("We couldn't load the requests.")} {$list.message}</span>
                <button type="button" class="link-button" onclick={onRetry}>{$desktopCopy("Try again")}</button>
            </div>
        {:else if $list.rows.length === 0}
            <div class="modal-empty">{$desktopCopy("No pending requests.")}</div>
        {:else}
            {#each $list.rows as row (row.userId)}
                <div class="join-request-row">
                    <div class="join-request-meta">
                        <div class="join-request-name">{row.displayName}</div>
                        <div class="join-request-detail">{detailFor(row)}</div>
                    </div>
                    <div class="join-request-actions">
                        <button
                            type="button"
                            class="secondary-btn compact-btn"
                            disabled={$list.actingUserId !== 0}
                            onclick={() => void onAction(row.userId, true)}
                        >
                            {$desktopCopy("Approve")}
                        </button>
                        <button
                            type="button"
                            class="secondary-btn compact-btn danger-text"
                            disabled={$list.actingUserId !== 0}
                            onclick={() => void onAction(row.userId, false)}
                        >
                            {$desktopCopy("Reject")}
                        </button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    {#snippet actions()}
        <button id="join-requests-close" class="secondary-btn" type="button" onclick={close}>{$desktopCopy("Close")}</button>
    {/snippet}
</ModalShell>

<style>
    /* The humanised reason sits above its own Try again, so the retry is not
       buried at the end of a sentence. */
    .join-requests-error {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
    }
</style>
