import { Injectable } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

const oAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  redirectUri: window.location.origin,
  clientId: '796814869937-0qjv66bls0u5nkgstqdjhvl4tojf42hg.apps.googleusercontent.com',
  scope: 'openid profile email'
}

@Injectable({
  providedIn: 'root'
})
export class GoogleApiService {

  constructor(private readonly oAuthService: OAuthService) {
    oAuthService.configure(oAuthConfig)
    oAuthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      if (!oAuthService.hasValidAccessToken()) {
        oAuthService.initLoginFlow();
      } else {
        oAuthService.loadUserProfile().then(profile => {
          console.log(profile);
        });
      }
    });
  }
}
