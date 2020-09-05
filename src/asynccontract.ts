import { ValidationError } from './errors';
import { RuntypeBase } from './runtype';

export interface AsyncContract<A extends any[], Z> {
  enforce(f: (...a: A) => Promise<Z>): (...a: A) => Promise<Z>;
}

/**
 * Create a function contract.
 */
export function AsyncContract<A extends [any, ...any[]] | [], Z>(
  argTypes: { [key in keyof A]: key extends 'length' ? A['length'] : RuntypeBase<A[key]> },
  returnType: RuntypeBase<Z>,
): AsyncContract<A, Z> {
  return {
    enforce: (f: (...args: any[]) => any) => (...args: any[]) => {
      if (args.length < argTypes.length) {
        return Promise.reject(
          new ValidationError(
            `Expected ${argTypes.length} arguments but only received ${args.length}`,
          ),
        );
      }
      for (let i = 0; i < argTypes.length; i++) {
        const result = argTypes[i].validate(args[i]);
        if (result.success) {
          argTypes[i] = result.value;
        } else {
          return Promise.reject(new ValidationError(result.message, result.key));
        }
      }
      const returnedPromise = f(...args);
      if (!(returnedPromise instanceof Promise)) {
        return Promise.reject(
          new ValidationError(
            `Expected function to return a promise, but instead got ${returnedPromise}`,
          ),
        );
      }
      return returnedPromise.then(value => {
        const result = returnType.validate(value);
        if (result.success) {
          return result.value;
        } else {
          throw new ValidationError(result.message, result.key);
        }
      });
    },
  };
}
