<script lang="ts">
    import { desktopCopy } from '../i18n/desktop-copy';
    interface Props { title: string; message: string }
    let { title, message }: Props = $props();
    let copyState = $state<'copied' | 'failed' | null>(null);
    async function copy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(`${title}\n${message}`);
            copyState = 'copied';
        } catch {
            copyState = 'failed';
        }
    }
</script>

{#if message}
    <div class="message-block">
        <p class="activity-message">{message}</p>
        <button type="button" class="notif-row-copy" onclick={() => void copy()}>{$desktopCopy('Copy details')}</button>
        {#if copyState}
            <p class="copy-status" role="status">
                {copyState === 'copied' ? $desktopCopy('Details copied')
                    : $desktopCopy('Could not copy. Select the message to copy it manually.')}
            </p>
        {/if}
    </div>
{/if}

<style>
    .message-block { margin-block: var(--space-4); }
    .activity-message { margin: 0 0 var(--space-3); white-space: pre-wrap; overflow-wrap: anywhere; user-select: text; line-height: var(--leading-normal); }
    .copy-status { color: var(--color-text-muted); font-size: var(--type-xs); }
</style>
