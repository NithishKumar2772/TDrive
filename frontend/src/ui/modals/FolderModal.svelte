<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import ModalShell from './ModalShell.svelte';
    import { closeFolderModalView, folderModalState } from './folder-modal-store';

    interface Props {
        onSubmit: (name: string) => void | Promise<void>;
    }

    let { onSubmit }: Props = $props();
    let name = $state('');
    let wasOpen = false;

    function canClose(): boolean {
        return !$folderModalState.inFlight;
    }

    function close(): void {
        if (!canClose()) return;
        closeFolderModalView();
    }

    function submit(): void {
        if ($folderModalState.inFlight) return;
        const next = name.trim();
        if (!next) return;
        void onSubmit(next);
    }

    function onInputKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            submit();
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    }

    $effect(() => {
        if ($folderModalState.open && !wasOpen) {
            name = '';
        }
        wasOpen = $folderModalState.open;
    });
</script>

<ModalShell
    lang={$desktopLocale}
    hostId="folder-modal"
    open={$folderModalState.open}
    title={$desktopCopy("New folder")}
    titleId="folder-modal-title"
    subtitle={$desktopCopy("Create a folder in the current location.")}
    initialFocus="#new-folder-name"
    restoreFocus="#file-list"
    onClose={close}
>
    <label class="field-label" for="new-folder-name">{$desktopCopy("Folder name")}</label>
    <input
        id="new-folder-name"
        type="text"
        dir="auto"
        placeholder={$desktopCopy("e.g. Invoices")}
        autocomplete="off"
        bind:value={name}
        disabled={$folderModalState.inFlight}
        onkeydown={onInputKeydown}
    />

    {#snippet actions()}
        <button id="folder-cancel" class="secondary-btn" type="button" disabled={$folderModalState.inFlight} onclick={close}>
            {$desktopCopy("Cancel")}
        </button>
        <button
            id="folder-create"
            class="primary-btn"
            type="button"
            disabled={$folderModalState.inFlight || !name.trim()}
            onclick={submit}
        >
            {$desktopCopy("Create folder")}
        </button>
    {/snippet}
</ModalShell>
