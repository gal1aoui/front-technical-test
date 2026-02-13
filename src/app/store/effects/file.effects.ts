import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, of } from 'rxjs';
import {
	catchError,
	exhaustMap,
	map,
	switchMap,
	tap,
	withLatestFrom,
} from 'rxjs/operators';
import { toast } from 'ngx-sonner';
import { FileManagerService } from '../../services/file-manager.service';
import { FileActions } from '../actions/file.actions';
import { selectCurrentParentId } from '../selectors/folder.selectors';

function mapApiError(error: unknown): string {
	const httpError = error as HttpErrorResponse;
	const code = httpError?.error?.code;

	if (code === 'FILESIZE_LIMIT_EXCEEDED') {
		return 'File size exceeds 10MB limit';
	}
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
export class FileEffects {
	private readonly actions$ = inject(Actions);
	private readonly fileService = inject(FileManagerService);
	private readonly store = inject(Store);

	loadItems$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.loadItems),
			switchMap(() =>
				this.fileService.getItems().pipe(
					map(response =>
						FileActions.loadItemsSuccess({ items: response.items })
					),
					catchError(error =>
						of(
							FileActions.loadItemsFailure({
								error: mapApiError(error),
							})
						)
					)
				)
			)
		)
	);

	uploadFiles$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.uploadFiles),
			withLatestFrom(this.store.select(selectCurrentParentId)),
			exhaustMap(([{ files }, parentId]) =>
				this.fileService.uploadFiles(files, parentId).pipe(
					map(response =>
						FileActions.uploadFilesSuccess({
							count: response.items.length,
						})
					),
					catchError(error =>
						of(
							FileActions.uploadFilesFailure({
								error: mapApiError(error),
							})
						)
					)
				)
			)
		)
	);

	renameFile$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.renameFile),
			exhaustMap(({ itemId, name }) =>
				this.fileService.renameItem(itemId, name).pipe(
					map(() => FileActions.renameFileSuccess({ name })),
					catchError(error =>
						of(
							FileActions.renameFileFailure({
								error: mapApiError(error),
							})
						)
					)
				)
			)
		)
	);

	moveFile$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.moveFile),
			exhaustMap(({ itemId, parentId }) =>
				this.fileService.moveItem(itemId, parentId).pipe(
					map(item =>
						FileActions.moveFileSuccess({ name: item.name })
					),
					catchError(error =>
						of(
							FileActions.moveFileFailure({
								error: mapApiError(error),
							})
						)
					)
				)
			)
		)
	);

	deleteFile$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.deleteFile),
			exhaustMap(({ itemId, name }) =>
				this.fileService.delete(itemId).pipe(
					map(() => FileActions.deleteFileSuccess({ name })),
					catchError(error =>
						of(
							FileActions.deleteFileFailure({
								error: mapApiError(error),
							})
						)
					)
				)
			)
		)
	);

	reloadAfterUpload$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.uploadFilesSuccess),
			map(() => FileActions.loadItems())
		)
	);

	reloadAfterMutations$ = createEffect(() =>
		this.actions$.pipe(
			ofType(
				FileActions.renameFileSuccess,
				FileActions.moveFileSuccess,
				FileActions.deleteFileSuccess
			),
			map(() => FileActions.loadItems())
		)
	);

	downloadFile$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.downloadFile),
				switchMap(({ itemId, name }) =>
					this.fileService.download(itemId).pipe(
						tap(blob => this.saveBlob(blob, name)),
						tap(() => toast.success(`Downloaded ${name}`)),
						catchError(() => {
							toast.error('Download failed');
							return EMPTY;
						})
					)
				)
			),
		{ dispatch: false }
	);

	uploadSuccessToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.uploadFilesSuccess),
				tap(({ count }) => toast.success(`Uploaded ${count} file(s)`))
			),
		{ dispatch: false }
	);

	uploadFailureToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.uploadFilesFailure),
				tap(({ error }) => toast.error(error))
			),
		{ dispatch: false }
	);

	loadFailureToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.loadItemsFailure),
				tap(({ error }) => toast.error(error))
			),
		{ dispatch: false }
	);

	renameFileSuccessToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.renameFileSuccess),
				tap(({ name }) => toast.success(`Renamed to ${name}`))
			),
		{ dispatch: false }
	);

	renameFileFailureToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.renameFileFailure),
				tap(({ error }) => toast.error(error))
			),
		{ dispatch: false }
	);

	moveFileSuccessToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.moveFileSuccess),
				tap(({ name }) => toast.success(`Moved ${name}`))
			),
		{ dispatch: false }
	);

	moveFileFailureToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.moveFileFailure),
				tap(({ error }) => toast.error(error))
			),
		{ dispatch: false }
	);

	deleteFileSuccessToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.deleteFileSuccess),
				tap(({ name }) => toast.success(`Deleted ${name}`))
			),
		{ dispatch: false }
	);

	deleteFileFailureToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.deleteFileFailure),
				tap(({ error }) => toast.error(error))
			),
		{ dispatch: false }
	);

	private saveBlob(blob: Blob, fileName: string): void {
		const url = window.URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		window.URL.revokeObjectURL(url);
	}
}
