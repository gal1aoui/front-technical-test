import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { toast } from 'ngx-sonner';
import { FileActions } from '../../store/actions/file.actions';
import { selectFileUploading } from '../../store/selectors/file.selectors';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

@Component({
	selector: 'ic-upload',
	standalone: true,
	imports: [CommonModule, HlmButtonImports],
	templateUrl: './upload.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent {
	private readonly store = inject(Store);

	selectedFiles: File[] = [];
	readonly uploading$: Observable<boolean> =
		this.store.select(selectFileUploading);

	onFilesChange(e: Event): void {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length) {
			const selected = Array.from(input.files);
			const tooLarge = selected.find(f => f.size > MAX_SIZE);
			if (tooLarge) {
				toast.error(`File ${tooLarge.name} exceeds 10MB limit`);
				this.selectedFiles = [];
				return;
			}
			this.selectedFiles = selected;
		}
	}

	upload(input: HTMLInputElement): void {
		if (!this.selectedFiles.length) return;
		this.store.dispatch(
			FileActions.uploadFiles({ files: this.selectedFiles })
		);
		this.selectedFiles = [];
		input.value = '';
	}
}
