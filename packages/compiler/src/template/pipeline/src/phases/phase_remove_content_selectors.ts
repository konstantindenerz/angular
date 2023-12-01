/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ir from '../../ir';
import type {CompilationJob} from '../compilation';
import {createOpXrefMap} from '../util/elements';

/**
 * Attributes of `ng-content` named 'select' are specifically removed, because they control which
 * content matches as a property of the `projection`, and are not a plain attribute.
 */
export function removeContentSelectors(job: CompilationJob): void {
  for (const unit of job.units) {
    const elements = createOpXrefMap(unit);
    for (const op of unit.ops()) {
      switch (op.kind) {
        case ir.OpKind.Binding:
          const target = lookupInXrefMap(elements, op.target);
          if (isSelectAttribute(op.name) && target.kind === ir.OpKind.Projection) {
            ir.OpList.remove<ir.UpdateOp>(op);
          }
          break;
        case ir.OpKind.Projection:
          // op.attributes is an array of [attr1-name, attr1-value, attr2-name, attr2-value, ...],
          // find the "select" attribute and remove its name and corresponding value.
          for (let i = op.attributes.length - 2; i >= 0; i -= 2) {
            if (isSelectAttribute(op.attributes[i])) {
              op.attributes.splice(i, 2);
            }
          }
          break;
      }
    }
  }
}

function isSelectAttribute(name: string) {
  return name.toLowerCase() === 'select';
}

/**
 * Looks up an element in the given map by xref ID.
 */
function lookupInXrefMap(map: Map<ir.XrefId, ir.ConsumesSlotOpTrait&ir.CreateOp>, xref: ir.XrefId):
    ir.ConsumesSlotOpTrait&ir.CreateOp {
  const el = map.get(xref);
  if (el === undefined) {
    throw new Error('All attributes should have an slottable target.');
  }
  return el;
}
