import { Result } from '../result';
import {
  RuntypeBase,
  Static,
  create,
  Codec,
  innerGuard,
  createGuardVisitedState,
} from '../runtype';
import show from '../show';

export interface ParsedValue<TUnderlying extends RuntypeBase<unknown>, TParsed>
  extends Codec<TParsed, Static<TUnderlying>> {
  readonly tag: 'parsed';
  readonly underlying: TUnderlying;
  readonly config: ParsedValueConfig<TUnderlying, TParsed>;
}

export function isParsedValueRuntype(
  runtype: RuntypeBase,
): runtype is ParsedValue<RuntypeBase, unknown> {
  return 'tag' in runtype && (runtype as ParsedValue<RuntypeBase, unknown>).tag === 'parsed';
}

export interface ParsedValueConfig<TUnderlying extends RuntypeBase<unknown>, TParsed> {
  name?: string;
  parse: (value: Static<TUnderlying>) => Result<TParsed>;
  serialize?: (value: TParsed) => Result<Static<TUnderlying>>;
  test?: RuntypeBase<TParsed>;
}
export function ParsedValue<TUnderlying extends RuntypeBase<unknown>, TParsed>(
  underlying: TUnderlying,
  config: ParsedValueConfig<TUnderlying, TParsed>,
): ParsedValue<TUnderlying, TParsed> {
  return create<ParsedValue<TUnderlying, TParsed>>(
    {
      validate: (value, innerValidate) => {
        const validated = innerValidate(underlying, value);

        if (!validated.success) {
          return validated;
        }

        const parsed = config.parse(value);

        if (!parsed.success) {
          return parsed;
        }

        const testResult = config.test
          ? innerGuard(config.test, parsed.value, createGuardVisitedState())
          : undefined;

        return testResult || parsed;
      },
      test(value, internalTest) {
        if (config.test) {
          return internalTest(config.test, value);
        } else {
          return {
            success: false,
            message: `${config.name ||
              `ParsedValue<${show(underlying)}>`} does not support Runtype.test`,
          };
        }
      },
      serialize(value, internalSerialize) {
        if (!config.serialize) {
          return {
            success: false,
            message: `${config.name ||
              `ParsedValue<${show(underlying)}>`} does not support Runtype.serialize`,
          };
        }
        const testResult = config.test
          ? innerGuard(config.test, value, createGuardVisitedState())
          : undefined;

        if (testResult) {
          return testResult;
        }

        const serialized = config.serialize(value);

        if (!serialized.success) {
          return serialized;
        }

        return internalSerialize(underlying, serialized.value);
      },
    },
    {
      tag: 'parsed',
      underlying,
      config,

      show({ showChild }) {
        return config.name || `ParsedValue<${showChild(underlying, false)}>`;
      },
    },
  );
}
