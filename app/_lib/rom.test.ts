import { test } from "node:test";
import assert from "node:assert";
import { getIndexFloat } from "@/app/_lib/rom";

test("getIndexFloat low", () => {
  const arr = [0, 10, 20];
  const val = 3;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 0.3);
});

test("getIndexFloat middle", () => {
  const arr = [0, 10, 20, 30];
  const val = 15;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 1.5);
});
test("getIndexFloat high", () => {
  const arr = [0, 10, 20, 30];
  const val = 27;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 2.7);
});

test("getIndexFloat exact lower bound", () => {
  const arr = [0, 10, 20, 30];
  const val = 0;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 0);
});

test("getIndexFloat exact middle", () => {
  const arr = [0, 10, 20, 30];
  const val = 10;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 1);
});

test("getIndexFloat exact upper bound", () => {
  const arr = [0, 10, 20, 30];
  const val = 30;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 3);
});

test("getIndexFloat index lower bound", () => {
  const arr = [0, 10, 20];
  const val = -3;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 0);
});

test("getIndexFloat index upper bound", () => {
  const arr = [0, 10, 20];
  const val = 30;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 2);
});
