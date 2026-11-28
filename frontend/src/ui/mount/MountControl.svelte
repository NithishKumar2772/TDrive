<script lang="ts">
    import EjectIcon from '@lucide/svelte/icons/eject';
    import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
    import { onMount } from 'svelte';
    import { notify } from '../../modules/notifications';
    import type { MountableDrive } from '../../types';
    import { locale } from '../i18n/locale-store';
    import { translate } from '../i18n/messages';
    import { workspaceText } from '../i18n/workspace-messages';
    import {
        createMountController,
        defaultMountApi,
        type MountController,
    } from './mount-controller';

    interface Props {
        controller?: MountController;
        onMenuAction?: () => void;
        loadDrives?: () => Promise<readonly MountableDrive[]>;
        variant?: 'menu' | 'sidebar';
    }

    let {
        controller = createMountController(defaultMountApi, notify),
        onMenuAction = () => undefined,
        loadDrives,
        variant = 'menu',
    }: Props = $props();

    let loadingDrives = $derived(controller.loadingDrives);

    onMount(() => {
        void controller.refresh();
    });

    const mountAction = $derived(translate('mount', $locale));
    const mountLabel = $derived(`${mountAction} ${$controller.label}`);
    const ejectAction = $derived(workspaceText('ejectDrive', $locale));
    const ejectLabel = $derived.by(() => {
        if ($controller.phase !== 'disconnecting') return ejectAction;
        if ($controller.mode === 'read-write' && $controller.writeState === 'draining') {
            const pending = $controller.activeWrites;
            const finishing = workspaceText('finishingChanges', $locale);
            if (pending <= 0) return finishing;
            if ($locale === 'en') return `Finishing ${pending} ${pending === 1 ? 'change' : 'changes'}...`;
            return `${finishing} (${pending.toLocaleString($locale)})`;
        }
        return workspaceText('ejectingDrive', $locale);
    });
    const mountStatus = $derived(
        $loadingDrives
            ? workspaceText('loadingDrives', $locale)
            : $controller.phase === 'mounting'
                ? workspaceText('mountingDrive', $locale, { name: $controller.label })
                : mountAction,
    );
</script>

<div
    class="mount-control"
    role="group"
    aria-label={$locale === 'en' ? `${$controller.label} mount controls` : mountLabel}
    lang={$locale}
    aria-live="polite"
>
    {#if $controller.mounted}
        <button
            id="disconnect-mounted-drive-button"
            class={variant === 'menu' ? 'profile-menu-item mount-menu-item' : 'drive-action-btn mount-sidebar-action'}
            type="button"
            role={variant === 'menu' ? 'menuitem' : undefined}
            disabled={$controller.phase === 'disconnecting'}
            aria-busy={$controller.phase === 'disconnecting' ? 'true' : undefined}
            aria-label={ejectAction}
            onclick={() => {
                onMenuAction();
                void controller.disconnect();
            }}
        >
            <EjectIcon class="mount-action-icon" size={16} strokeWidth={2} aria-hidden="true" />
            <span class="mount-menu-title">{ejectLabel}</span>
            {#if $controller.phase === 'disconnecting'}
                <span class="mount-menu-spinner" aria-hidden="true"></span>
            {/if}
        </button>
    {:else}
        <button
            id="mount-drive-button"
            class={variant === 'menu' ? 'profile-menu-item mount-menu-item' : 'drive-action-btn mount-sidebar-action'}
            type="button"
            role={variant === 'menu' ? 'menuitem' : undefined}
            disabled={$loadingDrives || $controller.phase === 'mounting'}
            aria-busy={$loadingDrives || $controller.phase === 'mounting' ? 'true' : undefined}
            aria-label={mountLabel}
            onclick={() => {
                void controller.requestMount({ loadDrives, onAction: onMenuAction });
            }}
        >
            <HardDriveIcon class="mount-action-icon" size={16} strokeWidth={2} aria-hidden="true" />
            <span class="mount-menu-title">
                {mountStatus}
            </span>
            {#if $loadingDrives || $controller.phase === 'mounting'}
                <span class="mount-menu-spinner" aria-hidden="true"></span>
            {/if}
        </button>
    {/if}

    {#if $controller.phase === 'error'}
        <span class="mount-announcement" role="alert" lang="en">
            {$controller.error || 'The drive operation failed. Try again.'}
        </span>
    {/if}
</div>

<style>
    .mount-control {
        position: relative;
        display: block;
        width: 100%;
    }

    .mount-menu-item {
        min-width: 0;
    }

    .mount-menu-item:disabled {
        cursor: wait;
        opacity: 0.65;
    }

    .mount-sidebar-action {
        width: 100%;
        min-width: 0;
        justify-content: flex-start;
        text-align: left;
    }

    .mount-sidebar-action:disabled {
        cursor: wait;
        opacity: 0.65;
    }

    .mount-control :global(.mount-action-icon) {
        width: 16px;
        height: 16px;
        flex: 0 0 auto;
    }

    .mount-menu-title {
        min-width: 0;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .mount-menu-spinner {
        width: 13px;
        height: 13px;
        flex: 0 0 auto;
        margin-left: auto;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: var(--radius-pill);
        animation: mount-menu-spin 720ms linear infinite;
    }

    .mount-announcement {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    @keyframes mount-menu-spin {
        to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
        .mount-menu-spinner {
            animation: none;
        }
    }
</style>
