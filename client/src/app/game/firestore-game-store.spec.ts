import {TestBed} from '@angular/core/testing';

import {FirestoreGameStore} from './firestore-game-store';
import {TestModule} from '../testing/test.module';
import {BehaviorSubject} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';

describe('FirestoreGameStoreService', () => {
  let service: FirestoreGameStore;
  const FirestoreStub = {
    collection: (name: string) => ({
      snapshotChanges: () => new BehaviorSubject({foo: 'bar'}),
      doc: (id: string) => ({
        valueChanges: () => new BehaviorSubject({foo: 'bar'}),
        set: (d: any) => new Promise((resolve, reject) => resolve()),
      }),
    }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [TestModule], providers: [{provide: AngularFirestore, useValue: FirestoreStub}]});
    service = TestBed.inject(FirestoreGameStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
