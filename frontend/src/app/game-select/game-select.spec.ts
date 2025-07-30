import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameSelect } from './game-select';

describe('GameSelect', () => {
  let component: GameSelect;
  let fixture: ComponentFixture<GameSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameSelect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameSelect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
