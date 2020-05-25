import * as t from '@babel/types';
import explode from './explode';

export type NodeType<type extends string> = type extends keyof t.Aliases
  ? t.Aliases[type]
  : Extract<t.Node, {type: type}>;

export type SimpleFunction<TKey extends string, TState> = (
  node: NodeType<TKey>,
  state: TState,
) => void;
export function simple<TState>(
  node: t.Node,
  visitors: {
    [key in keyof t.Aliases | t.Node['type']]?:
      | SimpleFunction<key, TState>
      | {
          enter?: SimpleFunction<key, TState>;
          exit?: SimpleFunction<key, TState>;
        };
  },
  state: TState,
) {
  const vis = explode(visitors);
  (function recurse(node) {
    if (!node) return;

    const visitor = vis[node.type];

    if (visitor?.enter) {
      for (const v of visitor.enter) {
        v(node, state);
      }
    }

    for (const key of (t as any).VISITOR_KEYS[node.type] || []) {
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
}

export type AncestorFunction<TKey extends string, TState> = (
  node: NodeType<TKey>,
  state: TState,
  ancestors: t.Node[],
) => void;
export function ancestor<TState>(
  node: t.Node,
  visitors: {
    [key in keyof t.Aliases | t.Node['type']]?:
      | AncestorFunction<key, TState>
      | {
          enter?: AncestorFunction<key, TState>;
          exit?: AncestorFunction<key, TState>;
        };
  },
  state: TState,
) {
  const vis = explode(visitors);
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

    for (const key of (t as any).VISITOR_KEYS[node.type] || []) {
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
}

export function recursive<TState>(
  node: t.Node,
  visitors: {
    [key in keyof t.Aliases | t.Node['type']]?: (
      node: NodeType<key>,
      state: TState,
      recurse: (node: t.Node) => void,
    ) => void;
  },
  state: TState,
) {
  const vis = explode(visitors);
  (function recurse(node: t.Node) {
    if (!node) return;

    const visitor = vis[node.type];
    if (visitor?.enter) {
      for (const v of visitor.enter) {
        v(node, state, recurse);
      }
    } else {
      for (const key of (t as any).VISITOR_KEYS[node.type] || []) {
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
}
