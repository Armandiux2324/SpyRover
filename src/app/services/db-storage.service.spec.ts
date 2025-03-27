import { TestBed } from '@angular/core/testing';

import { DbStorageService } from './db-storage.service';

describe('DbStorageService', () => {
  let service: DbStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DbStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
