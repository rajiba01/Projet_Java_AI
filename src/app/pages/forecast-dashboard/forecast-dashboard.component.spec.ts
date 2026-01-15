import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ForecastDashboardComponent } from './forecast-dashboard.component';

describe('ForecastDashboardComponent', () => {
  let component: ForecastDashboardComponent;
  let fixture: ComponentFixture<ForecastDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForecastDashboardComponent],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForecastDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
