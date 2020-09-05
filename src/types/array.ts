import { Static, create, innerValidate, RuntypeBase, RuntypeHelpers } from '../runtype';

export interface ReadonlyArrayBase<E extends RuntypeBase<unknown> = RuntypeBase<unknown>>
  extends RuntypeBase<readonly Static<E>[]> {
  readonly tag: 'array';
  readonly element: E;
  readonly isReadonly: true;
}
export interface ArrayBase<E extends RuntypeBase<unknown> = RuntypeBase<unknown>>
  extends RuntypeBase<Static<E>[]> {
  readonly tag: 'array';
  readonly element: E;
  readonly isReadonly: false;
}

export interface ReadonlyArray<E extends RuntypeBase<unknown> = RuntypeBase<unknown>>
  extends RuntypeHelpers<readonly Static<E>[]>,
    ReadonlyArrayBase<E> {}

export { Arr as Array };
interface Arr<E extends RuntypeBase<unknown> = RuntypeBase<unknown>>
  extends RuntypeHelpers<Static<E>[]>,
    ArrayBase<E> {
  asReadonly(): ReadonlyArray<E>;
}

/**
 * Construct an array runtype from a runtype for its elements.
 */
function InternalArr<TElement extends RuntypeBase<unknown>, IsReadonly extends boolean>(
  element: TElement,
  isReadonly: IsReadonly,
): IsReadonly extends true ? ReadonlyArray<TElement> : Arr<TElement> {
  const result = create<ReadonlyArrayBase<TElement> | ArrayBase<TElement>>(
    (xs, visited) => {
      if (!Array.isArray(xs)) {
        return {
          success: false,
          message: `Expected array, but was ${xs === null ? xs : typeof xs}`,
        };
      }

      for (const x of xs) {
        let validated = innerValidate(element, x, visited);
        if (!validated.success) {
          return {
            success: false,
            message: validated.message,
            key: validated.key ? `[${xs.indexOf(x)}].${validated.key}` : `[${xs.indexOf(x)}]`,
          };
        }
      }

      return { success: true, value: xs };
    },
    { tag: 'array', isReadonly, element },
  );
  if (!isReadonly) {
    (result as any).asReadonly = asReadonly;
  }
  return result as any;
  function asReadonly(): ReadonlyArray<TElement> {
    return InternalArr(element, true);
  }
}

function Arr<TElement extends RuntypeBase<unknown>>(element: TElement): Arr<TElement> {
  return InternalArr(element, false);
}
