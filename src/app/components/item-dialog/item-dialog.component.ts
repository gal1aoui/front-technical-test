import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrnDialogContent, BrnDialogState } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { FileItem, FileItemDetails } from '../../models/file-item.model';

@Component({
	selector: 'ic-item-dialog',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		BrnDialogContent,
		HlmButtonImports,
		HlmDialogImports,
	],
	templateUrl: './item-dialog.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDialogComponent {
	@Input() state: BrnDialogState = 'closed';
	@Input() mode: 'create' | 'rename' = 'create';
	@Input() target: FileItem | null = null;
	@Input() details: FileItemDetails | null = null;
	@Input() name = '';

	@Output() readonly stateChange = new EventEmitter<BrnDialogState>();
	@Output() readonly nameChange = new EventEmitter<string>();
	@Output() readonly submitted = new EventEmitter<void>();
	@Output() readonly cancelled = new EventEmitter<void>();

	onStateChanged(state: BrnDialogState): void {
		this.stateChange.emit(state);
	}

	onNameChange(name: string): void {
		this.nameChange.emit(name);
	}

	onSubmit(): void {
		this.submitted.emit();
	}

	onCancel(): void {
		this.cancelled.emit();
	}
}
