import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { FournisseurCommandesComponent } from './fournisseur-commandes.component';

describe('FournisseurCommandesComponent', () => {
  let component: FournisseurCommandesComponent;
  let fixture: ComponentFixture<FournisseurCommandesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FournisseurCommandesComponent],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FournisseurCommandesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
