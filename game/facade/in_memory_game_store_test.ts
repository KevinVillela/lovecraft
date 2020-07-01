import {map, take} from 'rxjs/operators';

import {Card, Game, GameState} from '../models/models';
import {makeGame} from '../testing/test_utils';

import {InMemoryGameStore} from './in_memory_game_store';


describe('InMemoryGameStore', () => {
  let store = new InMemoryGameStore();

  beforeEach(() => {
    store = new InMemoryGameStore();
  });

  describe('applyTo', () => {
    it('can create new games', () => {
      const gameList = [];
      store.applyTo('foo', () => makeGame('foo', 0, {}, ''));
      store.gameForId('foo').subscribe({
        next: game => gameList.push(game),
      });

      store.applyTo('foo', (game) => {
        game.round++;
        return game;
      });

      store.applyTo('foo', (game) => {
        game.round++;
        return game;
      });

      store.applyTo('foo', (game) => {
        game.round++;
        return game;
      });

      expect(gameList.map((game: Game) => game.round)).toEqual([0, 1, 2, 3]);
    });

    it('acts just like calling setGameForId on mutation', () => {
      store.setGameForId('foo', makeGame('foo', 0, {}, ''));

      const gameList = [];
      store.gameForId('foo').subscribe({
        next: game => gameList.push(game),
      });

      store.applyTo('foo', (game) => {
        game.round++;
        return game;
      });

      store.applyTo('foo', (game) => {
        game.round++;
        return game;
      });

      store.applyTo('foo', (game) => {
        game.round++;
        return game;
      });

      expect(gameList.map((game: Game) => game.round)).toEqual([0, 1, 2, 3]);
    });
  });

  describe('gameForId', () => {
    it('returns a failed observable if the game does not exist', async () => {
      const game = await store.gameForId('foo').pipe(take(1)).toPromise();
      expect(game).toBeUndefined();
    });

    it('returns the game if it exists', async () => {
      store.setGameForId('foo', makeGame('foo', 0, {}, ''));
      const game = await store.gameForId('foo').pipe(take(1)).toPromise();
      expect(game.id).toBe('foo');
    });

    it('notifies subscribers on game updates.', async () => {
      const game = makeGame('foo', 0, {}, '');
      store.setGameForId('foo', game);

      const gameList = [];
      store.gameForId('foo').subscribe({
        next: game => gameList.push(game),
      });

      game.round++;
      store.setGameForId('foo', game);

      game.round++;
      store.setGameForId('foo', game);

      game.round++;
      store.setGameForId('foo', game);

      expect(gameList.map((game: Game) => game.round)).toEqual([0, 1, 2, 3]);
    });
  });

  describe('allGames', () => {
    it('updates when more games are added', async () => {
      const updates = [];
      store.allGames().subscribe({
        next: update => {
          updates.push(update);
        }
      });

      store.setGameForId('a', makeGame('a', 0, {}, ''));
      store.setGameForId('b', makeGame('b', 0, {}, ''));

      expect(updates.length).toBe(3);
      expect(Object.keys(updates[0])).toEqual([]);
      expect(Object.keys(updates[1])).toEqual(['a']);
      expect(Object.keys(updates[2])).toEqual(['a', 'b']);
    });

    it('updates when games are updated', async () => {
      const game = makeGame('a', 0, {}, '');
      store.setGameForId('a', game);

      const updates = [];
      store.allGames().subscribe({
        next: update => {
          updates.push(update);
        }
      });

      game.round++;
      store.setGameForId('a', game);

      expect(updates.length).toBe(2);
      expect(updates[1].a.round).toEqual(1);
    });
  });
});
