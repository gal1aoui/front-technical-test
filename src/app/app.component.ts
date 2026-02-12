import { Component } from '@angular/core';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { FileListComponent } from './components/file-list/file-list.component';
import { UploadComponent } from './components/upload/upload.component';

@Component({
	selector: 'ic-root',
	standalone: true,
	imports: [FileListComponent, UploadComponent, HlmToasterImports],
	templateUrl: './app.component.html',
})
export class AppComponent {}
