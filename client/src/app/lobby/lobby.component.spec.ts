import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LobbyComponent} from './lobby.component';
import {LobbyModule} from './lobby.module';
import {TestModule} from '../testing/test.module';

describe('LobbyComponent', () => {
  let component: LobbyComponent;
  let fixture: ComponentFixture<LobbyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
          imports: [LobbyModule, TestModule]
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
