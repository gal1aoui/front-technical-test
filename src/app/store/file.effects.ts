import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, of } from 'rxjs';
import { catchError, exhaustMap, map, switchMap, tap } from 'rxjs/operators';
import { toast } from 'ngx-sonner';
import { FileManagerService } from '../services/file-manager.service';
import { FileActions } from './file.actions';

function mapApiError(error: unknown): string {
	const httpError = error as HttpErrorResponse;
	const code = httpError?.error?.code;

	if (code === 'FILESIZE_LIMIT_EXCEEDED') {
		return 'File size exceeds 10MB limit';
	}
	if (code === 'DUPLICATE' || code === 'DUPLICATE_FOLDER') {
		return httpError?.error?.desc ?? 'Duplicate name in this location';
	}
	return httpError?.error?.desc ?? 'Unexpected server error';
}

@Injectable()
export class FileEffects {
	private readonly actions$ = inject(Actions);
	private readonly fileService = inject(FileManagerService);

	loadRootItems$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.loadRootItems),
			switchMap(() =>
				this.fileService.getItems().pipe(
					map(response =>
						FileActions.loadRootItemsSuccess({ items: response.items })
					),
					catchError(error =>
						of(FileActions.loadRootItemsFailure({ error: mapApiError(error) }))
					)
				)
			)
		)
	);

	uploadFiles$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.uploadFiles),
			exhaustMap(({ files }) =>
				this.fileService.uploadFiles(files).pipe(
					map(response =>
						FileActions.uploadFilesSuccess({ count: response.items.length })
					),
					catchError(error =>
						of(FileActions.uploadFilesFailure({ error: mapApiError(error) }))
					)
				)
			)
		)
	);

	reloadAfterUpload$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.uploadFilesSuccess),
			map(() => FileActions.loadRootItems())
		)
	);

	deleteFile$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.deleteFile),
			exhaustMap(({ itemId, name }) =>
				this.fileService.delete(itemId).pipe(
					map(() => FileActions.deleteFileSuccess({ name })),
					catchError(error =>
						of(FileActions.deleteFileFailure({ error: mapApiError(error) }))
					)
				)
			)
		)
	);

	reloadAfterDelete$ = createEffect(() =>
		this.actions$.pipe(
			ofType(FileActions.deleteFileSuccess),
			map(() => FileActions.loadRootItems())
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
				ofType(FileActions.loadRootItemsFailure),
				tap(({ error }) => toast.error(error))
			),
		{ dispatch: false }
	);

	deleteSuccessToast$ = createEffect(
		() =>
			this.actions$.pipe(
				ofType(FileActions.deleteFileSuccess),
				tap(({ name }) => toast.success(`Deleted ${name}`))
			),
		{ dispatch: false }
	);

	deleteFailureToast$ = createEffect(
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
