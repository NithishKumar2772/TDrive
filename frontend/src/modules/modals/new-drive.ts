// "New shared drive" modal.

import { desktopText } from '../../ui/i18n/desktop-copy';
import { createSharedDrive } from '../channels';
import { openShareDriveModal } from './share-drive';
import { notify, dismissNotification } from '../notifications';
import { humanizeBackendError } from '../errors';
import { newDriveModal } from '../../ui/modals/new-drive-modal-store';


export function openNewDriveModal() {
    newDriveModal.open(null);
}

export async function submitNewDrive(title: string, requireApproval: boolean): Promise<void> {
    const progressId = notify({
        id: 'creating-drive',
        level: 'info',
        title: desktopText('Creating drive…'),
        spinner: true,
    });
    newDriveModal.setBusy(true);
    try {
        const info = await createSharedDrive(title, requireApproval);
        newDriveModal.close();
        dismissNotification(progressId);
        notify({ level: 'success', title: desktopText('Drive "{name}" created', { name: title }) });
        if (info.inviteLink) {
            openShareDriveModal(info.inviteLink, { approvalRequired: requireApproval });
        }
    } catch (err) {
        dismissNotification(progressId);
        notify({
            level: 'error',
            title: desktopText('Could not create drive'),
            body: humanizeBackendError(err),
        });
    } finally {
        newDriveModal.setBusy(false);
    }
}
