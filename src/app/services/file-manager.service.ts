import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileItem } from '../models/file-item.model';

@Injectable({ providedIn: 'root' })
export class FileManagerService {
	private readonly http = inject(HttpClient);
	private base = '/api';

	getItems(parentId?: string | null): Observable<{ items: FileItem[] }> {
		let params = new HttpParams();
		if (parentId) params = params.set('parentId', parentId);
		return this.http.get<{ items: FileItem[] }>(`${this.base}/items`, {
			params,
		});
	}

	uploadFiles(
		files: File[],
		parentId?: string | null
	): Observable<{ items: FileItem[] }> {
		const fd = new FormData();
		files.forEach(f => fd.append('files', f));
		if (parentId) fd.append('parentId', parentId);
		return this.http.post<{ items: FileItem[] }>(`${this.base}/items`, fd);
	}

	download(itemId: string): Observable<Blob> {
		return this.http.get(`${this.base}/items/${itemId}`, {
			responseType: 'blob',
		});
	}

	delete(itemId: string): Observable<void> {
		return this.http.delete<void>(`${this.base}/items/${itemId}`);
	}
}
