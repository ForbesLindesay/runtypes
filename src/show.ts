import { Reflect } from './index';
import { RuntypeBase } from './runtype';
import { canReflect } from './reflect';

const show = (needsParens: boolean, circular: Set<RuntypeBase<unknown>>) => (
  runtype: RuntypeBase<unknown>,
): string => {
  const parenthesize = (s: string) => (needsParens ? `(${s})` : s);
  if (!canReflect(runtype)) {
    // TODO: what if `RuntypeBase` required an implementation of `show`?
    return parenthesize(`CUSTOM TYPE`);
  }
  const refl = runtype;

  if (circular.has(refl)) {
    return parenthesize(`CIRCULAR ${refl.tag}`);
  }

  circular.add(refl);

  try {
    switch (refl.tag) {
      // Primitive types
      case 'unknown':
      case 'never':
      case 'boolean':
      case 'number':
      case 'string':
      case 'symbol':
      case 'function':
        return refl.tag;

      // Complex types
      case 'literal': {
        const { value } = refl;
        return typeof value === 'string' ? `"${value}"` : String(value);
      }
      case 'array':
        return `${readonlyTag(refl)}${show(true, circular)(refl.element)}[]`;
      case 'dictionary':
        return `{ [k in ${show(false, circular)(refl.key)}]: ${show(
          false,
          circular,
        )(refl.value)} }`;
      case 'record': {
        const keys = Object.keys(refl.fields);
        return keys.length
          ? `{ ${keys
              .map(
                k =>
                  `${readonlyTag(refl)}${k}${partialTag(refl)}: ${show(
                    false,
                    circular,
                  )(refl.fields[k])};`,
              )
              .join(' ')} }`
          : '{}';
      }
      case 'tuple':
        return `[${refl.components.map(show(false, circular)).join(', ')}]`;
      case 'union':
        return parenthesize(`${refl.alternatives.map(show(true, circular)).join(' | ')}`);
      case 'intersect':
        return parenthesize(`${refl.intersectees.map(show(true, circular)).join(' & ')}`);
      case 'constraint':
        return refl.name || show(needsParens, circular)(refl.underlying);
      case 'instanceof':
        const name = (refl.ctor as any).name;
        return `InstanceOf<${name}>`;
      case 'brand':
        return show(needsParens, circular)(refl.entity);
    }
  } finally {
    circular.delete(refl);
  }
  throw Error('impossible');
};

export default show(false, new Set<Reflect>());

function partialTag({ isPartial }: { isPartial: boolean }): string {
  return isPartial ? '?' : '';
}

function readonlyTag({ isReadonly }: { isReadonly: boolean }): string {
  return isReadonly ? 'readonly ' : '';
}
