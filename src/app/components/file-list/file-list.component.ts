import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	OnInit,
	inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import {
	lucideArrowRightLeft,
	lucideArrowUp,
	lucideChevronRight,
	lucideDownload,
	lucideFile,
	lucideFolder,
	lucideFolderPlus,
	lucideHouse,
	lucidePencil,
	lucideRefreshCcw,
	lucideTrash2,
} from '@ng-icons/lucide';
import { Store } from '@ngrx/store';
import { BrnDialogState } from '@spartan-ng/brain/dialog';
import {
	buildItemPath,
	FileItem,
	FileItemDetails,
	getFileExtension,
} from '../../models/file-item.model';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { toast } from 'ngx-sonner';
import { combineLatest, map } from 'rxjs';
import { FileActions } from '../../store/actions/file.actions';
import { FolderActions } from '../../store/actions/folder.actions';
import { MoveItemDialogComponent } from '../move-item-dialog/move-item-dialog.component';
import { ItemDialogComponent } from '../item-dialog/item-dialog.component';
import {
	selectAllItems,
	selectFileError,
	selectFileLoading,
} from '../../store/selectors/file.selectors';
import {
	selectBreadcrumbs,
	selectCurrentFolder,
	selectCurrentItems,
	selectCurrentParentId,
	selectFolderError,
	selectFolderMoveTargets,
} from '../../store/selectors/folder.selectors';

@Component({
	selector: 'ic-file-list',
	standalone: true,
	imports: [
		CommonModule,
		HlmButtonImports,
		HlmContextMenuImports,
		HlmDropdownMenuImports,
		HlmEmptyImports,
		HlmIconImports,
		ItemDialogComponent,
		MoveItemDialogComponent,
	],
	providers: [
		provideIcons({
			lucideArrowRightLeft,
			lucideArrowUp,
			lucideChevronRight,
			lucideDownload,
			lucideFile,
			lucideFolder,
			lucideFolderPlus,
			lucideHouse,
			lucidePencil,
			lucideRefreshCcw,
			lucideTrash2,
		}),
	],
	templateUrl: './file-list.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileListComponent implements OnInit {
	private readonly store = inject(Store);
	private readonly destroyRef = inject(DestroyRef);
	private allItems: FileItem[] = [];
	private currentParentId: string | null = null;
	private moveTargets: Array<{ id: string | null; label: string }> = [];
	private blockedMoveTargetIds = new Set<string>();
	dialogState: BrnDialogState = 'closed';
	dialogName = '';
	dialogMode: 'create' | 'rename' = 'create';
	dialogTarget: FileItem | null = null;
	moveDialogState: BrnDialogState = 'closed';
	moveDialogTarget: FileItem | null = null;
	moveDialogParentId: string | null = null;
	moveDialogOptions: Array<{ id: string | null; label: string }> = [];

	readonly items$ = this.store.select(selectCurrentItems);
	readonly breadcrumbs$ = this.store.select(selectBreadcrumbs);
	readonly currentFolder$ = this.store.select(selectCurrentFolder);
	readonly loading$ = this.store.select(selectFileLoading);
	readonly error$ = combineLatest([
		this.store.select(selectFileError),
		this.store.select(selectFolderError),
	]).pipe(map(([fileError, folderError]) => fileError ?? folderError));

	ngOnInit(): void {
		this.store.dispatch(FileActions.loadItems());
		this.store
			.select(selectAllItems)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(items => {
				this.allItems = items;
			});
		this.store
			.select(selectCurrentParentId)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(parentId => {
				this.currentParentId = parentId;
			});
		this.store
			.select(selectFolderMoveTargets)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(targets => {
				this.moveTargets = targets;
			});
	}

	refresh(): void {
		this.store.dispatch(FileActions.loadItems());
	}

	goToRoot(): void {
		this.store.dispatch(FolderActions.setCurrentFolder({ parentId: null }));
	}

	goToFolder(folderId: string): void {
		this.store.dispatch(
			FolderActions.setCurrentFolder({ parentId: folderId })
		);
	}

	goUp(currentFolder: FileItem | null): void {
		const parentId = currentFolder?.parentId ?? null;
		this.store.dispatch(FolderActions.setCurrentFolder({ parentId }));
	}

	openFolder(item: FileItem): void {
		if (!item.folder) return;
		this.store.dispatch(
			FolderActions.setCurrentFolder({ parentId: item.id })
		);
	}

	createFolder(): void {
		this.openItemDialog();
	}

	rename(item: FileItem): void {
		this.openItemDialog(item);
	}

	move(item: FileItem): void {
		this.openMoveDialog(item);
	}

	download(item: FileItem): void {
		if (item.folder) return;
		this.store.dispatch(
			FileActions.downloadFile({ itemId: item.id, name: item.name })
		);
	}

	delete(item: FileItem): void {
		toast.info(`Deleting "${item.name}"...`);
		if (item.folder) {
			this.store.dispatch(
				FolderActions.deleteFolder({ itemId: item.id, name: item.name })
			);
			return;
		}
		this.store.dispatch(
			FileActions.deleteFile({ itemId: item.id, name: item.name })
		);
	}

	onRowContextMenu(event: MouseEvent): void {
		event.stopPropagation();
	}

	formatSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		const sized = bytes / Math.pow(k, i);
		return `${Math.round(sized * 100) / 100} ${sizes[i]}`;
	}

	openItemDialog(item?: FileItem): void {
		this.dialogMode = item ? 'rename' : 'create';
		this.dialogTarget = item ?? null;
		this.dialogName = item?.name ?? '';
		this.dialogState = 'open';
	}

	closeItemDialog(): void {
		this.dialogState = 'closed';
	}

	onDialogStateChanged(state: BrnDialogState): void {
		this.dialogState = state;
		if (state === 'closed') {
			this.dialogMode = 'create';
			this.dialogTarget = null;
			this.dialogName = '';
		}
	}

	submitItemDialog(): void {
		const name = this.dialogName.trim();
		if (!name) {
			toast.error('Name is required');
			return;
		}

		if (this.dialogMode === 'create') {
			this.store.dispatch(
				FolderActions.createFolder({
					name,
					parentId: this.currentParentId,
				})
			);
			this.closeItemDialog();
			return;
		}

		if (!this.dialogTarget || name === this.dialogTarget.name) {
			this.closeItemDialog();
			return;
		}

		if (this.dialogTarget.folder) {
			this.store.dispatch(
				FolderActions.renameFolder({
					itemId: this.dialogTarget.id,
					name,
				})
			);
		} else {
			this.store.dispatch(
				FileActions.renameFile({ itemId: this.dialogTarget.id, name })
			);
		}
		this.closeItemDialog();
	}

	openMoveDialog(item: FileItem): void {
		const descendantIds = item.folder
			? this.getDescendantFolderIds(item.id)
			: new Set<string>();

		this.blockedMoveTargetIds = new Set<string>([
			item.id,
			...descendantIds,
		]);
		this.moveDialogTarget = item;
		this.moveDialogParentId = item.parentId ?? null;
		this.moveDialogOptions = this.moveTargets.filter(
			target =>
				target.id === null || !this.blockedMoveTargetIds.has(target.id)
		);
		this.moveDialogState = 'open';
	}

	closeMoveDialog(): void {
		this.moveDialogState = 'closed';
	}

	onMoveDialogStateChanged(state: BrnDialogState): void {
		this.moveDialogState = state;
		if (state === 'closed') {
			this.moveDialogTarget = null;
			this.moveDialogParentId = null;
			this.moveDialogOptions = [];
			this.blockedMoveTargetIds.clear();
		}
	}

	submitMoveDialog(): void {
		if (!this.moveDialogTarget) {
			this.closeMoveDialog();
			return;
		}

		const targetId = this.moveDialogParentId;
		if (targetId === this.moveDialogTarget.parentId) {
			this.closeMoveDialog();
			return;
		}
		if (targetId && this.blockedMoveTargetIds.has(targetId)) {
			toast.error(
				'Cannot move a folder into itself or one of its children'
			);
			return;
		}

		if (this.moveDialogTarget.folder) {
			this.store.dispatch(
				FolderActions.moveFolder({
					itemId: this.moveDialogTarget.id,
					parentId: targetId,
				})
			);
		} else {
			this.store.dispatch(
				FileActions.moveFile({
					itemId: this.moveDialogTarget.id,
					parentId: targetId,
				})
			);
		}
		this.closeMoveDialog();
	}

	getItemDetails(item: FileItem | null): FileItemDetails | null {
		if (!item) return null;
		return {
			fileName: item.name,
			fileExtension: item.folder ? '-' : getFileExtension(item.name),
			creationDate: new Date(item.creation).toLocaleString(),
			path: buildItemPath(item, this.allItems),
			size: item.folder ? '-' : this.formatSize(item.size || 0),
		};
	}

	private getDescendantFolderIds(folderId: string): Set<string> {
		const descendants = new Set<string>();
		const queue: string[] = [folderId];

		while (queue.length > 0) {
			const currentId = queue.shift();
			if (!currentId) continue;
			const children = this.allItems.filter(
				item => item.folder && item.parentId === currentId
			);
			for (const child of children) {
				if (descendants.has(child.id)) continue;
				descendants.add(child.id);
				queue.push(child.id);
			}
		}

		return descendants;
	}
}
