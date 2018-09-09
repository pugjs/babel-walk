import * as t from '@babel/types';
import {explode} from './explode.js';

export function simple(node, visitors, state) {
  if (!node) return;

  visitors = explode(visitors);

  (function c(node) {
    if (!node) return;

    const {enter, exit} = visitors[node.type] || {};

    if (enter) {
      for (const visitor of enter) {
        visitor(node, state);
      }
    }

    for (const key of t.VISITOR_KEYS[node.type] || []) {
      const subNode = node[key];
      if (Array.isArray(subNode)) {
        for (const subSubNode of subNode) {
          c(subSubNode);
        }
      } else {
        c(subNode);
      }
    }

    if (exit) {
      for (const visitor of exit) {
        visitor(node, state);
      }
    }
  })(node);
}

export function ancestor(node, visitors, state) {
  if (!node) return;

  visitors = explode(visitors);
  const ancestors = [];

  (function c(node) {
    if (!node) return;

    const {enter, exit} = visitors[node.type] || {};

    const isNew = node !== ancestors[ancestors.length - 1];
    if (isNew) ancestors.push(node);

    if (enter) {
      for (const visitor of enter) {
        visitor(node, state || ancestors, ancestors);
      }
    }

    for (const key of t.VISITOR_KEYS[node.type] || []) {
      const subNode = node[key];
      if (Array.isArray(subNode)) {
        for (const subSubNode of subNode) {
          c(subSubNode);
        }
      } else {
        c(subNode);
      }
    }

    if (exit) {
      for (const visitor of exit) {
        visitor(node, state || ancestors, ancestors);
      }
    }

    if (isNew) ancestors.pop();
  })(node);
}

export function recursive(node, visitors, state) {
  if (!node) return;

  visitors = explode(visitors);

  (function c(node) {
    if (!node) return;

    const {enter} = visitors[node.type] || {};

    if (enter && enter.length) {
      for (const visitor of enter) {
        visitor(node, state, c);
      }
    } else {
      for (const key of t.VISITOR_KEYS[node.type] || []) {
        const subNode = node[key];
        if (Array.isArray(subNode)) {
          for (const subSubNode of subNode) {
            c(subSubNode);
          }
        } else {
          c(subNode);
        }
      }
    }
  })(node);
}
