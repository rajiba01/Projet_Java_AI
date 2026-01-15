import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AchatService } from './achat.service';

describe('AchatService', () => {
  let service: AchatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AchatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should POST create achat', () => {
    service.createAchat({ idProduit: 1, quantite: 2 }).subscribe((res) => {
      expect(res.idProduit).toBe(1);
      expect(res.quantite).toBe(2);
    });

  const req = httpMock.expectOne('/api/achat');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idProduit: 1, quantite: 2 });

    req.flush('Achat effectué');
  });
});
