import { create, Codec } from '../runtype';
import showValue from '../showValue';

export interface Constructor<V> {
  new (...args: any[]): V;
}

export interface InstanceOf<V = unknown> extends Codec<V> {
  readonly tag: 'instanceof';
  readonly ctor: Constructor<V>;
}

export function InstanceOf<V>(ctor: Constructor<V>): InstanceOf<V> {
  return create<InstanceOf<V>>(
    value =>
      value instanceof ctor
        ? { success: true, value }
        : {
            success: false,
            message: `Expected ${(ctor as any).name}, but was ${showValue(value)}`,
          },
    {
      tag: 'instanceof',
      ctor: ctor,
      show() {
        const name = (ctor as any).name;
        return `InstanceOf<${name}>`;
      },
    },
  );
}
