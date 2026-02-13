import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrnDialogContent, BrnDialogState } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { FileItem, FileItemDetails } from '../../models/file-item.model';

@Component({
	selector: 'ic-move-item-dialog',
	standalone: true,
	imports: [
		CommonModule,
		BrnDialogContent,
		HlmButtonImports,
		HlmDialogImports,
	],
	templateUrl: './move-item-dialog.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveItemDialogComponent {
	@Input() state: BrnDialogState = 'closed';
	@Input() target: FileItem | null = null;
	@Input() details: FileItemDetails | null = null;
	@Input() selectedParentId: string | null = null;
	@Input() options: Array<{ id: string | null; label: string }> = [];

	@Output() readonly stateChange = new EventEmitter<BrnDialogState>();
	@Output() readonly selectedParentIdChange = new EventEmitter<
		string | null
	>();
	@Output() readonly submitted = new EventEmitter<void>();
	@Output() readonly cancelled = new EventEmitter<void>();

	onStateChanged(state: BrnDialogState): void {
		this.stateChange.emit(state);
	}

	selectDestination(parentId: string | null): void {
		this.selectedParentIdChange.emit(parentId);
	}

	onSubmit(): void {
		this.submitted.emit();
	}

	onCancel(): void {
		this.cancelled.emit();
	}
}
