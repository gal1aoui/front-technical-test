import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FileItem } from '../../models/file-item.model';
import { selectAllItems } from './file.selectors';
import { FOLDER_FEATURE_KEY, FolderState } from '../states/folder.state';

export const selectFolderState =
	createFeatureSelector<FolderState>(FOLDER_FEATURE_KEY);

export const selectCurrentParentId = createSelector(
	selectFolderState,
	state => state.currentParentId
);

export const selectFolderError = createSelector(
	selectFolderState,
	state => state.error
);

export const selectCurrentItems = createSelector(
	selectAllItems,
	selectCurrentParentId,
	(items, currentParentId) =>
		items
			.filter(item => item.parentId === currentParentId)
			.sort((a, b) => {
				if (a.folder !== b.folder) return a.folder ? -1 : 1;
				return a.name.localeCompare(b.name);
			})
);

export const selectCurrentFolder = createSelector(
	selectAllItems,
	selectCurrentParentId,
	(items, currentParentId) =>
		currentParentId
			? (items.find(item => item.id === currentParentId) ?? null)
			: null
);

export const selectBreadcrumbs = createSelector(
	selectAllItems,
	selectCurrentParentId,
	(items, currentParentId) => {
		if (!currentParentId) return [] as FileItem[];

		const byId = new Map(items.map(item => [item.id, item]));
		const path: FileItem[] = [];
		let currentId: string | null = currentParentId;
		const seen = new Set<string>();

		while (currentId && !seen.has(currentId)) {
			seen.add(currentId);
			const current = byId.get(currentId);
			if (!current) break;
			path.unshift(current);
			currentId = current.parentId;
		}

		return path;
	}
);

export const selectFolderMoveTargets = createSelector(selectAllItems, items => {
	const folderItems = items.filter(item => item.folder);
	const childrenByParent = new Map<string | null, FileItem[]>();

	for (const folder of folderItems) {
		const key = folder.parentId;
		const current = childrenByParent.get(key) ?? [];
		current.push(folder);
		childrenByParent.set(key, current);
	}

	for (const siblings of childrenByParent.values()) {
		siblings.sort((a, b) => a.name.localeCompare(b.name));
	}

	const result: Array<{ id: string | null; label: string }> = [
		{ id: null, label: 'Root' },
	];

	const visit = (parentId: string | null, depth: number): void => {
		const children = childrenByParent.get(parentId) ?? [];
		for (const folder of children) {
			const prefix = depth > 0 ? `${'— '.repeat(depth)}` : '';
			result.push({
				id: folder.id,
				label: `${prefix}${folder.name}`,
			});
			visit(folder.id, depth + 1);
		}
	};

	visit(null, 0);
	return result;
});
