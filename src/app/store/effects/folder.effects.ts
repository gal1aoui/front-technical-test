import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, tap } from 'rxjs/operators';
import { toast } from 'ngx-sonner';
import { FileManagerService } from '../../services/file-manager.service';
import { FolderActions } from '../actions/folder.actions';
import { FileActions } from '../actions/file.actions';

function mapApiError(error: unknown): string {
	const httpError = error as HttpErrorResponse;
	const code = httpError?.error?.code;

	if (code === 'DUPLICATE' || code === 'DUPLICATE_FOLDER') {
		return httpError?.error?.desc ?? 'Duplicate name in this location';
	}
	if (code === 'DUPLICATE_NAME') {
		return 'An item with this name already exists in this location';
	}
	if (code === 'FOLDER_NOT_EMPTY') {
		return 'Cannot delete folder that contains items';
	}
	if (code === 'INVALID_PARENT') {
		return 'Invalid parent folder';
	}
	return httpError?.error?.desc ?? 'Unexpected server error';
}

@Injectable()
export class FolderEffects {
	private readonly actions$ = inject(Actions);
	private readonly fileService = inject(FileManagerService);

	createFolder$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FolderActions.createFolder),
			exhaustMap(({ name, parentId }) =>
				this.fileService.createFolder(name, parentId).pipe(
					map(() => FolderActions.createFolderSuccess({ name })),
					catchError(error =>
						of(FolderActions.createFolderFailure({ error: mapApiError(error) }))
					)
				)
			)
		)
	);

	renameFolder$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FolderActions.renameFolder),
			exhaustMap(({ itemId, name }) =>
				this.fileService.renameItem(itemId, name).pipe(
					map(() => FolderActions.renameFolderSuccess({ name })),
					catchError(error =>
						of(FolderActions.renameFolderFailure({ error: mapApiError(error) }))
					)
				)
			)
		)
	);

	moveFolder$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FolderActions.moveFolder),
			exhaustMap(({ itemId, parentId }) =>
				this.fileService.moveItem(itemId, parentId).pipe(
					map(item => FolderActions.moveFolderSuccess({ name: item.name })),
					catchError(error =>
						of(FolderActions.moveFolderFailure({ error: mapApiError(error) }))
					)
				)
			)
		)
	);

	deleteFolder$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FolderActions.deleteFolder),
			exhaustMap(({ itemId, name }) =>
				this.fileService.delete(itemId).pipe(
					map(() => FolderActions.deleteFolderSuccess({ name })),
					catchError(error =>
						of(FolderActions.deleteFolderFailure({ error: mapApiError(error) }))
					)
				)
			)
		)
	);

	reloadAfterMutations$ = createEffect(() =>
		this.actions$.pipe(
			ofType(
				FolderActions.createFolderSuccess,
				FolderActions.renameFolderSuccess,
				FolderActions.moveFolderSuccess,
				FolderActions.deleteFolderSuccess
			),
			map(() => FileActions.loadItems())
		)
	);

	createFolderSuccessToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FolderActions.createFolderSuccess),
				tap(({ name }) => toast.success(`Created folder ${name}`))
			),
		{ dispatch: false }
	);

	createFolderFailureToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FolderActions.createFolderFailure),
				tap(({ error }) => toast.error(error))
			),
		{ dispatch: false }
	);

	renameFolderSuccessToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FolderActions.renameFolderSuccess),
				tap(({ name }) => toast.success(`Renamed to ${name}`))
			),
		{ dispatch: false }
	);

	renameFolderFailureToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FolderActions.renameFolderFailure),
				tap(({ error }) => toast.error(error))
			),
		{ dispatch: false }
	);

	moveFolderSuccessToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FolderActions.moveFolderSuccess),
				tap(({ name }) => toast.success(`Moved ${name}`))
			),
		{ dispatch: false }
	);

	moveFolderFailureToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FolderActions.moveFolderFailure),
				tap(({ error }) => toast.error(error))
			),
		{ dispatch: false }
	);

	deleteFolderSuccessToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FolderActions.deleteFolderSuccess),
				tap(({ name }) => toast.success(`Deleted ${name}`))
			),
		{ dispatch: false }
	);

	deleteFolderFailureToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FolderActions.deleteFolderFailure),
				tap(({ error }) => toast.error(error))
			),
		{ dispatch: false }
	);
}
