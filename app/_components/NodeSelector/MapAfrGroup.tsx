import NodeSelectorButton from "@/app/_components/NodeSelector/NodeSelectorButton"
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

const MapAfrGroup = () => {
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
      {`MAP AFR Group`}
    </NodeSelectorButton>
  )
}

const savedGroup: SavedGroup = {
  "groupName": "Stock MAP AFR Fix",
  "nodes": [
    {
      "position": {
        "x": -461.76751356471095,
        "y": 201.62875329042782
      },
      "id": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55",
      "type": "GroupNode",
      "data": {
        "name": "Stock MAP AFR Fix",
        "locked": false
      },
      "style": {
        "width": 2872,
        "height": 808,
        "zIndex": -1
      },
      "width": 2872,
      "height": 808,
      "selected": true,
      "positionAbsolute": {
        "x": -461.76751356471095,
        "y": 201.62875329042782
      },
      "dragging": false,
      "resizing": false
    },
    {
      "id": "35ae8ac3-ee61-4003-88af-de71fe51aec6",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "High Octane Fuel Map"
      },
      "position": {
        "x": 79.41820997460559,
        "y": 550.3309805281074
      },
      "dragHandle": ".drag-handle",
      "width": 113,
      "height": 42,
      "positionAbsolute": {
        "x": -382.34930359010536,
        "y": 751.9597338185351
      },
      "dragging": false,
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55"
    },
    {
      "id": "19513773-b112-43b3-a91e-bde5f09b6d70",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "MAP based Load Calc #2 - Cold/Interpolated"
      },
      "position": {
        "x": 30.415027071725717,
        "y": 385.78039049106286
      },
      "dragHandle": ".drag-handle",
      "width": 381,
      "height": 50,
      "selected": false,
      "positionAbsolute": {
        "x": -431.35248649298524,
        "y": 587.4091437814907
      },
      "dragging": false,
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55"
    },
    {
      "id": "0ce0feb8-b09a-4ec1-b10a-673d790714c3",
      "type": "CombineAdvancedTableNode",
      "position": {
        "x": 516.9353323579269,
        "y": 457.6132960604284
      },
      "data": {
        "matchCriteria": [
          {
            "sourceSourceField": "XAxis",
            "destSourceField": "Value"
          },
          {
            "sourceSourceField": "YAxis",
            "destSourceField": "YAxis"
          }
        ]
      },
      "width": 587,
      "height": 180,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 55.16781879321593,
        "y": 659.2420493508562
      },
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55"
    },
    {
      "id": "ea87ab22-3afe-41e7-842b-a9d20ff651c8",
      "type": "BaseLogNode",
      "position": {
        "x": 54.49010215096473,
        "y": 47.58454532905341
      },
      "data": {},
      "width": 323,
      "height": 74,
      "positionAbsolute": {
        "x": -407.2774114137462,
        "y": 249.21329861948124
      },
      "dragging": false,
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55"
    },
    {
      "id": "e0d35dfc-3c78-401c-b9db-15d8f96d61cf",
      "type": "LogFilterNode",
      "position": {
        "x": 454.78604255216237,
        "y": 52.88666844167983
      },
      "data": {
        "func": "IPW>0"
      },
      "width": 201,
      "height": 102,
      "dragging": false,
      "positionAbsolute": {
        "x": -6.981471012548582,
        "y": 254.51542173210765
      },
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55",
      "selected": false
    },
    {
      "id": "02008c93-f04e-4855-8f31-a63871f0812e",
      "type": "LogAlterNode",
      "position": {
        "x": 459.89331512724993,
        "y": 189.67467155681106
      },
      "data": {
        "func": "AFR*(1-(CurrentLTFT+STFT)/100)",
        "newLogField": "AFRNEW"
      },
      "width": 201,
      "height": 154,
      "dragging": false,
      "positionAbsolute": {
        "x": -1.8741984374610183,
        "y": 391.3034248472389
      },
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55",
      "selected": false
    },
    {
      "id": "edc45b0e-eebc-46be-ad8f-6072f4f75881",
      "type": "FillLogTableNode",
      "position": {
        "x": 799.38034778426,
        "y": 253.4309322314952
      },
      "data": {
        "weighted": true
      },
      "width": 178,
      "height": 79,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 337.6128342195491,
        "y": 455.05968552192303
      },
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55"
    },
    {
      "id": "7dc52a9d-195b-4cf3-9c93-fd4fd8e5059f",
      "type": "FillTableNode",
      "position": {
        "x": 1407.9042933110225,
        "y": 212.12662177058075
      },
      "data": {
        "logField": "AFRNEW",
        "aggregator": "AVG"
      },
      "width": 299,
      "height": 119,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 946.1367797463115,
        "y": 413.7553750610086
      },
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55"
    },
    {
      "id": "30704095-c5fe-4a67-8927-de23b03b1265",
      "type": "CombineNode",
      "position": {
        "x": 1406.8014899691452,
        "y": 485.2247764443858
      },
      "data": {
        "func": "(sourceTable[y][x]/joinTable[y][x]) || 1"
      },
      "width": 511,
      "height": 104,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 945.0339764044343,
        "y": 686.8535297348136
      },
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55"
    },
    {
      "id": "066eb48c-c353-454d-a012-4551cc134668",
      "type": "FillTableNode",
      "position": {
        "x": 1423.3082286032861,
        "y": 51.863649006799136
      },
      "data": {
        "logField": "weight",
        "aggregator": "AVG"
      },
      "width": 299,
      "height": 119,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 961.5407150385752,
        "y": 253.49240229722696
      },
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55"
    },
    {
      "id": "861fcdb5-baa5-4f51-9e49-fca03eac3f4a",
      "type": "CombineNode",
      "position": {
        "x": 2044.824598226815,
        "y": 59.86428690805013
      },
      "data": {
        "func": "diff = joinTable[y][x] - 1;\nweight = sourceTable[y][x];\nnewDiff = 1 + (diff * weight);\nk=25;\nsigmoidWeight = 1 / (1 + exp(-k*(weight - 0.1)));\n1 + (diff*sigmoidWeight); \n"
      },
      "width": 202,
      "height": 104,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1583.057084662104,
        "y": 261.49304019847796
      },
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55"
    },
    {
      "id": "670bcafe-aebb-4751-a186-00c0a6ab4d14",
      "type": "CombineNode",
      "position": {
        "x": 2257.466074001923,
        "y": 417.6848149876809
      },
      "data": {
        "func": "sourceTable[y][x] * joinTable[y][x]"
      },
      "width": 511,
      "height": 104,
      "selected": false,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1795.698560437212,
        "y": 619.3135682781087
      },
      "parentNode": "68bbb4e2-70e0-4ece-8c6d-63c536aa6e55"
    }
  ],
  "edges": [
    {
      "source": "edc45b0e-eebc-46be-ad8f-6072f4f75881",
      "target": "7dc52a9d-195b-4cf3-9c93-fd4fd8e5059f",
      "sourceHandle": "3D#TableOut",
      "id": "reactflow__edge-f93a9166-c478-49f8-9694-cd9262f221d83D#TableOut-d6929c8c-e9c9-4b37-8bf6-46f414b6c8393D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "ea87ab22-3afe-41e7-842b-a9d20ff651c8",
      "target": "e0d35dfc-3c78-401c-b9db-15d8f96d61cf",
      "sourceHandle": "Log#LogOut",
      "id": "reactflow__edge-00fbfe29-f61d-4b08-92c5-542729437c8fLog#LogOut-aff427cb-8f40-4218-abf4-e1a984df3434Log#LogTarget",
      "targetHandle": "Log#LogTarget"
    },
    {
      "source": "e0d35dfc-3c78-401c-b9db-15d8f96d61cf",
      "target": "02008c93-f04e-4855-8f31-a63871f0812e",
      "sourceHandle": "Log#LogSource",
      "id": "reactflow__edge-aff427cb-8f40-4218-abf4-e1a984df3434Log#LogSource-dca583d5-4ca8-40ce-a183-36dc855e88ddLog#LogTarget",
      "targetHandle": "Log#LogTarget"
    },
    {
      "source": "02008c93-f04e-4855-8f31-a63871f0812e",
      "sourceHandle": "Log#LogSource",
      "target": "edc45b0e-eebc-46be-ad8f-6072f4f75881",
      "targetHandle": "Log#LogIn",
      "id": "reactflow__edge-dca583d5-4ca8-40ce-a183-36dc855e88ddLog#LogSource-f93a9166-c478-49f8-9694-cd9262f221d8Log#LogIn"
    },
    {
      "source": "35ae8ac3-ee61-4003-88af-de71fe51aec6",
      "sourceHandle": "3D#TableOut",
      "target": "0ce0feb8-b09a-4ec1-b10a-673d790714c3",
      "targetHandle": "3D#SourceHandle",
      "id": "reactflow__edge-93f7c06f-d71e-4f1c-9563-97131c19395c3D#TableOut-293f6a49-b52a-4531-9aed-d6a69744372f3D#SourceHandle"
    },
    {
      "source": "0ce0feb8-b09a-4ec1-b10a-673d790714c3",
      "sourceHandle": "3D#TableOut",
      "target": "30704095-c5fe-4a67-8927-de23b03b1265",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-293f6a49-b52a-4531-9aed-d6a69744372f3D#TableOut-967f9c71-f642-44ea-b3f2-073da51c8f993D#TableIn2"
    },
    {
      "source": "edc45b0e-eebc-46be-ad8f-6072f4f75881",
      "target": "066eb48c-c353-454d-a012-4551cc134668",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-56798608-e719-4b26-997c-59f02ca77f6b3D#TableOut-5fbb7c29-dce3-4ce1-9af3-4861ae18ada43D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "7dc52a9d-195b-4cf3-9c93-fd4fd8e5059f",
      "sourceHandle": "3D#TableOut",
      "target": "30704095-c5fe-4a67-8927-de23b03b1265",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-3b47a710-fb80-418a-a2e7-ca4f117031743D#TableOut-605a3e9e-a32f-4568-aa75-154ab59e080f3D#TableIn1"
    },
    {
      "source": "066eb48c-c353-454d-a012-4551cc134668",
      "target": "861fcdb5-baa5-4f51-9e49-fca03eac3f4a",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-5fbb7c29-dce3-4ce1-9af3-4861ae18ada43D#TableOut-b052854c-4147-4e7b-9837-c0c125a4e5e43D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "30704095-c5fe-4a67-8927-de23b03b1265",
      "sourceHandle": "3D#TableOut",
      "target": "861fcdb5-baa5-4f51-9e49-fca03eac3f4a",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-605a3e9e-a32f-4568-aa75-154ab59e080f3D#TableOut-b052854c-4147-4e7b-9837-c0c125a4e5e43D#TableIn2"
    },
    {
      "source": "19513773-b112-43b3-a91e-bde5f09b6d70",
      "sourceHandle": "3D#TableOut",
      "target": "edc45b0e-eebc-46be-ad8f-6072f4f75881",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-7a9fc3c1-9df5-4aa8-a2aa-87d75290ffca3D#TableIn"
    },
    {
      "source": "19513773-b112-43b3-a91e-bde5f09b6d70",
      "sourceHandle": "3D#TableOut",
      "target": "0ce0feb8-b09a-4ec1-b10a-673d790714c3",
      "targetHandle": "3D#DestHandle",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-2e59aea2-e109-4a62-80b4-38f458f31e3a3D#DestHandle"
    },
    {
      "source": "19513773-b112-43b3-a91e-bde5f09b6d70",
      "sourceHandle": "3D#TableOut",
      "target": "670bcafe-aebb-4751-a186-00c0a6ab4d14",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-ae1456d7-470d-4619-9976-c3656a9c21523D#TableIn1"
    },
    {
      "source": "861fcdb5-baa5-4f51-9e49-fca03eac3f4a",
      "sourceHandle": "3D#TableOut",
      "target": "670bcafe-aebb-4751-a186-00c0a6ab4d14",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-562df65f-a83d-43b3-b72a-bfa205ba2f633D#TableOut-ae1456d7-470d-4619-9976-c3656a9c21523D#TableIn2"
    }
  ]
}

export default MapAfrGroup