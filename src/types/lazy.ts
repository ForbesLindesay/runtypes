import { create, RuntypeBase, Codec, Static } from '../runtype';

export interface Lazy<TUnderlying extends RuntypeBase<unknown>> extends Codec<Static<TUnderlying>> {
  readonly tag: 'lazy';
  readonly underlying: () => TUnderlying;
}

export function lazyValue<T>(fn: () => T) {
  let value: T;
  return () => {
    if (!value) {
      value = fn();
    }
    return value;
  };
}

export function isLazyRuntype(runtype: RuntypeBase): runtype is Lazy<RuntypeBase> {
  return 'tag' in runtype && (runtype as Lazy<RuntypeBase<unknown>>).tag === 'lazy';
}

/**
 * Construct a possibly-recursive Runtype.
 */
export function Lazy<TUnderlying extends RuntypeBase<unknown>>(
  delayed: () => TUnderlying,
): Lazy<TUnderlying> {
  const underlying = lazyValue(delayed);

  return create<Lazy<TUnderlying>>(
    (value, _innerValidate, innerValidateToPlaceholder) => {
      return innerValidateToPlaceholder(underlying(), value) as any;
    },
    {
      tag: 'lazy',
      underlying,
      show({ showChild, needsParens }) {
        return showChild(underlying(), needsParens);
      },
    },
  );
}
