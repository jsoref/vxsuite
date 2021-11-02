/* eslint-disable no-bitwise */
import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree,
} from '@typescript-eslint/experimental-utils';
import { strict as assert } from 'assert';
import * as ts from 'typescript';
import { createRule, getCollectionType } from '../util';

function isIterableType(type: ts.Type): boolean {
  return type.getProperties().some((p) => p.getName() === '__@iterator');
}

function isObjectType(type: ts.Type): boolean {
  if (type.isUnion()) {
    return type.types.every((subtype) => isObjectType(subtype));
  }

  if (type.isIntersection()) {
    return type.types.some((subtype) => isObjectType(subtype));
  }

  const flags = type.getFlags();

  return (
    (flags & ts.TypeFlags.Object) === ts.TypeFlags.Object ||
    (flags & ts.TypeFlags.NonPrimitive) === ts.TypeFlags.NonPrimitive
  );
}

export default createRule({
  name: 'gts-spread-like-types',
  meta: {
    docs: {
      description:
        'Requires spreading iterables in arrays and objects in objects',
      category: 'Best Practices',
      recommended: 'error',
      suggestion: false,
      requiresTypeChecking: true,
    },
    messages: {
      requireIterablesInArraySpread: 'Only iterables may be spread into arrays',
      requireObjectsInObjectSpread: 'Only objects may be spread into objects',
      requireIterablesInCallSpread:
        'Only iterables may be spread into arguments',
    },
    schema: [],
    type: 'problem',
  },
  defaultOptions: [],

  create(context) {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    return {
      SpreadElement(node: TSESTree.SpreadElement): void {
        assert(node.parent);

        const spreadArgumentNode = parserServices.esTreeNodeToTSNodeMap.get(
          node.argument
        );
        const spreadArgumentType =
          checker.getTypeAtLocation(spreadArgumentNode);

        switch (node.parent.type) {
          case AST_NODE_TYPES.CallExpression:
          case AST_NODE_TYPES.ArrayExpression: {
            const isIterable = isIterableType(spreadArgumentType);
            if (!isIterable) {
              context.report({
                messageId:
                  node.parent.type === AST_NODE_TYPES.ArrayExpression
                    ? 'requireIterablesInArraySpread'
                    : 'requireIterablesInCallSpread',
                node,
              });
            }
            break;
          }

          case AST_NODE_TYPES.ObjectExpression: {
            const isObject = isObjectType(spreadArgumentType);
            const isCollection =
              isObject && getCollectionType(checker, spreadArgumentNode);

            if (!isObject || isCollection) {
              context.report({
                messageId: 'requireObjectsInObjectSpread',
                node,
              });
            }
            break;
          }

          default:
            throw new Error(
              `unexpected spread element parent: ${node.parent.type}`
            );
        }
      },
    };
  },
});
