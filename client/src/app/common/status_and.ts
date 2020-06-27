import {catchError, map, startWith} from 'rxjs/operators';
import {Observable, of} from 'rxjs';

export type StatusAnd<T, E = Error, I = unknown> =
    InitialStatusAnd<I>
    | LoadingStatusAnd<I>
    | ReadyStatusAnd<T>
    | ErrorStatusAnd<E>;

export interface InitialStatusAnd<I = unknown> {
  readonly status: Status.INITIAL;

  /** Optional intermediate result. */
  readonly intermediateResult?: I;
}

export interface LoadingStatusAnd<I = unknown> {
  readonly status: Status.LOADING;
  /** Optional loading progress of 0 - 100 */
  readonly progress?: number;

  /** Optional intermediate result. */
  readonly intermediateResult?: I;
}

export interface ReadyStatusAnd<T> {
  readonly status: Status.READY;
  /** The result of the computation. */
  readonly result: T;
}

export interface ErrorStatusAnd<E = Error> {
  readonly status: Status.ERROR;
  /**
   * The error that occurred.
   */
  readonly error: E;
}

export enum Status {
  INITIAL = 'INITIAL',
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR'
}

/**
 * Returns whether the given object is a {@link LoadingStatusAnd} object.
 */
export function isLoading<T, E, I>(statusAnd?: StatusAnd<T, E, I>):
    statusAnd is LoadingStatusAnd<I> {
  return statusAnd?.status === Status.LOADING;
}

/**
 * Returns whether the given object is a {@link ReadyStatusAnd} object.
 */
export function isReady<T, E>(statusAnd?: StatusAnd<T, E>):
    statusAnd is ReadyStatusAnd<T> {
  return statusAnd?.status === Status.READY;
}

/**
 * Returns whether the given object is a {@link ErrorStatusAnd} object.
 */
export function isError<T, E>(statusAnd?: StatusAnd<T, E>):
    statusAnd is ErrorStatusAnd<E> {
  return statusAnd?.status === Status.ERROR;
}

/**
 * Status that a computation has not yet started.
 */
export function initial<I>(intermediateResult?: I): InitialStatusAnd<I> {
  return intermediateResult === undefined ?
      {status: Status.INITIAL} :
      {status: Status.INITIAL, intermediateResult};
}

/**
 * Status that a computation is in progress.
 */
export function loading<I>(
    progress?: number, intermediateResult?: I): LoadingStatusAnd<I> {
  if (progress === undefined) {
    return {status: Status.LOADING};
  } else if (intermediateResult === undefined) {
    return {status: Status.LOADING, progress};
  } else {
    return {status: Status.LOADING, progress, intermediateResult};
  }
}

/**
 * Status that a computation has completed.
 */
export function ready<T>(result: T): ReadyStatusAnd<T> {
  return {status: Status.READY, result};
}

/**
 * Status that a computation has failed.
 */
export function error<E = Error>(error: E): ErrorStatusAnd<E> {
  return {status: Status.ERROR, error};
}

export function wrap<T, E = Error, I = void>(source: Observable<T>):
    Observable<StatusAnd<T, E, I>> {
  return source.pipe(
      map(value => ready(value)),
      catchError(err => of(error(err))),
      startWith<StatusAnd<T, E, I>>(loading<I>()),
  );
}
