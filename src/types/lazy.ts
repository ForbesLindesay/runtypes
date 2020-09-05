import { create, RuntypeBase, RuntypeHelpers, innerValidate, Static } from '../runtype';

export interface LazyBase<TUnderlying extends RuntypeBase<unknown> = RuntypeBase<unknown>>
  extends RuntypeBase<Static<TUnderlying>> {
  readonly tag: 'lazy';
  readonly underlying: () => TUnderlying;
}

export interface Lazy<TUnderlying extends RuntypeBase<unknown>>
  extends RuntypeHelpers<Static<TUnderlying>>,
    LazyBase<TUnderlying> {}

export function lazyValue<T>(fn: () => T) {
  let value: T;
  return () => {
    if (!value) {
      value = fn();
    }
    return value;
  };
}

/**
 * Construct a possibly-recursive Runtype.
 */
export function Lazy<TUnderlying extends RuntypeBase<unknown>>(
  delayed: () => TUnderlying,
): Lazy<TUnderlying> {
  const underlying = lazyValue(delayed);

  return create<Lazy<TUnderlying>>(
    (...args) => {
      return innerValidate(underlying(), ...args);
    },
    {
      tag: 'lazy',
      underlying,
    },
  );
}
