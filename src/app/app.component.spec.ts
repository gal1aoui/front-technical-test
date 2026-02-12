import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { AppComponent } from './app.component';
import { FILE_FEATURE_KEY } from './store/states/file.state';
import { FOLDER_FEATURE_KEY } from './store/states/folder.state';
import { fileReducer } from './store/reducers/file.reducer';
import { folderReducer } from './store/reducers/folder.reducer';

describe('AppComponent', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AppComponent],
			providers: [
				provideStore({
					[FILE_FEATURE_KEY]: fileReducer,
					[FOLDER_FEATURE_KEY]: folderReducer,
				}),
			],
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(AppComponent);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it('should render title', () => {
		const fixture = TestBed.createComponent(AppComponent);
		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector('h1')?.textContent).toContain('File Manager');
	});
});
