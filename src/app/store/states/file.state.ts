import { FileItem } from '../../models/file-item.model';

export const FILE_FEATURE_KEY = 'file';

export interface FileState {
	items: FileItem[];
	loading: boolean;
	uploading: boolean;
	error: string | null;
}

export const initialFileState: FileState = {
	items: [],
	loading: false,
	uploading: false,
	error: null,
};
