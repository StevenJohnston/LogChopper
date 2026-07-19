'use client'

import { GroupData, GroupNodeType, GroupType } from "@/app/_components/FlowNodes/Group/GroupNodeTypes";
import useFlow, { MyNode, RFState } from "@/app/store/useFlow";
import useNodeStorage, { NodeStorageState } from "@/app/store/useNodeStorage";
import { ChangeEvent, useCallback, useEffect, useMemo } from "react";
import { NodeProps, NodeResizer, Edge, Node } from "reactflow";
import { shallow } from "zustand/shallow";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  updateEdge: state.updateEdge,
  updateNode: state.updateNode,
  flowInstance: state.reactFlowInstance
});

const nodeStorageSelector = (state: NodeStorageState) => ({
  savedGroups: state.savedGroups,
  saveGroup: state.saveGroup,
});

function GroupNode({ id, data }: NodeProps<GroupData>) {
  const { flowInstance, nodes, edges, updateNode } = useFlow(selector, shallow);
  const { savedGroups, saveGroup } = useNodeStorage(nodeStorageSelector, shallow)
  useEffect(() => {
    console.log("savedGroups", savedGroups)
  }, [savedGroups])

  const node: GroupNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == GroupType) {
        return n
      }
    }
  }, [id, nodes])

  const onSave = useCallback(() => {
    if (!flowInstance) return console.log("Error saving due to missing flowInstance")
    if (!node) return console.log(`Error saving group node: could not find node in store ${id}`)
    if (!node.data) return console.log("Error saving group node: Missing data")
    const saveNodes: Node[] = []
    const saveEdges: Edge[] = []
    saveNodes.push({
      ...node,
      data: node.data.getLoadable()
    })

    const interNodes: MyNode[] = flowInstance.getIntersectingNodes(
      node
    ) as MyNode[];

    const interNodeIds: Record<string, boolean> = {}

    for (const interNode of interNodes) {
      interNodeIds[interNode.id] = true
      saveNodes.push({
        ...interNode,
        data: interNode.data.getLoadable()
      })
    }

    for (const edge of edges) {
      if (interNodeIds[edge.source] && interNodeIds[edge.target]) {
        saveEdges.push(edge)
      }
    }
    saveGroup({ groupName: data.name, nodes: saveNodes as MyNode[], edges: saveEdges })
  }, [flowInstance, node, edges, id, data, saveGroup])

  const onCopyCreation = useCallback(() => {
    if (!flowInstance) return console.log("Error saving due to missing flowInstance")
    if (!node) return console.log(`Error saving group node: could not find node in store ${id}`)
    if (!node.data) return console.log("Error saving group node: Missing data")
    const saveNodes: Node[] = []
    const saveEdges: Edge[] = []
    saveNodes.push({
      ...node,
      data: node.data.getLoadable()
    })

    const interNodes: MyNode[] = flowInstance.getIntersectingNodes(
      node
    ) as MyNode[];

    const interNodeIds: Record<string, boolean> = {}

    for (const interNode of interNodes) {
      interNodeIds[interNode.id] = true
      if ("getLoadable" in interNode.data) {
        saveNodes.push({
          ...interNode,
          data: interNode.data.getLoadable()
        })
      } else {
        saveNodes.push(interNode)
      }
    }

    for (const edge of edges) {
      if (interNodeIds[edge.source] && interNodeIds[edge.target]) {
        saveEdges.push(edge)
      }
    }
    
    const savedGroup = { groupName: data.name, nodes: saveNodes as MyNode[], edges: saveEdges };
    const jsonStr = JSON.stringify(savedGroup, null, 2);
    
    const safeName = data.name.replace(/[^a-zA-Z0-9]/g, '');
    const componentName = safeName ? safeName.charAt(0).toUpperCase() + safeName.slice(1) : 'MyGroup';
    
    const fileContent = `import NodeSelectorButton from "@/app/_components/NodeSelector/NodeSelectorButton"
import useFlow, { MyNode, RFState } from "@/app/store/useFlow";
import { useCallback } from "react";
import { shallow } from "zustand/shallow";
import { SavedGroup, cloneSavedGroup } from "@/app/store/useNodeStorage";

const selector = (state: RFState) => ({
  reactFlowInstance: state.reactFlowInstance,
  updateNode: state.updateNode,
  addNode: state.addNode,
  addEdge: state.addEdge
});

const ${componentName} = () => {
  const { addNode, addEdge } = useFlow(selector, shallow);

  const onLoadSavedGroup = useCallback((savedGroup: SavedGroup) => {
    const newGroup = cloneSavedGroup(savedGroup)

    for (const node of newGroup.nodes) {
      addNode(node as MyNode)
    }
    for (const edge of newGroup.edges) {
      addEdge(edge)
    }
  }, [addNode, addEdge])

  return (
    <NodeSelectorButton
      onClick={() => {
        onLoadSavedGroup(savedGroup)
      }}
    >
      {\`${data.name}\`}
    </NodeSelectorButton>
  )
}

const savedGroup: SavedGroup = ${jsonStr};

export default ${componentName};
`;

    const command = `cat << 'EOF' > app/_components/NodeSelector/${componentName}.tsx
${fileContent}
EOF

# Add import and component to NodeSelector if not present
if ! grep -q "import ${componentName} from" app/_components/NodeSelector/NodeSelector.tsx; then
  sed -i '' 's|import MapAfrGroup|import ${componentName} from "@/app/_components/NodeSelector/${componentName}"\\nimport MapAfrGroup|g' app/_components/NodeSelector/NodeSelector.tsx
  sed -i '' 's|<MapAfrGroup />|<${componentName} />\\n          <MapAfrGroup />|g' app/_components/NodeSelector/NodeSelector.tsx
  echo "Added ${componentName}.tsx and updated NodeSelector.tsx"
else
  echo "Updated ${componentName}.tsx"
fi
`;

    navigator.clipboard.writeText(command);
    alert("Copied terminal command to clipboard!");
  }, [flowInstance, node, edges, id, data]);


  const onGroupNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    updateNode({ ...node, data: new GroupData({ ...node.data, name: event.target.value }) })
  }, [node, updateNode])

  if (!node) {
    return <div>Loading Group Node</div>
  }
  return (
    <>
      <NodeResizer color="red" minWidth={100} minHeight={100} handleStyle={{ width: 8, height: 8, borderRadius: 3, backgroundColor: "blue" }} />
      <div
        className={`drag-handle bg-gray-500/25 w-full h-full`}
      >

        <div
          className='flex justify-between'
        >
          {/* <div className='pr-2'>{data.name}</div> */}
          <input
            className={`focus:bg-transparent bg-inherit h-4 m-1`}
            type="text"
            value={data.name}
            onChange={onGroupNameChange}
          />
          <div>
            <button className='border rounded border-black p-1'
              onClick={onCopyCreation}
            >
              Copy Creation
            </button>
            <button className='border rounded border-black p-1'
              onClick={() => {
                updateNode({ ...node, data: new GroupData({ ...node.data, locked: !node.data.locked }) })
              }}
            >
              {data.locked ? "Locked" : "Unlocked"}
            </button>
            <button className='border rounded border-black p-1'
              onClick={onSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default GroupNode