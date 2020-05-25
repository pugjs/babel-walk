import * as t from '@babel/types';

if (
  !(
    Array.isArray((t as any).TYPES) &&
    (t as any).TYPES.every((t: any) => typeof t === 'string')
  )
) {
  throw new Error('@babel/types TYPES does not match the expected type.');
}

const FLIPPED_ALIAS_KEYS: {[key: string]: string[]} = (t as any)
  .FLIPPED_ALIAS_KEYS;
const TYPES = new Set<string>((t as any).TYPES);

if (
  !(
    FLIPPED_ALIAS_KEYS &&
    // tslint:disable-next-line: strict-type-predicates
    typeof FLIPPED_ALIAS_KEYS === 'object' &&
    Object.keys(FLIPPED_ALIAS_KEYS).every(
      (key) =>
        Array.isArray(FLIPPED_ALIAS_KEYS[key]) &&
        // tslint:disable-next-line: strict-type-predicates
        FLIPPED_ALIAS_KEYS[key].every((v) => typeof v === 'string'),
    )
  )
) {
  throw new Error(
    '@babel/types FLIPPED_ALIAS_KEYS does not match the expected type.',
  );
}

/**
 * This serves thre functions:
 *
 * 1. Take any "aliases" and explode them to refecence the concrete types
 * 2. Normalize all handlers to have an `{enter, exit}` pair, rather than raw functions
 * 3. make the enter and exit handlers arrays, so that multiple handlers can be merged
 */
export default function explode(input: any): any {
  if (input._babel_walk_exploded) {
    return input._babel_walk_exploded;
  }
  const results: any = {};
  for (const key in input) {
    const aliases = FLIPPED_ALIAS_KEYS[key];
    if (aliases) {
      for (const concreteKey of aliases) {
        if (concreteKey in results) {
          if (typeof input[key] === 'function') {
            results[concreteKey].enter.push(input[key]);
          } else {
            if (input[key].enter)
              results[concreteKey].enter.push(input[key].enter);
            if (input[key].exit)
              results[concreteKey].exit.push(input[key].exit);
          }
        } else {
          if (typeof input[key] === 'function') {
            results[concreteKey] = {
              enter: [input[key]],
              exit: [],
            };
          } else {
            results[concreteKey] = {
              enter: input[key].enter ? [input[key].enter] : [],
              exit: input[key].exit ? [input[key].exit] : [],
            };
          }
        }
      }
    } else if (TYPES.has(key)) {
      if (key in results) {
        if (typeof input[key] === 'function') {
          results[key].enter.push(input[key]);
        } else {
          if (input[key].enter) results[key].enter.push(input[key].enter);
          if (input[key].exit) results[key].exit.push(input[key].exit);
        }
      } else {
        if (typeof input[key] === 'function') {
          results[key] = {
            enter: [input[key]],
            exit: [],
          };
        } else {
          results[key] = {
            enter: input[key].enter ? [input[key].enter] : [],
            exit: input[key].exit ? [input[key].exit] : [],
          };
        }
      }
    }
  }
  input._babel_walk_exploded = results;
  return results;
}
