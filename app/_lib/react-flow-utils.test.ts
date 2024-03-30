import { test } from "node:test";
import assert from "node:assert";
import { topologicalSort } from "./react-flow-utils";
import { Edge, Node } from "reactflow";

const nodeMaker = (id: string): Node => {
  return {
    id: id,
    position: { x: 0, y: 0 },
    data: {},
  };
};

const edgeMaker = (source: string, target: string): Edge => {
  return {
    id: `EDGE_${source}_${target}`,
    source,
    target,
  };
};

test("topologicalSort 1-2, 2-3, 2-4, 3-4, ", () => {
  const rootNode = nodeMaker("NODE_1");
  const inputNodes: Node[] = [
    rootNode,
    nodeMaker("NODE_2"),
    nodeMaker("NODE_3"),
    nodeMaker("NODE_4"),
  ];
  const inputEdges: Edge[] = [
    edgeMaker("NODE_1", "NODE_2"),
    edgeMaker("NODE_2", "NODE_3"),
    edgeMaker("NODE_2", "NODE_4"),
    edgeMaker("NODE_3", "NODE_4"),
  ];
  const sorted = topologicalSort(rootNode, inputNodes, inputEdges);
  assert.equal(
    true,
    sorted.findIndex((n) => n.id == "NODE_1") <
      sorted.findIndex((n) => n.id == "NODE_2")
  );
  assert.equal(
    true,
    sorted.findIndex((n) => n.id == "NODE_2") <
      sorted.findIndex((n) => n.id == "NODE_3")
  );
  assert.equal(
    true,
    sorted.findIndex((n) => n.id == "NODE_3") <
      sorted.findIndex((n) => n.id == "NODE_4")
  );
});

test("topologicalSort 1-4, 1-2, 2-3, 3-4", () => {
  const rootNode = nodeMaker("NODE_1");
  const inputNodes: Node[] = [
    rootNode,
    nodeMaker("NODE_2"),
    nodeMaker("NODE_3"),
    nodeMaker("NODE_4"),
  ];
  const inputEdges: Edge[] = [
    edgeMaker("NODE_1", "NODE_4"),
    edgeMaker("NODE_1", "NODE_2"),
    edgeMaker("NODE_2", "NODE_3"),
    edgeMaker("NODE_3", "NODE_4"),
  ];
  const sorted = topologicalSort(rootNode, inputNodes, inputEdges);
  assert.equal(
    true,
    sorted.findIndex((n) => n.id == "NODE_1") <
      sorted.findIndex((n) => n.id == "NODE_2")
  );
  assert.equal(
    true,
    sorted.findIndex((n) => n.id == "NODE_2") <
      sorted.findIndex((n) => n.id == "NODE_3")
  );
  assert.equal(
    true,
    sorted.findIndex((n) => n.id == "NODE_3") <
      sorted.findIndex((n) => n.id == "NODE_4")
  );
});
