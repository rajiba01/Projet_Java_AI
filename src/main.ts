import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Empêche le bootstrap multiple lors du HMR
if (!(window as any).ngBootstraped) {
  bootstrapApplication(AppComponent, appConfig)
    .catch(err => console.error('Erreur au bootstrap :', err));
  (window as any).ngBootstraped = true;
}
