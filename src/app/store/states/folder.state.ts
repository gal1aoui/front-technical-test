export const FOLDER_FEATURE_KEY = 'folder';

export interface FolderState {
	currentParentId: string | null;
	error: string | null;
}

export const initialFolderState: FolderState = {
	currentParentId: null,
	error: null,
};
