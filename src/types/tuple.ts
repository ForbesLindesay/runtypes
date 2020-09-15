import { expected, failure, Failure, FullError } from '../result';
import { create, RuntypeBase, Codec, createValidationPlaceholder, assertRuntype } from '../runtype';
import show from '../show';
import showValue from '../showValue';
import { Array as Arr } from './array';
import { Unknown } from './unknown';

export type StaticTuple<TElements extends readonly RuntypeBase<unknown>[]> = {
  [key in keyof TElements]: TElements[key] extends RuntypeBase<infer E> ? E : unknown;
};

export interface Tuple<
  TElements extends readonly RuntypeBase<unknown>[] = readonly RuntypeBase<unknown>[]
> extends Codec<StaticTuple<TElements>> {
  readonly tag: 'tuple';
  readonly components: TElements;
}

export function isTupleRuntype(runtype: RuntypeBase): runtype is Tuple<readonly RuntypeBase[]> {
  return 'tag' in runtype && (runtype as Tuple<readonly RuntypeBase[]>).tag === 'tuple';
}

/**
 * Construct a tuple runtype from runtypes for each of its elements.
 */
export function Tuple<
  T extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]] | readonly []
>(...components: T): Tuple<T> {
  components.forEach(c => assertRuntype(c));
  const result = create<Tuple<T>>(
    'tuple',
    (x, innerValidate) => {
      const validated = innerValidate(Arr(Unknown), x);

      if (!validated.success) {
        return expected(`tuple to be an array`, x, {
          key: validated.key,
        });
      }

      if (validated.value.length !== components.length) {
        return expected(`an array of length ${components.length}`, validated.value.length);
      }

      return createValidationPlaceholder(validated.value as any, placeholder => {
        let fullError: FullError | undefined = undefined;
        let firstError: Failure | undefined;
        for (let i = 0; i < components.length; i++) {
          let validatedComponent = innerValidate(components[i], validated.value[i]);

          if (!validatedComponent.success) {
            if (!fullError) {
              fullError = [`Unable to assign ${showValue(validated.value)} to ${show(result)}:`];
            }
            fullError.push([
              `The types of [${i}] are not compatible:`,
              validatedComponent.fullError || [validatedComponent.message],
            ]);
            firstError =
              firstError ||
              failure(validatedComponent.message, {
                key: validatedComponent.key ? `[${i}].${validatedComponent.key}` : `[${i}]`,
                fullError: fullError,
              });
          } else {
            placeholder[i] = validatedComponent.value;
          }
        }
        return firstError;
      });
    },
    {
      components,
      show({ showChild }) {
        return `[${(components as readonly RuntypeBase<unknown>[])
          .map(e => showChild(e, false))
          .join(', ')}]`;
      },
    },
  );
  return result;
}
