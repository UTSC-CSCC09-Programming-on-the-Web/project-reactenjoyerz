import { TestBed } from '@angular/core/testing';

import { GoogleApiService } from './google-api';

describe('GoogleApi', () => {
  let service: GoogleApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});


