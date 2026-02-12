import { createReducer, on } from '@ngrx/store';
import { FileActions } from '../actions/file.actions';
import { initialFileState } from '../states/file.state';

export const fileReducer = createReducer(
	initialFileState,
	on(FileActions.loadItems, state => ({
		...state,
		loading: true,
		error: null,
	})),
	on(FileActions.loadItemsSuccess, (state, { items }) => ({
		...state,
		items,
		loading: false,
		error: null,
	})),
	on(FileActions.loadItemsFailure, (state, { error }) => ({
		...state,
		loading: false,
		error,
	})),
	on(FileActions.uploadFiles, state => ({
		...state,
		uploading: true,
		error: null,
	})),
	on(FileActions.uploadFilesSuccess, state => ({
		...state,
		uploading: false,
		error: null,
	})),
	on(FileActions.uploadFilesFailure, (state, { error }) => ({
		...state,
		uploading: false,
		error,
	})),
	on(FileActions.renameFileFailure, (state, { error }) => ({
		...state,
		error,
	})),
	on(FileActions.moveFileFailure, (state, { error }) => ({
		...state,
		error,
	})),
	on(FileActions.deleteFileFailure, (state, { error }) => ({
		...state,
		error,
	})),
	on(FileActions.clearError, state => ({
		...state,
		error: null,
	}))
);
