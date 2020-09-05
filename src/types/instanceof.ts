import { create, RuntypeBase, RuntypeHelpers } from '../runtype';

export interface Constructor<V> {
  new (...args: any[]): V;
}

export interface InstanceOfBase<V = unknown> extends RuntypeBase<V> {
  readonly tag: 'instanceof';
  readonly ctor: Constructor<V>;
}
export interface InstanceOf<V = unknown> extends RuntypeHelpers<V>, InstanceOfBase<V> {}

export function InstanceOf<V>(ctor: Constructor<V>): InstanceOf<V> {
  return create<InstanceOf<V>>(
    value =>
      value instanceof ctor
        ? { success: true, value }
        : {
            success: false,
            message: `Expected ${(ctor as any).name}, but was ${
              value === null ? value : typeof value
            }`,
          },
    { tag: 'instanceof', ctor: ctor },
  );
}
