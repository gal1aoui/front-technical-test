import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FILE_FEATURE_KEY, FileState } from './file.state';

export const selectFileState = createFeatureSelector<FileState>(FILE_FEATURE_KEY);

export const selectRootItems = createSelector(
	selectFileState,
	state => state.items
);
export const selectFileLoading = createSelector(
	selectFileState,
	state => state.loading
);
export const selectFileUploading = createSelector(
	selectFileState,
	state => state.uploading
);
export const selectFileError = createSelector(
	selectFileState,
	state => state.error
);
