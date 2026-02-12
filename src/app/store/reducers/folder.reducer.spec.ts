import { folderReducer } from './folder.reducer';
import { initialFolderState } from '../states/folder.state';
import { FolderActions } from '../actions/folder.actions';
import { FileActions } from '../actions/file.actions';

describe('folderReducer', () => {
	it('updates current folder on setCurrentFolder', () => {
		const state = folderReducer(
			initialFolderState,
			FolderActions.setCurrentFolder({ parentId: 'folder-1' })
		);
		expect(state.currentParentId).toBe('folder-1');
	});

	it('falls back to root when current folder no longer exists', () => {
		const state = folderReducer(
			{ ...initialFolderState, currentParentId: 'missing-folder' },
			FileActions.loadItemsSuccess({ items: [] })
		);
		expect(state.currentParentId).toBeNull();
	});
});
