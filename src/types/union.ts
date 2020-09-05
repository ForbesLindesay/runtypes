import { Runtype, Static, create, innerValidate, RuntypeBase } from '../runtype';
import show from '../show';
import { hasKey } from '../util';
import { LiteralValue, isLiteralRuntype, Literal } from './literal';
import { resolveLazyRuntype } from './lazy';
import { isRecordRuntype } from './record';
import { Number } from './number';
import { String } from './string';

export type StaticUnion<TAlternatives extends readonly RuntypeBase<unknown>[]> = {
  [key in keyof TAlternatives]: TAlternatives[key] extends RuntypeBase<unknown>
    ? Static<TAlternatives[key]>
    : unknown;
}[number];

export interface Union<TAlternatives extends readonly RuntypeBase<unknown>[]>
  extends Runtype<StaticUnion<TAlternatives>> {
  readonly tag: 'union';
  readonly alternatives: TAlternatives;
  match: Match<TAlternatives>;
}

/**
 * Construct a union runtype from runtypes for its alternatives.
 */
export function Union<
  TAlternatives extends readonly [RuntypeBase<unknown>, ...RuntypeBase<unknown>[]]
>(...alternatives: TAlternatives): Union<TAlternatives> {
  const match = (...cases: any[]) => (x: any) => {
    for (let i = 0; i < alternatives.length; i++) {
      const input = alternatives[i].validate(x);
      if (input.success) {
        return cases[i](input.value);
      }
    }
  };

  const runtype: Union<TAlternatives> = create<Union<TAlternatives>>(
    (value, visited) => {
      const commonLiteralFields: { [key: string]: LiteralValue[] } = {};
      for (const alternative of alternatives) {
        const alt = resolveLazyRuntype(alternative);
        if (isRecordRuntype(alt)) {
          for (const fieldName in alt.fields) {
            const field = resolveLazyRuntype(alt.fields[fieldName]);
            if (isLiteralRuntype(field)) {
              if (commonLiteralFields[fieldName]) {
                if (commonLiteralFields[fieldName].every(value => value !== field.value)) {
                  commonLiteralFields[fieldName].push(field.value);
                }
              } else {
                commonLiteralFields[fieldName] = [field.value];
              }
            }
          }
        }
      }

      for (const fieldName in commonLiteralFields) {
        if (commonLiteralFields[fieldName].length === alternatives.length) {
          for (const alternative of alternatives) {
            const alt = resolveLazyRuntype(alternative);
            if (isRecordRuntype(alt)) {
              const field = resolveLazyRuntype(alt.fields[fieldName]);
              if (
                isLiteralRuntype(field) &&
                hasKey(fieldName, value) &&
                value[fieldName] === field.value
              ) {
                return innerValidate(alt, value, visited);
              }
            }
          }
        }
      }

      for (const targetType of alternatives) {
        if (innerValidate(targetType, value, visited).success) {
          return { success: true, value };
        }
      }

      return {
        success: false,
        message: `Expected ${show(runtype)}, but was ${value === null ? value : typeof value}`,
      };
    },
    {
      tag: 'union',
      alternatives,
      match: match as any,
      show({ parenthesize, showChild }) {
        return parenthesize(`${alternatives.map(v => showChild(v, true)).join(' | ')}`);
      },
    },
  );

  return runtype;
}

export interface Match<A extends readonly RuntypeBase<unknown>[]> {
  <Z>(
    ...a: { [key in keyof A]: A[key] extends RuntypeBase<unknown> ? Case<A[key], Z> : never }
  ): Matcher<A, Z>;
}

export type Case<T extends RuntypeBase<unknown>, Result> = (v: Static<T>) => Result;

export type Matcher<A extends readonly RuntypeBase<unknown>[], Z> = (
  x: {
    [key in keyof A]: A[key] extends RuntypeBase<infer Type> ? Type : unknown;
  }[number],
) => Z;

const f = Union(Literal(42), Number, String);
// const f = match(
//   [Literal(42), fortyTwo => fortyTwo / 2],
//   [Number, n => n + 9],
//   [String, s => s.length * 2],
// );
// f(42) // => 21
