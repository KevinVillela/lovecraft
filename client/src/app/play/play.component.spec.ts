import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {PlayComponent} from './play.component';
import {PlayModule} from './play.module';
import {TestModule} from '../testing/test.module';
import {ActivatedRoute} from '@angular/router';

describe('PlayComponent', () => {
  let component: PlayComponent;
  let fixture: ComponentFixture<PlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
          imports: [PlayModule, TestModule],
          providers: [{provide: ActivatedRoute, useValue: {snapshot: {paramMap: new Map<string, string>([['game_id', 'gameId']])}}}]
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
