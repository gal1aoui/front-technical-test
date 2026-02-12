import { createReducer, on } from '@ngrx/store';
import { FolderActions } from '../actions/folder.actions';
import { initialFolderState } from '../states/folder.state';
import { FileActions } from '../actions/file.actions';

export const folderReducer = createReducer(
	initialFolderState,
	on(FolderActions.setCurrentFolder, (state, { parentId }) => ({
		...state,
		currentParentId: parentId,
		error: null,
	})),
	on(FileActions.loadItemsSuccess, (state, { items }) => ({
		...state,
		currentParentId:
			state.currentParentId &&
			!items.some(item => item.id === state.currentParentId)
				? null
				: state.currentParentId,
	})),
	on(FolderActions.createFolderFailure, (state, { error }) => ({
		...state,
		error,
	})),
	on(FolderActions.renameFolderFailure, (state, { error }) => ({
		...state,
		error,
	})),
	on(FolderActions.moveFolderFailure, (state, { error }) => ({
		...state,
		error,
	})),
	on(FolderActions.deleteFolderFailure, (state, { error }) => ({
		...state,
		error,
	})),
	on(FolderActions.clearError, state => ({
		...state,
		error: null,
	}))
);
