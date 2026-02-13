import {
	ChangeDetectorRef,
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
import { combineLatest, firstValueFrom, map } from 'rxjs';
import { FileManagerService } from '../../services/file-manager.service';
import { FileActions } from '../../store/actions/file.actions';
import { FolderActions } from '../../store/actions/folder.actions';
import { MoveItemDialogComponent } from '../move-item-dialog/move-item-dialog.component';
import { ItemDialogComponent } from '../item-dialog/item-dialog.component';
import {
	UploadCandidate,
	dataTransferToUploadCandidates,
} from '../../utils/upload-candidates.util';
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

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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
	private readonly cdr = inject(ChangeDetectorRef);
	private readonly destroyRef = inject(DestroyRef);
	private readonly fileService = inject(FileManagerService);
	private allItems: FileItem[] = [];
	private currentParentId: string | null = null;
	private moveTargets: Array<{ id: string | null; label: string }> = [];
	private blockedMoveTargetIds = new Set<string>();
	private dragDepth = 0;
	dialogState: BrnDialogState = 'closed';
	dialogName = '';
	dialogMode: 'create' | 'rename' = 'create';
	dialogTarget: FileItem | null = null;
	moveDialogState: BrnDialogState = 'closed';
	moveDialogTarget: FileItem | null = null;
	moveDialogParentId: string | null = null;
	moveDialogOptions: Array<{ id: string | null; label: string }> = [];
	isDragActive = false;
	manualDropUploading = false;

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

	onDragEnter(event: DragEvent): void {
		event.preventDefault();
		this.dragDepth += 1;
		if (!this.isDragActive) {
			this.isDragActive = true;
			this.cdr.markForCheck();
		}
	}

	onDragOver(event: DragEvent): void {
		event.preventDefault();
		if (!this.isDragActive) {
			this.isDragActive = true;
			this.cdr.markForCheck();
		}
	}

	onDragLeave(event: DragEvent): void {
		event.preventDefault();
		this.dragDepth = Math.max(0, this.dragDepth - 1);
		if (this.dragDepth === 0 && this.isDragActive) {
			this.isDragActive = false;
			this.cdr.markForCheck();
		}
	}

	async onDrop(event: DragEvent): Promise<void> {
		event.preventDefault();
		this.dragDepth = 0;
		this.isDragActive = false;
		this.cdr.markForCheck();

		if (this.manualDropUploading) return;
		const transfer = event.dataTransfer;
		if (!transfer) return;

		const entries = await dataTransferToUploadCandidates(transfer);
		if (entries.length === 0) {
			toast.error('No files were detected in the drop action.');
			return;
		}

		const tooLarge = entries.find(entry => entry.file.size > MAX_SIZE);
		if (tooLarge) {
			toast.error(
				`Upload blocked: "${tooLarge.file.name}" exceeds the 10 MB limit.`
			);
			return;
		}

		const hasFolders = entries.some(
			entry => !!entry.relativePath && entry.relativePath.includes('/')
		);

		if (!hasFolders) {
			this.store.dispatch(
				FileActions.uploadFiles({
					files: entries.map(entry => entry.file),
				})
			);
			return;
		}

		await this.uploadFolderEntries(entries);
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

	private async uploadFolderEntries(
		entries: UploadCandidate[]
	): Promise<void> {
		this.manualDropUploading = true;
		this.cdr.markForCheck();

		try {
			const filesByParent = new Map<string | null, File[]>();
			const folderIdByPath = new Map<string, string | null>([
				['', this.currentParentId],
			]);

			for (const entry of entries) {
				const relativePath = entry.relativePath ?? entry.file.name;
				const pathParts = relativePath.split('/').filter(Boolean);
				if (pathParts.length === 0) continue;

				const fileName = pathParts[pathParts.length - 1];
				const folderParts = pathParts.slice(0, -1);
				let currentPath = '';
				let parentId = this.currentParentId;

				for (const segment of folderParts) {
					currentPath = currentPath
						? `${currentPath}/${segment}`
						: segment;

					if (folderIdByPath.has(currentPath)) {
						parentId = folderIdByPath.get(currentPath) ?? null;
						continue;
					}

					const existingFolderId = this.findExistingFolderId(
						segment,
						parentId
					);

					if (existingFolderId) {
						parentId = existingFolderId;
						folderIdByPath.set(currentPath, parentId);
						continue;
					}

					const created = await firstValueFrom(
						this.fileService.createFolder(segment, parentId)
					);
					parentId = created?.item.id ?? null;
					folderIdByPath.set(currentPath, parentId);
					if (created?.item) {
						this.allItems = [...this.allItems, created.item];
					}
				}

				const renamedFile = new File([entry.file], fileName, {
					type: entry.file.type,
					lastModified: entry.file.lastModified,
				});
				const targetList = filesByParent.get(parentId) ?? [];
				targetList.push(renamedFile);
				filesByParent.set(parentId, targetList);
			}

			for (const [parentId, files] of filesByParent.entries()) {
				await firstValueFrom(
					this.fileService.uploadFiles(files, parentId)
				);
			}

			this.store.dispatch(FileActions.loadItems());
			toast.success(`Uploaded ${entries.length} file(s)`);
		} catch (error) {
			console.error(error);
			toast.error(
				'Upload failed: unable to process one or more dropped folders.'
			);
		} finally {
			this.manualDropUploading = false;
			this.cdr.markForCheck();
		}
	}

	private findExistingFolderId(
		name: string,
		parentId: string | null
	): string | null {
		const match = this.allItems.find(
			item =>
				item.folder && item.parentId === parentId && item.name === name
		);
		return match?.id ?? null;
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
