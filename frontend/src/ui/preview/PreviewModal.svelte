<script lang="ts">
    import { desktopCopy, desktopLocale } from '../i18n/desktop-copy';
    import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
    import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
    import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
    import DownloadIcon from '@lucide/svelte/icons/download';
    import EyeIcon from '@lucide/svelte/icons/eye';
    import EyeOffIcon from '@lucide/svelte/icons/eye-off';
    import FingerprintIcon from '@lucide/svelte/icons/fingerprint';
    import InfoIcon from '@lucide/svelte/icons/info';
    import LockIcon from '@lucide/svelte/icons/lock';
    import XIcon from '@lucide/svelte/icons/x';
    import ViewerTopBar from '../viewers/ViewerTopBar.svelte';
</script>

<div lang={$desktopLocale} id="preview-shell" class="preview-shell" role="dialog" aria-modal="true" aria-labelledby="preview-filename">
    <ViewerTopBar class="preview-chrome" titleId="preview-filename" liveTitle closeId="preview-close" closeLabel={$desktopCopy("Close preview")}>
        {#snippet actions()}
            <button id="preview-info-btn" class="viewer-icon-btn" type="button" aria-label={$desktopCopy("Photo info")} aria-pressed="false" title={$desktopCopy("Info (i)")}>
                <InfoIcon aria-hidden="true" />
            </button>
            <button id="preview-download" class="viewer-icon-btn" type="button" aria-label={$desktopCopy("Download original")} title={$desktopCopy("Download original")}>
                <DownloadIcon aria-hidden="true" />
            </button>
        {/snippet}
    </ViewerTopBar>

    <button id="preview-prev" class="preview-nav preview-nav-prev" type="button" aria-label={$desktopCopy("Previous image")} hidden>
        <ChevronLeftIcon aria-hidden="true" />
    </button>
    <button id="preview-next" class="preview-nav preview-nav-next" type="button" aria-label={$desktopCopy("Next image")} hidden>
        <ChevronRightIcon aria-hidden="true" />
    </button>

    <div id="preview-counter" class="preview-counter" hidden></div>

    <div id="preview-stage" class="preview-content">
        <img id="preview-thumbnail" class="preview-thumbnail" src="" alt="" aria-hidden="true" hidden>
        <img id="preview-image" class="preview-original" src="" alt="" hidden>
        <div id="preview-loading" class="preview-loading" role="status" aria-label={$desktopCopy("Loading original image")} aria-hidden="true" style="display: none;">
            <div class="preview-loading-track" aria-hidden="true">
                <div id="preview-loading-fill" class="preview-loading-fill"></div>
            </div>
        </div>
        <div id="preview-error" class="preview-error" style="display: none;" role="alert"></div>
    </div>

    <aside id="preview-info" class="preview-info" aria-label={$desktopCopy("Photo info")} aria-hidden="true" inert>
        <button id="preview-info-close" class="preview-info-close" type="button" aria-label={$desktopCopy("Close info")} title={$desktopCopy("Close info")}>
            <XIcon size={14} aria-hidden="true" />
        </button>
        <div id="preview-info-body"></div>
    </aside>

    <div id="preview-locked" class="preview-locked" style="display: none;" role="group" aria-label={$desktopCopy("Locked photo")}>
        <div class="preview-unlock">
            <div class="preview-unlock-bar">
                <LockIcon class="preview-unlock-lock" strokeWidth={1.7} aria-hidden="true" />
                <input id="preview-locked-input" type="password" placeholder={$desktopCopy("Password")} autocomplete="current-password" spellcheck="false" aria-label={$desktopCopy("Encryption password")}>
                <button id="preview-locked-eye" class="preview-unlock-eye" type="button" aria-label={$desktopCopy("Show password")} aria-pressed="false">
                    <EyeIcon class="preview-eye-show" strokeWidth={1.8} aria-hidden="true" />
                    <EyeOffIcon class="preview-eye-hide" strokeWidth={1.8} aria-hidden="true" />
                </button>
                <button id="preview-locked-unlock" class="preview-unlock-go" type="button" aria-label={$desktopCopy("Unlock")}>
                    <ArrowRightIcon strokeWidth={2.2} aria-hidden="true" />
                </button>
            </div>
            <div id="preview-locked-error" class="preview-unlock-error" style="display: none;" role="alert"></div>
            <div id="preview-locked-hint" class="preview-unlock-hint" style="display: none;">{$desktopCopy("Hint:")} <span id="preview-locked-hint-text"></span></div>
            <button id="preview-locked-biometric" class="preview-unlock-biometric" type="button" hidden>
                <FingerprintIcon size={20} aria-hidden="true" />
                <span id="preview-locked-biometric-label">{$desktopCopy("Use biometrics")}</span>
            </button>
            <p class="preview-unlock-biometric-help">{$desktopCopy("Both options unlock the current session.")}</p>
        </div>
    </div>
</div>

<style>
    :global(#preview-locked-eye .preview-eye-hide) {
        display: none;
    }

    :global(#preview-locked-eye[aria-pressed="true"] .preview-eye-show) {
        display: none;
    }

    :global(#preview-locked-eye[aria-pressed="true"] .preview-eye-hide) {
        display: block;
    }
</style>
