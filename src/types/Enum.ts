import { expected, success } from '../result';
import { create, Codec } from '../runtype';
import showValue from '../showValue';

export interface Enum<TEnum extends { [key: string]: number | string }>
  extends Codec<TEnum[keyof TEnum]> {
  readonly tag: 'enum';
  readonly enumObject: TEnum;
}

export function Enum<TEnum extends { [key: string]: number | string }>(
  name: string,
  e: TEnum,
): Enum<TEnum> {
  const values = Object.values(e);
  const enumValues = new Set(
    values.some(v => typeof v === 'number') ? values.filter(v => typeof v === 'number') : values,
  );
  return create<Enum<TEnum>>(
    'enum',
    value => {
      if (enumValues.has(value as any)) {
        return success(value as any);
      } else {
        return expected(name, showValue(value));
      }
    },
    {
      enumObject: e,
      show: () => name,
    },
  );
}
