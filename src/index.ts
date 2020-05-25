import * as t from '@babel/types';
import explode from './explode';

const VISITOR_KEYS: {[key: string]: string[]} = (t as any).VISITOR_KEYS;
if (
  !(
    VISITOR_KEYS &&
    // tslint:disable-next-line: strict-type-predicates
    typeof VISITOR_KEYS === 'object' &&
    Object.keys(VISITOR_KEYS).every(
      (key) =>
        Array.isArray(VISITOR_KEYS[key]) &&
        // tslint:disable-next-line: strict-type-predicates
        VISITOR_KEYS[key].every((v) => typeof v === 'string'),
    )
  )
) {
  throw new Error(
    '@babel/types VISITOR_KEYS does not match the expected type.',
  );
}

export type NodeType<type extends string> = type extends keyof t.Aliases
  ? t.Aliases[type]
  : Extract<t.Node, {type: type}>;

export type SimpleFunction<TKey extends string, TState> = (
  node: NodeType<TKey>,
  state: TState,
) => void;

export type SimpleVisitors<TState = void> = {
  [key in keyof t.Aliases | t.Node['type']]?:
    | SimpleFunction<key, TState>
    | {
        enter?: SimpleFunction<key, TState>;
        exit?: SimpleFunction<key, TState>;
      };
};

export function simple<TState = void>(visitors: SimpleVisitors<TState>) {
  const vis = explode(visitors);
  return (node: t.Node, state: TState) => {
    (function recurse(node) {
      if (!node) return;

      const visitor = vis[node.type];

      if (visitor?.enter) {
        for (const v of visitor.enter) {
          v(node, state);
        }
      }

      for (const key of VISITOR_KEYS[node.type] || []) {
        const subNode = (node as any)[key];
        if (Array.isArray(subNode)) {
          for (const subSubNode of subNode) {
            recurse(subSubNode);
          }
        } else {
          recurse(subNode);
        }
      }

      if (visitor?.exit) {
        for (const v of visitor.exit) {
          v(node, state);
        }
      }
    })(node);
  };
}

export type AncestorFunction<TKey extends string, TState> = (
  node: NodeType<TKey>,
  state: TState,
  ancestors: t.Node[],
) => void;

export type AncestorVisitor<TState = void> = {
  [key in keyof t.Aliases | t.Node['type']]?:
    | AncestorFunction<key, TState>
    | {
        enter?: AncestorFunction<key, TState>;
        exit?: AncestorFunction<key, TState>;
      };
};

export function ancestor<TState = void>(visitors: AncestorVisitor<TState>) {
  const vis = explode(visitors);
  return (node: t.Node, state: TState) => {
    const ancestors: t.Node[] = [];

    (function recurse(node) {
      if (!node) return;

      const visitor = vis[node.type];

      const isNew = node !== ancestors[ancestors.length - 1];
      if (isNew) ancestors.push(node);

      if (visitor?.enter) {
        for (const v of visitor.enter) {
          v(node, state, ancestors);
        }
      }

      for (const key of VISITOR_KEYS[node.type] || []) {
        const subNode = (node as any)[key];
        if (Array.isArray(subNode)) {
          for (const subSubNode of subNode) {
            recurse(subSubNode);
          }
        } else {
          recurse(subNode);
        }
      }

      if (visitor?.exit) {
        for (const v of visitor.exit) {
          v(node, state, ancestors);
        }
      }

      if (isNew) ancestors.pop();
    })(node);
  };
}

export type RecursiveVisitors<TState = void> = {
  [key in keyof t.Aliases | t.Node['type']]?: (
    node: NodeType<key>,
    state: TState,
    recurse: (node: t.Node) => void,
  ) => void;
};

export function recursive<TState = void>(visitors: RecursiveVisitors<TState>) {
  const vis = explode(visitors);
  return (node: t.Node, state: TState) => {
    (function recurse(node: t.Node) {
      if (!node) return;

      const visitor = vis[node.type];
      if (visitor?.enter) {
        for (const v of visitor.enter) {
          v(node, state, recurse);
        }
      } else {
        for (const key of VISITOR_KEYS[node.type] || []) {
          const subNode = (node as any)[key];
          if (Array.isArray(subNode)) {
            for (const subSubNode of subNode) {
              recurse(subSubNode);
            }
          } else {
            recurse(subNode);
          }
        }
      }
    })(node);
  };
}
