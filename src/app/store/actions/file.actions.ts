import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { FileItem } from '../../models/file-item.model';

export const FileActions = createActionGroup({
	source: 'File',
	events: {
		'Load Items': emptyProps(),
		'Load Items Success': props<{ items: FileItem[] }>(),
		'Load Items Failure': props<{ error: string }>(),
		'Upload Files': props<{ files: File[] }>(),
		'Upload Files Success': props<{ count: number }>(),
		'Upload Files Failure': props<{ error: string }>(),
		'Download File': props<{ itemId: string; name: string }>(),
		'Rename File': props<{ itemId: string; name: string }>(),
		'Rename File Success': props<{ name: string }>(),
		'Rename File Failure': props<{ error: string }>(),
		'Move File': props<{ itemId: string; parentId: string | null }>(),
		'Move File Success': props<{ name: string }>(),
		'Move File Failure': props<{ error: string }>(),
		'Delete File': props<{ itemId: string; name: string }>(),
		'Delete File Success': props<{ name: string }>(),
		'Delete File Failure': props<{ error: string }>(),
		'Clear Error': emptyProps(),
	},
});
