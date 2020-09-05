import { ReadonlyArrayBase, ArrayBase } from './types/array';
import { BooleanBase } from './types/boolean';
import { BrandBase } from './types/brand';
import { ConstraintBase } from './types/constraint';
import { DictionaryBase } from './types/dictionary';
import { FunctionBase } from './types/function';
import { InstanceOfBase } from './types/instanceof';
import { IntersectBase } from './types/intersect';
import { LazyBase } from './types/lazy';
import { LiteralBase } from './types/literal';
import { NeverBase } from './types/never';
import { NumberBase } from './types/number';
import { InternalRecordBase } from './types/record';
import { StringBase } from './types/string';
import { SymbolBase } from './types/symbol';
import { TupleBase } from './types/tuple';
import { UnionBase } from './types/union';
import { UnknownBase } from './types/unknown';
import { RuntypeBase } from './runtype';

export type ReflectWithoutLazy =
  | ReadonlyArrayBase
  | ArrayBase
  | BooleanBase
  | BrandBase
  | ConstraintBase<Reflect, unknown>
  | DictionaryBase
  | FunctionBase
  | InstanceOfBase
  | IntersectBase
  | LiteralBase
  | NeverBase
  | NumberBase
  | InternalRecordBase
  | StringBase
  | SymbolBase
  | TupleBase
  | UnionBase
  | UnknownBase;
export type Reflect = ReflectWithoutLazy | LazyBase;
export function canReflect(runtype: RuntypeBase<unknown>): runtype is Reflect {
  // TODO: check it's a valid tag?
  return 'tag' in runtype;
}
export function reflect<TTag extends Reflect['tag']>(
  runtype: RuntypeBase<unknown>,
  tag: TTag,
): runtype is Extract<Reflect, { readonly tag: TTag }> {
  return canReflect(runtype) && runtype.tag === tag;
}
// | Unknown
// | Never
// | Void
// | Boolean
// | Number
// | String
// | Symbol
// | Literal<LiteralBase>
// | Array<Reflect, false>
// | Array<Reflect, true>;
// | ({
//     tag: 'record';
//     fields: { [_: string]: Reflect };
//     isPartial: boolean;
//     isReadonly: boolean;
//   } & RuntypeBase<{ readonly [_ in string]: unknown }>)
// | ({ tag: 'dictionary'; key: 'string' | 'number'; value: Reflect } & Runtype<{
//     [_: string]: unknown;
//   }>)
// | ({ tag: 'tuple'; components: Reflect[] } & RuntypeBase<unknown[]>)
// | ({ tag: 'union'; alternatives: Reflect[] } & RuntypeBase)
// | ({ tag: 'intersect'; intersectees: Reflect[] } & RuntypeBase)
// | ({ tag: 'function' } & RuntypeBase<(...args: any[]) => any>)
// | ({
//     tag: 'constraint';
//     underlying: Reflect;
//     constraint: ConstraintCheck<RuntypeBase<never>>;
//     args?: any;
//     name?: string;
//   } & RuntypeBase)
// | ({ tag: 'instanceof'; ctor: Constructor<unknown> } & RuntypeBase)
// | ({ tag: 'brand'; brand: string; entity: Reflect } & RuntypeBase);
