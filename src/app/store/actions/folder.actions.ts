import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const FolderActions = createActionGroup({
	source: 'Folder',
	events: {
		'Set Current Folder': props<{ parentId: string | null }>(),
		'Create Folder': props<{ name: string; parentId: string | null }>(),
		'Create Folder Success': props<{ name: string }>(),
		'Create Folder Failure': props<{ error: string }>(),
		'Rename Folder': props<{ itemId: string; name: string }>(),
		'Rename Folder Success': props<{ name: string }>(),
		'Rename Folder Failure': props<{ error: string }>(),
		'Move Folder': props<{ itemId: string; parentId: string | null }>(),
		'Move Folder Success': props<{ name: string }>(),
		'Move Folder Failure': props<{ error: string }>(),
		'Delete Folder': props<{ itemId: string; name: string }>(),
		'Delete Folder Success': props<{ name: string }>(),
		'Delete Folder Failure': props<{ error: string }>(),
		'Clear Error': emptyProps(),
	},
});
