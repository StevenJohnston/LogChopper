import test from 'node:test';
import assert from 'node:assert';
import { useLogColumns } from './useLogColumns';
import { DEFAULT_LOG_FIELDS } from '../_lib/log';

test('useLogColumns initialization and default columns', () => {
  const state = useLogColumns.getState();
  assert.ok(state.knownColumns.length >= DEFAULT_LOG_FIELDS.length);
  for (const field of DEFAULT_LOG_FIELDS) {
    assert.ok(state.knownColumns.includes(field), `knownColumns should include ${field}`);
    assert.strictEqual(state.isColumnVisible(field), true, `${field} should default to visible`);
  }
});

test('useLogColumns toggleColumn and visibility', () => {
  const state = useLogColumns.getState();
  const testCol = 'RPM';

  // Toggle off
  state.toggleColumn(testCol);
  assert.strictEqual(useLogColumns.getState().isColumnVisible(testCol), false);

  // Toggle on
  state.toggleColumn(testCol);
  assert.strictEqual(useLogColumns.getState().isColumnVisible(testCol), true);
});

test('useLogColumns registerDiscoveredColumns adds new columns and defaults them to visible', () => {
  const customCol = 'CustomField_' + Date.now();
  const state = useLogColumns.getState();

  assert.strictEqual(state.knownColumns.includes(customCol), false);

  state.registerDiscoveredColumns([customCol]);
  const updatedState = useLogColumns.getState();
  assert.strictEqual(updatedState.knownColumns.includes(customCol), true);
  assert.strictEqual(updatedState.isColumnVisible(customCol), true);
});

test('useLogColumns selectAll, deselectAll, and resetToDefault', () => {
  const state = useLogColumns.getState();

  state.deselectAll();
  const deselectedState = useLogColumns.getState();
  assert.strictEqual(deselectedState.isColumnVisible('RPM'), false);
  assert.strictEqual(deselectedState.isColumnVisible('AFR'), false);

  state.selectAll();
  const selectedState = useLogColumns.getState();
  assert.strictEqual(selectedState.isColumnVisible('RPM'), true);
  assert.strictEqual(selectedState.isColumnVisible('AFR'), true);

  state.toggleColumn('RPM');
  assert.strictEqual(useLogColumns.getState().isColumnVisible('RPM'), false);

  state.resetToDefault();
  const resetState = useLogColumns.getState();
  assert.strictEqual(resetState.isColumnVisible('RPM'), true);
});

test('useLogColumns moveColumn and reorderColumns', () => {
  const state = useLogColumns.getState();
  state.resetToDefault();

  const initialFirst = useLogColumns.getState().knownColumns[0];
  const initialSecond = useLogColumns.getState().knownColumns[1];

  // Move initialFirst after initialSecond
  state.moveColumn(initialFirst, initialSecond);
  const reorderedState = useLogColumns.getState();
  assert.strictEqual(reorderedState.knownColumns[0], initialSecond);
  assert.strictEqual(reorderedState.knownColumns[1], initialFirst);

  // Reorder index 1 back to index 0
  state.reorderColumns(1, 0);
  const restoredState = useLogColumns.getState();
  assert.strictEqual(restoredState.knownColumns[0], initialFirst);
  assert.strictEqual(restoredState.knownColumns[1], initialSecond);
});
