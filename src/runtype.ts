import { Result, Union, Intersect, Constraint, ConstraintCheck, Brand } from './index';
import show from './show';
import { ValidationError } from './errors';

/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export interface RuntypeBase<A = unknown> {
  readonly tag: string;
  /**
   * Validates that a value conforms to this type, and returns a result indicating
   * success or failure (does not throw).
   */
  validate(x: any): Result<A>;
  show?: (ctx: {
    needsParens: boolean;
    parenthesize: (str: string) => string;
    showChild: (rt: RuntypeBase, needsParens: boolean) => string;
  }) => string;
}

/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export interface RuntypeHelpers<A = unknown> extends RuntypeBase<A> {
  /**
   * Verifies that a value conforms to this runtype. When given a value that does
   * not conform to the runtype, throws an exception.
   */
  assert(x: any): asserts x is A;

  /**
   * Verifies that a value conforms to this runtype. If so, returns the same value,
   * statically typed. Otherwise throws an exception.
   */
  check(x: any): A;

  /**
   * A type guard for this runtype.
   */
  guard(x: any): x is A;

  /**
   * Union this Runtype with another.
   */
  Or<B extends RuntypeBase>(B: B): Union<[this, B]>;

  /**
   * Intersect this Runtype with another.
   */
  And<B extends RuntypeBase>(B: B): Intersect<[this, B]>;

  /**
   * Use an arbitrary constraint function to validate a runtype, and optionally
   * to change its name and/or its static type.
   *
   * @template T - Optionally override the static type of the resulting runtype
   * @param {(x: Static<this>) => boolean | string} constraint - Custom function
   * that returns `true` if the constraint is satisfied, `false` or a custom
   * error message if not.
   * @param [options]
   * @param {string} [options.name] - allows setting the name of this
   * constrained runtype, which is helpful in reflection or diagnostic
   * use-cases.
   */
  withConstraint<T extends Static<this>, K = unknown>(
    constraint: ConstraintCheck<this>,
    options?: { name?: string; args?: K },
  ): Constraint<this, T, K>;

  /**
   * Helper function to convert an underlying Runtype into another static type
   * via a type guard function.  The static type of the runtype is inferred from
   * the type of the guard function.
   *
   * @template T - Typically inferred from the return type of the type guard
   * function, so usually not needed to specify manually.
   * @param {(x: Static<this>) => x is T} guard - Type guard function (see
   * https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
   *
   * @param [options]
   * @param {string} [options.name] - allows setting the name of this
   * constrained runtype, which is helpful in reflection or diagnostic
   * use-cases.
   */
  withGuard<T extends Static<this>, K = unknown>(
    guard: (x: Static<this>) => x is T,
    options?: { name?: string; args?: K },
  ): Constraint<this, T, K>;

  /**
   * Adds a brand to the type.
   */
  withBrand<B extends string>(brand: B): Brand<B, this>;

  // case<Result>(fn: (value: A) => Result): PairCase<A, Result>;
}

/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export type Runtype<A = unknown> = RuntypeHelpers<A>;

/**
 * Obtains the static type associated with a Runtype.
 */
export type Static<A extends RuntypeBase<any>> = A extends RuntypeBase<infer T> ? T : unknown;

export function create<TConfig extends RuntypeBase<any>>(
  validate: (x: any, visited: VisitedState) => Result<Static<TConfig>>,
  config: Omit<
    TConfig,
    | 'assert'
    | 'check'
    | 'guard'
    | 'validate'
    | 'Or'
    | 'And'
    | 'withConstraint'
    | 'withGuard'
    | 'withBrand'
  >,
): TConfig {
  const A: any = config;
  A.check = check;
  A.assert = check;
  A._innerValidate = (value: any, visited: VisitedState) => {
    if (visited.has(value, A)) return { success: true, value };
    return validate(value, visited);
  };
  A.validate = (value: any) => A._innerValidate(value, VisitedState());
  A.guard = guard;
  A.Or = Or;
  A.And = And;
  A.withConstraint = withConstraint;
  A.withGuard = withGuard;
  A.withBrand = withBrand;
  A.reflect = A;
  A.toString = () => `Runtype<${show(A)}>`;

  return A;

  function check(x: any) {
    const validated = A.validate(x);
    if (validated.success) {
      return validated.value;
    }
    throw new ValidationError(validated.message, validated.key);
  }

  function guard(x: any): x is TConfig {
    return A.validate(x).success;
  }

  function Or<B extends RuntypeBase>(B: B): Union<[TConfig, B]> {
    return Union(A, B);
  }

  function And<B extends RuntypeBase>(B: B): Intersect<[TConfig, B]> {
    return Intersect(A, B);
  }

  function withConstraint<T extends Static<TConfig>, K = unknown>(
    constraint: ConstraintCheck<TConfig>,
    options?: { name?: string; args?: K },
  ): Constraint<TConfig, T, K> {
    return Constraint<TConfig, T, K>(A, constraint, options);
  }

  function withGuard<T extends Static<TConfig>, K = unknown>(
    guard: (x: Static<TConfig>) => x is T,
    options?: { name?: string; args?: K },
  ): Constraint<TConfig, T, K> {
    return Constraint<TConfig, T, K>(A, guard, options);
  }

  function withBrand<B extends string>(B: B): Brand<B, TConfig> {
    return Brand<B, TConfig>(B, A);
  }
}

export function innerValidate<A extends RuntypeBase>(
  targetType: A,
  value: any,
  visited: VisitedState,
): Result<Static<A>> {
  return (targetType as any)._innerValidate(value, visited);
}

type VisitedState = {
  has: (candidate: object, type: Runtype) => boolean;
};
function VisitedState(): VisitedState {
  const members: WeakMap<object, WeakMap<Runtype, true>> = new WeakMap();

  const add = (candidate: object, type: Runtype) => {
    if (candidate === null || !(typeof candidate === 'object')) return;
    const typeSet = members.get(candidate);
    members.set(
      candidate,
      typeSet ? typeSet.set(type, true) : (new WeakMap() as WeakMap<Runtype, true>).set(type, true),
    );
  };

  const has = (candidate: object, type: Runtype) => {
    const typeSet = members.get(candidate);
    const value = (typeSet && typeSet.get(type)) || false;
    add(candidate, type);
    return value;
  };

  return { has };
}
