import { createModalController } from '../modals/modal-store';

/**
 * What the trash's confirm dialog is about. The dialog carries a snapshot
 * rather than the row itself: a row that changed
 * or disappeared underneath it must not change the question being asked.
 */
export type TrashConfirmation =
    | { kind: 'purge'; objectId: string; name: string; isFolder: boolean }
    | { kind: 'empty'; summary: string; count?: number; bytes?: number };

export const trashConfirmModal = createModalController<TrashConfirmation>();
