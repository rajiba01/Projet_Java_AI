import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { HomeFournisseurComponent } from './home-fournisseur.component';

describe('HomeFournisseurComponent', () => {
  let component: HomeFournisseurComponent;
  let fixture: ComponentFixture<HomeFournisseurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeFournisseurComponent],
      providers: [provideHttpClient(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeFournisseurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
