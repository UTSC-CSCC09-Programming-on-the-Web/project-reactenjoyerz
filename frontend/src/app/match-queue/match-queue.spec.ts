import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchQueue } from './match-queue';

describe('MatchQueue', () => {
  let component: MatchQueue;
  let fixture: ComponentFixture<MatchQueue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchQueue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchQueue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
