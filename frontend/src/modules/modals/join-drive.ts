// "Join shared drive" modal.

import { desktopText } from '../../ui/i18n/desktop-copy';
import { joinSharedDrive } from '../channels';
import { notify, dismissNotification } from '../notifications';
import { humanizeBackendError } from '../errors';
import { joinDriveModal } from '../../ui/modals/join-drive-modal-store';


export function openJoinDriveModal() {
    joinDriveModal.open(null);
}

export async function submitJoinDrive(link: string): Promise<void> {
    const progressId = notify({
        id: 'joining-drive',
        level: 'info',
        title: desktopText('Joining drive…'),
        body: desktopText('If the drive has lots of history, this can take a few seconds.'),
        spinner: true,
    });
    joinDriveModal.setBusy(true);
    try {
        const result = await joinSharedDrive(link);
        joinDriveModal.close();
        dismissNotification(progressId);
        if (result?.status === 'pending') {
            notify({
                level: 'success',
                title: desktopText('Join request sent'),
                body: desktopText('The drive will appear after an admin approves you.'),
            });
        } else {
            notify({
                level: 'success',
                title: desktopText('Joined drive'),
                body: result?.channel?.title ? String(result.channel.title) : '',
            });
        }
    } catch (err) {
        dismissNotification(progressId);
        notify({
            level: 'error',
            title: desktopText('Could not join drive'),
            body: humanizeBackendError(err),
        });
    } finally {
        joinDriveModal.setBusy(false);
    }
}
