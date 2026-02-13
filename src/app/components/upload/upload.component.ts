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
	lucideCloudUpload,
	lucideFile,
	lucideFolder,
	lucideListRestart,
	lucideUpload,
	lucideX,
} from '@ng-icons/lucide';
import { Store } from '@ngrx/store';
import { firstValueFrom, Observable } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { toast } from 'ngx-sonner';
import { FileManagerService } from '../../services/file-manager.service';
import { FileItem } from '../../models/file-item.model';
import { FileActions } from '../../store/actions/file.actions';
import {
	UploadCandidate,
	dataTransferToUploadCandidates,
	filesToUploadCandidates,
} from '../../utils/upload-candidates.util';
import {
	selectAllItems,
	selectFileUploading,
} from '../../store/selectors/file.selectors';
import { selectCurrentParentId } from '../../store/selectors/folder.selectors';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

@Component({
	selector: 'ic-upload',
	standalone: true,
	imports: [CommonModule, HlmButtonImports, HlmEmptyImports, HlmIconImports],
	providers: [
		provideIcons({
			lucideFile,
			lucideFolder,
			lucideListRestart,
			lucideUpload,
			lucideCloudUpload,
			lucideX,
		}),
	],
	templateUrl: './upload.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent implements OnInit {
	private readonly store = inject(Store);
	private readonly cdr = inject(ChangeDetectorRef);
	private readonly destroyRef = inject(DestroyRef);
	private readonly fileService = inject(FileManagerService);
	private allItems: FileItem[] = [];
	private currentParentId: string | null = null;
	private dragDepth = 0;

	queuedEntries: UploadCandidate[] = [];
	recentlyUploaded: string[] = [];
	isDragActive = false;
	manualUploading = false;
	readonly uploading$: Observable<boolean> =
		this.store.select(selectFileUploading);

	ngOnInit(): void {
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
	}

	openUploadPicker(fileInput: HTMLInputElement): void {
		fileInput.click();
	}

	onFilesChange(e: Event): void {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length) {
			this.queueCandidates(
				filesToUploadCandidates(Array.from(input.files))
			);
		}
		input.value = '';
	}

	onFoldersChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		const files = input.files ? Array.from(input.files) : [];

		if (files.length === 0) return;
		this.queueCandidates(filesToUploadCandidates(files, true));
		input.value = '';
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

		const transfer = event.dataTransfer;
		if (!transfer) return;

		const entries = await dataTransferToUploadCandidates(transfer);
		if (entries.length === 0) return;
		this.queueCandidates(entries);
	}

	removeQueued(entryId: string): void {
		this.queuedEntries = this.queuedEntries.filter(
			entry => entry.id !== entryId
		);
		this.cdr.markForCheck();
	}

	clearQueued(): void {
		this.queuedEntries = [];
		this.cdr.markForCheck();
	}

	upload(): void {
		if (this.queuedEntries.length === 0 || this.manualUploading) return;

		const entries = [...this.queuedEntries];
		const hasFolders = entries.some(
			entry => !!entry.relativePath && entry.relativePath.includes('/')
		);

		if (!hasFolders) {
			this.store.dispatch(
				FileActions.uploadFiles({
					files: entries.map(entry => entry.file),
				})
			);
			this.recentlyUploaded = entries.map(entry =>
				this.getDisplayName(entry)
			);
			this.queuedEntries = [];
			this.cdr.markForCheck();
			return;
		}

		void this.uploadFolderEntries(entries);
	}

	formatSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		const sized = bytes / Math.pow(k, i);
		return `${Math.round(sized * 100) / 100} ${sizes[i]}`;
	}

	getDisplayName(entry: UploadCandidate): string {
		return entry.relativePath || entry.file.name;
	}

	private queueCandidates(entries: UploadCandidate[]): void {
		const tooLarge = entries.find(entry => entry.file.size > MAX_SIZE);
		if (tooLarge) {
			toast.error(
				`Upload blocked: "${tooLarge.file.name}" exceeds the 10 MB limit.`
			);
			this.cdr.markForCheck();
			return;
		}

		const unique = new Map(
			this.queuedEntries.map(entry => [entry.id, entry])
		);
		for (const entry of entries) {
			unique.set(entry.id, entry);
		}
		this.queuedEntries = Array.from(unique.values());
		this.cdr.markForCheck();
	}

	private async uploadFolderEntries(
		entries: UploadCandidate[]
	): Promise<void> {
		this.manualUploading = true;
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
			this.recentlyUploaded = entries.map(entry =>
				this.getDisplayName(entry)
			);
			this.queuedEntries = [];
			toast.success(`Uploaded ${entries.length} file(s)`);
			this.cdr.markForCheck();
		} catch (error) {
			console.error(error);
			toast.error(
				'Upload failed: unable to process one or more folders.'
			);
			this.cdr.markForCheck();
		} finally {
			this.manualUploading = false;
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
}
