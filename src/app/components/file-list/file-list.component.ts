import {
	ChangeDetectionStrategy,
	Component,
	OnInit,
	inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { provideIcons } from '@ng-icons/core';
import {
	lucideDownload,
	lucideFile,
	lucideFolder,
	lucideRefreshCcw,
	lucideTrash2,
	lucideUpload,
} from '@ng-icons/lucide';
import { Store } from '@ngrx/store';
import { FileItem } from '../../models/file-item.model';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { toast } from 'ngx-sonner';
import { FileActions } from '../../store/actions/file.actions';
import {
	selectFileError,
	selectFileLoading,
	selectRootItems,
} from '../../store/selectors/file.selectors';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

@Component({
	selector: 'ic-file-list',
	standalone: true,
	imports: [
		CommonModule,
		ScrollingModule,
		HlmButtonImports,
		HlmContextMenuImports,
		HlmDropdownMenuImports,
		HlmIconImports,
	],
	providers: [
		provideIcons({
			lucideDownload,
			lucideFile,
			lucideFolder,
			lucideRefreshCcw,
			lucideTrash2,
			lucideUpload,
		}),
	],
	templateUrl: './file-list.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileListComponent implements OnInit {
	private readonly store = inject(Store);

	readonly items$ = this.store.select(selectRootItems);
	readonly loading$ = this.store.select(selectFileLoading);
	readonly error$ = this.store.select(selectFileError);
	readonly columnTemplate = 'minmax(260px, 3fr) 110px 130px 150px';

	ngOnInit(): void {
		this.store.dispatch(FileActions.loadRootItems());
	}

	refresh(): void {
		this.store.dispatch(FileActions.loadRootItems());
	}

	download(item: FileItem): void {
		if (item.folder) return;
		this.store.dispatch(
			FileActions.downloadFile({ itemId: item.id, name: item.name })
		);
	}

	delete(item: FileItem): void {
		if (item.folder) return;
		this.store.dispatch(
			FileActions.deleteFile({ itemId: item.id, name: item.name })
		);
	}

	openUploadPicker(fileInput: HTMLInputElement): void {
		fileInput.click();
	}

	onFilesPicked(event: Event, fileInput: HTMLInputElement): void {
		const input = event.target as HTMLInputElement;
		const files = input.files ? Array.from(input.files) : [];

		if (files.length === 0) return;

		const tooLarge = files.find(file => file.size > MAX_SIZE);
		if (tooLarge) {
			toast.error(`File ${tooLarge.name} exceeds 10MB limit`);
			fileInput.value = '';
			return;
		}

		this.store.dispatch(FileActions.uploadFiles({ files }));
		fileInput.value = '';
	}

	onRowContextMenu(event: MouseEvent): void {
		event.stopPropagation();
	}

	trackById(_i: number, item: FileItem): string {
		return item.id;
	}

	formatSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		const sized = bytes / Math.pow(k, i);
		return `${Math.round(sized * 100) / 100} ${sizes[i]}`;
	}
}
