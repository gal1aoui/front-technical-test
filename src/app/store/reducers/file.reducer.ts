import { createReducer, on } from '@ngrx/store';
import { FileActions } from '../actions/file.actions';
import { initialFileState } from '../states/file.state';

export const fileReducer = createReducer(
	initialFileState,
	on(FileActions.loadRootItems, state => ({
		...state,
		loading: true,
		error: null,
	})),
	on(FileActions.loadRootItemsSuccess, (state, { items }) => ({
		...state,
		items,
		loading: false,
		error: null,
	})),
	on(FileActions.loadRootItemsFailure, (state, { error }) => ({
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
	on(FileActions.deleteFileFailure, (state, { error }) => ({
		...state,
		error,
	})),
	on(FileActions.clearError, state => ({
		...state,
		error: null,
	}))
);
