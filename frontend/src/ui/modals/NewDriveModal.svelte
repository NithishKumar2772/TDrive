<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import ModalShell from './ModalShell.svelte';
    import { newDriveModal } from './new-drive-modal-store';

    interface Props {
        onSubmit: (title: string, requireApproval: boolean) => void | Promise<void>;
    }

    let { onSubmit }: Props = $props();
    let title = $state('');
    let requireApproval = $state(false);
    let wasOpen = false;

    const view = newDriveModal.state;

    function close(): void {
        if ($view.busy) return;
        newDriveModal.close();
    }

    function submit(): void {
        const next = title.trim();
        if (!next || $view.busy) return;
        void onSubmit(next, requireApproval);
    }

    function onInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            submit();
        }
    }

    $effect(() => {
        if ($view.open && !wasOpen) {
            title = '';
            requireApproval = false;
        }
        wasOpen = $view.open;
    });
</script>

<ModalShell
    lang={$desktopLocale}
    hostId="new-drive-modal"
    open={$view.open}
    title={$desktopCopy("New shared drive")}
    titleId="new-drive-title"
    subtitle={$desktopCopy("Friends can join your drive with the invite link you'll get next.")}
    initialFocus="#new-drive-name"
    restoreFocus="#drives-nav"
    onClose={close}
>
    <label class="field-label" for="new-drive-name">{$desktopCopy("Drive name")}</label>
    <input
        id="new-drive-name"
        type="text"
        dir="auto"
        placeholder={$desktopCopy("e.g. Goa Trip")}
        autocomplete="off"
        bind:value={title}
        disabled={$view.busy}
        onkeydown={onInputKeydown}
    />
    <label class="modal-choice-row">
        <input id="new-drive-require-approval" type="checkbox" bind:checked={requireApproval} disabled={$view.busy} />
        <span>
            <strong>{$desktopCopy("Require approval to join")}</strong>
            <small>{$desktopCopy("People can request access with the link, but an admin must approve them.")}</small>
        </span>
    </label>

    {#snippet actions()}
        <button id="new-drive-cancel" class="secondary-btn" type="button" disabled={$view.busy} onclick={close}>
            {$desktopCopy("Cancel")}
        </button>
        <button
            id="new-drive-create"
            class="primary-btn"
            type="button"
            disabled={$view.busy || !title.trim()}
            onclick={submit}
        >
            {$desktopCopy("Create")}
        </button>
    {/snippet}
</ModalShell>
