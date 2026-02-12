import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { FileItem } from '../../models/file-item.model';

export const FileActions = createActionGroup({
	source: 'File',
	events: {
		'Load Root Items': emptyProps(),
		'Load Root Items Success': props<{ items: FileItem[] }>(),
		'Load Root Items Failure': props<{ error: string }>(),
		'Upload Files': props<{ files: File[] }>(),
		'Upload Files Success': props<{ count: number }>(),
		'Upload Files Failure': props<{ error: string }>(),
		'Download File': props<{ itemId: string; name: string }>(),
		'Delete File': props<{ itemId: string; name: string }>(),
		'Delete File Success': props<{ name: string }>(),
		'Delete File Failure': props<{ error: string }>(),
		'Clear Error': emptyProps(),
	},
});
