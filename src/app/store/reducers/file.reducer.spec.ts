import { fileReducer } from './file.reducer';
import { initialFileState } from '../states/file.state';
import { FileActions } from '../actions/file.actions';

describe('fileReducer', () => {
	it('sets loading=true on loadItems', () => {
		const state = fileReducer(initialFileState, FileActions.loadItems());
		expect(state.loading).toBeTrue();
		expect(state.error).toBeNull();
	});

	it('stores items on loadItemsSuccess', () => {
		const items = [
			{
				id: '1',
				parentId: null,
				name: 'doc.pdf',
				folder: false,
				creation: '2026-01-01T00:00:00.000Z',
				modification: '2026-01-01T00:00:00.000Z',
				size: 1000,
			},
		];

		const state = fileReducer(
			{ ...initialFileState, loading: true },
			FileActions.loadItemsSuccess({ items })
		);

		expect(state.loading).toBeFalse();
		expect(state.items).toEqual(items);
	});

	it('sets uploading=true on uploadFiles', () => {
		const file = new File(['x'], 'x.txt', { type: 'text/plain' });
		const state = fileReducer(
			initialFileState,
			FileActions.uploadFiles({ files: [file] })
		);

		expect(state.uploading).toBeTrue();
		expect(state.error).toBeNull();
	});

	it('stores error on uploadFilesFailure', () => {
		const state = fileReducer(
			{ ...initialFileState, uploading: true },
			FileActions.uploadFilesFailure({ error: 'Upload failed' })
		);
		expect(state.uploading).toBeFalse();
		expect(state.error).toBe('Upload failed');
	});
});
