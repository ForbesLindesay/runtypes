import { RuntypeBase, Static, create, Codec, assertRuntype } from '../runtype';

export const RuntypeName = Symbol('RuntypeName');

export interface Brand<B extends string, A extends RuntypeBase<unknown>>
  extends Codec<
    Static<A> & {
      [RuntypeName]: B;
    }
  > {
  readonly tag: 'brand';
  readonly brand: B;
  readonly entity: A;
}

export function isBrandRuntype(runtype: RuntypeBase): runtype is Brand<string, RuntypeBase> {
  return 'tag' in runtype && (runtype as Brand<string, RuntypeBase>).tag === 'brand';
}

export function Brand<B extends string, A extends RuntypeBase<unknown>>(brand: B, entity: A) {
  assertRuntype(entity);
  return create<Brand<B, A>>(
    'brand',
    (value, _innerValidate, innerValidateToPlaceholder) => {
      return innerValidateToPlaceholder(entity, value) as any;
    },
    {
      brand,
      entity,
      show({ showChild, needsParens }) {
        return showChild(entity, needsParens);
      },
    },
  );
}
