import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom, 
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { AppAuthModule } from './app-auth.module';
import { WebSocketService } from './services/web-socket.service';
import { initClient } from '../../../gamelogic/netcode/client';
import { ReactiveFormsModule } from '@angular/forms';


export function initializeAppFactory(): () => void {
  const wss = inject(WebSocketService); 
  return () => initClient(wss);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(AppAuthModule),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      multi: true
    }
  ],
};