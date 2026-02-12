import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { FILE_FEATURE_KEY } from './store/states/file.state';
import { fileReducer } from './store/reducers/file.reducer';
import { FileEffects } from './store/effects/file.effects';

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideHttpClient(),
		provideStore({ [FILE_FEATURE_KEY]: fileReducer }),
		provideEffects([FileEffects]),
		provideStoreDevtools({ maxAge: 25, logOnly: false }),
	],
};
