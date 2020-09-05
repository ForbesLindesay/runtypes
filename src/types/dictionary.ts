import { create, Static, innerValidate, RuntypeBase, RuntypeHelpers } from '../runtype';
import show from '../show';
import { String } from './string';
import { Number } from './number';
import { Literal } from './literal';
import { Constraint } from './constraint';
import { Lazy, lazyValue } from './lazy';
import { Union } from './union';

// TODO: do not explicitly pick 'tag' once it's part of RuntypeBase
export type KeyRuntypeBaseWithoutLazyOrUnion =
  | Pick<String, 'tag' | keyof RuntypeBase>
  | Pick<Number, 'tag' | keyof RuntypeBase>
  | Pick<Literal<string | number>, 'tag' | 'value' | keyof RuntypeBase>
  | Pick<Constraint<KeyRuntypeBase, string | number>, 'tag' | 'underlying' | keyof RuntypeBase>;
export type KeyRuntypeBaseWithoutLazy =
  | KeyRuntypeBaseWithoutLazyOrUnion
  | Pick<Union<KeyRuntypeBaseWithoutUnion[]>, 'tag' | 'alternatives' | keyof RuntypeBase>;
export type KeyRuntypeBaseWithoutUnion =
  | KeyRuntypeBaseWithoutLazyOrUnion
  | Pick<Lazy<KeyRuntypeBaseWithoutLazyOrUnion>, 'tag' | 'underlying' | keyof RuntypeBase>;
export type KeyRuntypeBase = KeyRuntypeBaseWithoutLazy | KeyRuntypeBaseWithoutUnion;

function getExpectedBaseType(key: KeyRuntypeBase): 'string' | 'number' | 'mixed' {
  switch (key.tag) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'literal':
      return typeof key.value as 'string' | 'number';
    case 'union':
      const baseTypes = key.alternatives.map(getExpectedBaseType);
      if (baseTypes.length === 1) return baseTypes[0];
      return baseTypes.reduce((a, b) => (a === b ? a : 'mixed'));
    case 'constraint':
      return getExpectedBaseType(key.underlying);
    case 'lazy':
      return getExpectedBaseType(key.underlying());
  }
}

export interface Dictionary<K extends KeyRuntypeBase, V extends RuntypeBase<unknown>>
  extends RuntypeHelpers<{ [_ in Static<K>]: Static<V> }>,
    RuntypeBase<{ [_ in Static<K>]: Static<V> }> {
  readonly tag: 'dictionary';
  readonly key: K;
  readonly value: V;
}

/**
 * Construct a runtype for arbitrary dictionaries.
 */
export function Dictionary<K extends KeyRuntypeBase, V extends RuntypeBase<unknown>>(
  key: K,
  value: V,
): Dictionary<K, V> {
  const expectedBaseType = lazyValue(() => getExpectedBaseType(key));
  const runtype: Dictionary<K, V> = create<Dictionary<K, V>>(
    (x, visited) => {
      if (x === null || x === undefined) {
        return { success: false, message: `Expected ${show(runtype)}, but was ${x}` };
      }

      if (typeof x !== 'object') {
        return { success: false, message: `Expected ${show(runtype)}, but was ${typeof x}` };
      }

      if (Object.getPrototypeOf(x) !== Object.prototype) {
        if (!Array.isArray(x)) {
          return {
            success: false,
            message: `Expected ${show(runtype)}, but was ${Object.getPrototypeOf(x)}`,
          };
        }
        return { success: false, message: 'Expected dictionary, but was array' };
      }

      for (const k in x) {
        if (expectedBaseType() === 'number') {
          if (isNaN(+k))
            return {
              success: false,
              message: 'Expected dictionary key to be a number, but was string',
            };
          const keyResult = key.validate(+k);
          if (!keyResult.success) return keyResult;
        } else if (expectedBaseType() === 'string') {
          const keyResult = key.validate(k);
          if (!keyResult.success) return keyResult;
        } else {
          const numResult = !isNaN(+k) && key.validate(+k);
          const strResult = key.validate(k);
          if (!(!numResult || numResult.success) && !strResult.success) return strResult;
        }

        const validated = innerValidate(value, (x as any)[k], visited);
        if (!validated.success) {
          return {
            success: false,
            message: validated.message,
            key: validated.key ? `${k}.${validated.key}` : k,
          };
        }
      }

      return { success: true, value: x };
    },
    {
      tag: 'dictionary',
      key,
      value,
      show({ showChild }) {
        return `{ [_: ${showChild(key, false)}]: ${showChild(value, false)} }`;
      },
    },
  );
  return runtype;
}
