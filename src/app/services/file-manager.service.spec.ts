import { TestBed } from '@angular/core/testing';
import {
	HttpTestingController,
	provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FileManagerService } from './file-manager.service';
import { FileItem } from '../models/file-item.model';

describe('FileManagerService', () => {
	let service: FileManagerService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()],
		});

		service = TestBed.inject(FileManagerService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('loads root items', () => {
		const items: FileItem[] = [
			{
				id: '1',
				parentId: null,
				name: 'a.txt',
				folder: false,
				creation: '2026-01-01T00:00:00.000Z',
				modification: '2026-01-01T00:00:00.000Z',
				size: 12,
			},
		];

		service.getItems().subscribe(response => {
			expect(response.items).toEqual(items);
		});

		const req = httpMock.expectOne('/api/items');
		expect(req.request.method).toBe('GET');
		req.flush({ items });
	});

	it('uploads files with multipart/form-data', () => {
		const file = new File(['content'], 'a.txt', { type: 'text/plain' });

		service.uploadFiles([file]).subscribe();

		const req = httpMock.expectOne('/api/items');
		expect(req.request.method).toBe('POST');
		expect(req.request.body instanceof FormData).toBeTrue();

		const files = (req.request.body as FormData).getAll('files') as File[];
		expect(files.length).toBe(1);
		expect(files[0].name).toBe('a.txt');

		req.flush({ items: [] });
	});

	it('downloads file as blob', () => {
		service.download('42').subscribe();

		const req = httpMock.expectOne('/api/items/42');
		expect(req.request.method).toBe('GET');
		expect(req.request.responseType).toBe('blob');
		req.flush(new Blob(['x']));
	});

	it('loads child items for a folder', () => {
		service.getItems('folder-1').subscribe();
		const req = httpMock.expectOne('/api/items?parentId=folder-1');
		expect(req.request.method).toBe('GET');
		req.flush({ items: [] });
	});

	it('creates folder with parent id', () => {
		service.createFolder('Docs', 'folder-1').subscribe();
		const req = httpMock.expectOne('/api/items');
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toEqual({
			name: 'Docs',
			folder: true,
			parentId: 'folder-1',
		});
		req.flush({ item: {} });
	});

	it('renames an item', () => {
		service.renameItem('42', 'new-name.txt').subscribe();
		const req = httpMock.expectOne('/api/items/42');
		expect(req.request.method).toBe('PATCH');
		expect(req.request.body).toEqual({ name: 'new-name.txt' });
		req.flush({});
	});

	it('moves an item', () => {
		service.moveItem('42', 'folder-2').subscribe();
		const req = httpMock.expectOne('/api/items/42');
		expect(req.request.method).toBe('PATCH');
		expect(req.request.body).toEqual({ parentId: 'folder-2' });
		req.flush({});
	});
});
