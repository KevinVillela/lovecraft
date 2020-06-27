import { TestBed } from '@angular/core/testing';

import { FirestoreGameStore } from './firestore-game-store.';

describe('FirestoreGameStoreService', () => {
  let service: FirestoreGameStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirestoreGameStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
