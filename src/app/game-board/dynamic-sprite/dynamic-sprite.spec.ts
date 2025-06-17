import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicSprite } from './dynamic-sprite';

describe('DynamicSprite', () => {
  let component: DynamicSprite;
  let fixture: ComponentFixture<DynamicSprite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicSprite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicSprite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
