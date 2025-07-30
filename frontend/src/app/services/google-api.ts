import { Injectable } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

const oAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  redirectUri: window.location.origin + '/google-login',
  clientId: '796814869937-0qjv66bls0u5nkgstqdjhvl4tojf42hg.apps.googleusercontent.com',
  silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',
  useSilentRefresh: true,
  scope: 'openid profile email',
}

@Injectable({
  providedIn: 'root'
})
export class GoogleApiService {

  constructor(private readonly oAuthService: OAuthService) {
    oAuthService.configure(oAuthConfig);
    oAuthService.setupAutomaticSilentRefresh();
  }

  async login(): Promise<void> {
    await this.oAuthService.loadDiscoveryDocumentAndTryLogin();
  }

  hasValidAccessToken() {
    return this.oAuthService.hasValidAccessToken();
  }

  initLoginFlow() {
    this.oAuthService.initLoginFlow();
  }

  getIdToken() {
    return this.oAuthService.getIdToken();
  }

  logout() {
    this.oAuthService.logOut();
    window.location.href = window.location.origin + '/home';
  }
}