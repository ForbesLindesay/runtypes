import { RuntypeBase, Static, create, RuntypeHelpers } from '../runtype';

export const RuntypeName = Symbol('RuntypeName');

export interface BrandBase<
  B extends string = string,
  A extends RuntypeBase<unknown> = RuntypeBase<unknown>
>
  extends RuntypeBase<
    Static<A> & {
      [RuntypeName]: B;
    }
  > {
  readonly tag: 'brand';
  readonly brand: B;
  readonly entity: A;
}

export interface Brand<B extends string, A extends RuntypeBase<unknown>>
  extends RuntypeHelpers<
      Static<A> & {
        [RuntypeName]: B;
      }
    >,
    BrandBase<B, A> {}

export function Brand<B extends string, A extends RuntypeBase<unknown>>(brand: B, entity: A) {
  return create<Brand<B, A>>(
    value => {
      const validated = entity.validate(value);
      return validated.success
        ? { success: true, value: validated.value as Static<Brand<B, A>> }
        : validated;
    },
    {
      tag: 'brand',
      brand,
      entity,
    },
  );
}
