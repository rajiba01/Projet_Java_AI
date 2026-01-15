import { TestBed } from '@angular/core/testing';

import { EconomicService } from './economic.service';

describe('EconomicService', () => {
  let service: EconomicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EconomicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
