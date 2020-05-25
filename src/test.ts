import * as t from '@babel/types';
import {ancestor} from './';

ancestor({})(t.program([]), undefined);
ancestor({
  Function(node) {
    console.info(node);
  },
})(t.program([]), undefined);

ancestor<string>({
  Function(node, state) {
    console.info(node, state);
  },
})(t.program([]), 'hello world');
