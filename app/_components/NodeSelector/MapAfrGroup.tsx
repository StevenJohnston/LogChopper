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
  "groupName": "Stock Map Fix Via Fuel table",
  "nodes": [
    {
      "position": {
        "x": -3.767513564710953,
        "y": 148.62875329042782
      },
      "id": "17b72831-8716-4f87-ae06-14be3598151d",
      "type": "GroupNode",
      "data": {
        "name": "Stock Map Fix Via Fuel table",
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
        "x": -3.767513564710953,
        "y": 148.62875329042782
      },
      "dragging": false,
      "resizing": false
    },
    {
      "id": "686211df-7a6e-441a-8503-05e880518234",
      "type": "BaseLogNode",
      "position": {
        "x": 54.49010215096473,
        "y": 47.58454532905341
      },
      "data": {},
      "width": 161,
      "height": 50,
      "positionAbsolute": {
        "x": 50.72258858625378,
        "y": 196.21329861948124
      },
      "dragging": false,
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "position": {
        "x": 109.85036600565923,
        "y": 133.62075193554773
      },
      "id": "0e75875b-59a7-4176-a609-9293bd676813",
      "type": "RunningLogAlterNode",
      "data": {
        "newFieldName": "AFR",
        "untilFunc": "reduced = accumulator + currentLogRecord.RPM * pow(currentLogRecord.Load + 30, 1.4);\n[reduced > 2500000, reduced];",
        "alterFunc": "currentLogRecord.AFR"
      },
      "width": 402,
      "height": 296,
      "positionAbsolute": {
        "x": 106.08285244094827,
        "y": 282.24950522597555
      },
      "dragging": false,
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "b7678b3a-bfe2-4f4a-9ba7-f8f1816b0523",
      "type": "LogFilterNode",
      "position": {
        "x": 590.7251403961668,
        "y": 35.085119914488814
      },
      "data": {
        "func": "IPW>0 and AFR>0 and ECT>75"
      },
      "width": 259,
      "height": 134,
      "dragging": false,
      "positionAbsolute": {
        "x": 586.9576268314559,
        "y": 183.71387320491664
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "57c02b59-5934-454f-8dc6-04956cb663b4",
      "type": "LogAlterNode",
      "position": {
        "x": 874.1838990327872,
        "y": 35.93402518561561
      },
      "data": {
        "func": "AFR*(1-(CurrentLTFT+STFT)/100)",
        "newLogField": "AFRNEW"
      },
      "width": 211,
      "height": 170,
      "dragging": false,
      "positionAbsolute": {
        "x": 870.4163854680762,
        "y": 184.56277847604343
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "b0d7f5a4-23cd-4fb9-892e-b9c55fba6571",
      "type": "BaseRomNode",
      "data": {},
      "position": {
        "x": 33.837100303113516,
        "y": 448.8098817298566
      },
      "dragHandle": ".drag-handle",
      "width": 647,
      "height": 74,
      "selected": false,
      "positionAbsolute": {
        "x": 30.069586738402563,
        "y": 597.4386350202844
      },
      "dragging": true,
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "a4430e27-d789-4270-acee-b1d64f2d4d10",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "MAP based Load Calc #2 - Cold/Interpolated",
        "tableType": "3D"
      },
      "position": {
        "x": 55.63820477348281,
        "y": 649.2064289038337
      },
      "dragHandle": ".drag-handle",
      "width": 381,
      "height": 50,
      "selected": false,
      "positionAbsolute": {
        "x": 51.87069120877186,
        "y": 797.8351821942615
      },
      "dragging": false,
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "bddb466d-4294-48ac-8f5c-760680e53e25",
      "type": "FillLogTableNode",
      "position": {
        "x": 839.838412618785,
        "y": 246.95764185797117
      },
      "data": {
        "weighted": true
      },
      "width": 506,
      "height": 79,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 836.0708990540741,
        "y": 395.586395148399
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "beac6b70-34ad-40c7-b3f6-4f7311a16684",
      "type": "FillTableNode",
      "position": {
        "x": 1405.6068966010287,
        "y": 352.26782108021905
      },
      "data": {
        "logField": "AFRNEW",
        "aggregator": "AVG",
        "tableType": "3D"
      },
      "width": 474,
      "height": 119,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1401.8393830363177,
        "y": 500.8965743706469
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "3a4aaf56-ab88-4ca1-86e3-3887e4f6d267",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "High Octane Fuel Map",
        "tableType": "3D"
      },
      "position": {
        "x": 62.2866452397534,
        "y": 730.5318599025727
      },
      "dragHandle": ".drag-handle",
      "width": 219,
      "height": 50,
      "positionAbsolute": {
        "x": 58.519131675042445,
        "y": 879.1606131930005
      },
      "dragging": false,
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d",
      "selected": false
    },
    {
      "id": "c923c12c-b0ad-4079-b1b5-d57c39b0fd1e",
      "type": "CombineAdvancedTableNode",
      "position": {
        "x": 552.5384294123089,
        "y": 535.2927805427166
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
        ],
        "tableType": "3D"
      },
      "width": 587,
      "height": 179,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 548.770915847598,
        "y": 683.9215338331444
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "f0382751-b96d-4592-bff9-a357726508bb",
      "type": "FillTableNode",
      "position": {
        "x": 1473.7198218649987,
        "y": 17.565166356770902
      },
      "data": {
        "logField": "LogID",
        "aggregator": "COUNT",
        "tableType": "3D"
      },
      "width": 474,
      "height": 119,
      "positionAbsolute": {
        "x": 1469.9523083002878,
        "y": 166.19391964719873
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "56ecbe4c-5c77-47bd-8873-81ecee6f34f2",
      "type": "FillTableNode",
      "position": {
        "x": 1452.3005870521297,
        "y": 189.9955101361884
      },
      "data": {
        "logField": "weight",
        "aggregator": "AVG",
        "tableType": "3D"
      },
      "width": 474,
      "height": 119,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1448.5330734874187,
        "y": 338.6242634266162
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "520be08d-b759-40f0-8dff-c5d957a233e9",
      "type": "CombineNode",
      "position": {
        "x": 1378.8014899691452,
        "y": 541.2247764443857
      },
      "data": {
        "func": "(sourceTable[y][x]/joinTable[y][x])",
        "tableType": "3D"
      },
      "width": 511,
      "height": 100,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1375.0339764044343,
        "y": 689.8535297348135
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "2799c518-5b82-400f-8ab3-187e34bae0b1",
      "type": "CombineNode",
      "position": {
        "x": 2009.9224251550045,
        "y": 98.10605484175016
      },
      "data": {
        "func": "sourceTable[y][x] > 10 ? joinTable[y][x] : 0",
        "tableType": "3D"
      },
      "width": 511,
      "height": 100,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 2006.1549115902935,
        "y": 246.734808132178
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    },
    {
      "id": "49118298-7b96-4272-836d-ee6fa1d74c9c",
      "type": "CombineNode",
      "position": {
        "x": 2306.6095790904706,
        "y": 289.74089568488597
      },
      "data": {
        "func": "diff = 1-joinTable[y][x];\nweight = sourceTable[y][x];\n1 + diff * weight;\nk = 20;\nnewWeight = weight   / (1 + exp(-k * (weight  - 0.1)));\nsuperWeight = 1-(1-newWeight )^10;\nnewDiff = 1 - superWeight * diff;\nnewDiff < 0.9 ? 0.9 : (newDiff > 1.1 ? 1.1: newDiff)",
        "tableType": "3D"
      },
      "width": 511,
      "height": 268,
      "positionAbsolute": {
        "x": 2302.8420655257596,
        "y": 438.3696489753138
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "328b260c-d42d-48fa-ab5c-6b0e9e6804bf",
      "type": "CombineNode",
      "position": {
        "x": 2243.321053916706,
        "y": 606.2609320471711
      },
      "data": {
        "func": "sourceTable[y][x] * joinTable[y][x]",
        "tableType": "3D"
      },
      "width": 511,
      "height": 100,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 2239.5535403519953,
        "y": 754.8896853375988
      },
      "parentNode": "17b72831-8716-4f87-ae06-14be3598151d"
    }
  ],
  "edges": [
    {
      "source": "bddb466d-4294-48ac-8f5c-760680e53e25",
      "target": "beac6b70-34ad-40c7-b3f6-4f7311a16684",
      "sourceHandle": "3D#TableOut",
      "id": "reactflow__edge-f93a9166-c478-49f8-9694-cd9262f221d83D#TableOut-d6929c8c-e9c9-4b37-8bf6-46f414b6c8393D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "b7678b3a-bfe2-4f4a-9ba7-f8f1816b0523",
      "target": "57c02b59-5934-454f-8dc6-04956cb663b4",
      "sourceHandle": "Log#LogSource",
      "id": "reactflow__edge-aff427cb-8f40-4218-abf4-e1a984df3434Log#LogSource-dca583d5-4ca8-40ce-a183-36dc855e88ddLog#LogTarget",
      "targetHandle": "Log#LogTarget"
    },
    {
      "source": "57c02b59-5934-454f-8dc6-04956cb663b4",
      "sourceHandle": "Log#LogSource",
      "target": "bddb466d-4294-48ac-8f5c-760680e53e25",
      "targetHandle": "Log#LogIn",
      "id": "reactflow__edge-dca583d5-4ca8-40ce-a183-36dc855e88ddLog#LogSource-f93a9166-c478-49f8-9694-cd9262f221d8Log#LogIn"
    },
    {
      "source": "3a4aaf56-ab88-4ca1-86e3-3887e4f6d267",
      "sourceHandle": "3D#TableOut",
      "target": "c923c12c-b0ad-4079-b1b5-d57c39b0fd1e",
      "targetHandle": "3D#SourceHandle",
      "id": "reactflow__edge-93f7c06f-d71e-4f1c-9563-97131c19395c3D#TableOut-293f6a49-b52a-4531-9aed-d6a69744372f3D#SourceHandle"
    },
    {
      "source": "c923c12c-b0ad-4079-b1b5-d57c39b0fd1e",
      "sourceHandle": "3D#TableOut",
      "target": "520be08d-b759-40f0-8dff-c5d957a233e9",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-293f6a49-b52a-4531-9aed-d6a69744372f3D#TableOut-967f9c71-f642-44ea-b3f2-073da51c8f993D#TableIn2"
    },
    {
      "source": "bddb466d-4294-48ac-8f5c-760680e53e25",
      "target": "56ecbe4c-5c77-47bd-8873-81ecee6f34f2",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-56798608-e719-4b26-997c-59f02ca77f6b3D#TableOut-5fbb7c29-dce3-4ce1-9af3-4861ae18ada43D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "beac6b70-34ad-40c7-b3f6-4f7311a16684",
      "sourceHandle": "3D#TableOut",
      "target": "520be08d-b759-40f0-8dff-c5d957a233e9",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-3b47a710-fb80-418a-a2e7-ca4f117031743D#TableOut-605a3e9e-a32f-4568-aa75-154ab59e080f3D#TableIn1"
    },
    {
      "source": "a4430e27-d789-4270-acee-b1d64f2d4d10",
      "sourceHandle": "3D#TableOut",
      "target": "bddb466d-4294-48ac-8f5c-760680e53e25",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-7a9fc3c1-9df5-4aa8-a2aa-87d75290ffca3D#TableIn"
    },
    {
      "source": "a4430e27-d789-4270-acee-b1d64f2d4d10",
      "sourceHandle": "3D#TableOut",
      "target": "c923c12c-b0ad-4079-b1b5-d57c39b0fd1e",
      "targetHandle": "3D#DestHandle",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-2e59aea2-e109-4a62-80b4-38f458f31e3a3D#DestHandle"
    },
    {
      "source": "a4430e27-d789-4270-acee-b1d64f2d4d10",
      "sourceHandle": "3D#TableOut",
      "target": "328b260c-d42d-48fa-ab5c-6b0e9e6804bf",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-ae1456d7-470d-4619-9976-c3656a9c21523D#TableIn1"
    },
    {
      "source": "bddb466d-4294-48ac-8f5c-760680e53e25",
      "target": "f0382751-b96d-4592-bff9-a357726508bb",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-7695e58d-c05d-40cc-9fdd-e12f3227f27b3D#TableOut-35be45c0-3a5e-4311-b9ef-bef97b854f4e3D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "f0382751-b96d-4592-bff9-a357726508bb",
      "target": "2799c518-5b82-400f-8ab3-187e34bae0b1",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-35be45c0-3a5e-4311-b9ef-bef97b854f4e3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "56ecbe4c-5c77-47bd-8873-81ecee6f34f2",
      "sourceHandle": "3D#TableOut",
      "target": "2799c518-5b82-400f-8ab3-187e34bae0b1",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-fdc5ac5e-a94d-4eef-9b52-8ad4d028cf9b3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn2"
    },
    {
      "source": "2799c518-5b82-400f-8ab3-187e34bae0b1",
      "target": "49118298-7b96-4272-836d-ee6fa1d74c9c",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableOut-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "520be08d-b759-40f0-8dff-c5d957a233e9",
      "sourceHandle": "3D#TableOut",
      "target": "49118298-7b96-4272-836d-ee6fa1d74c9c",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-9aea2e30-4f75-4419-9f98-6fdaf6f519853D#TableOut-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableIn2"
    },
    {
      "source": "49118298-7b96-4272-836d-ee6fa1d74c9c",
      "sourceHandle": "3D#TableOut",
      "target": "328b260c-d42d-48fa-ab5c-6b0e9e6804bf",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableOut-d8392d8f-361d-4a78-a53c-2ca0c947445c3D#TableIn2"
    },
    {
      "source": "686211df-7a6e-441a-8503-05e880518234",
      "sourceHandle": "Log#LogOut",
      "target": "0e75875b-59a7-4176-a609-9293bd676813",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-1bb82150-193e-4d52-bbca-dde80465839dLog#LogOut-5085f918-8e62-4d32-bfd9-02406759d63eLog#LogTarget"
    },
    {
      "source": "0e75875b-59a7-4176-a609-9293bd676813",
      "sourceHandle": "Log#LogSource",
      "target": "b7678b3a-bfe2-4f4a-9ba7-f8f1816b0523",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-5085f918-8e62-4d32-bfd9-02406759d63eLog#LogSource-117d9dbd-a5e2-4702-9c95-4fce9ba7634aLog#LogTarget"
    },
    {
      "source": "b0d7f5a4-23cd-4fb9-892e-b9c55fba6571",
      "sourceHandle": "Rom#RomOut",
      "target": "a4430e27-d789-4270-acee-b1d64f2d4d10",
      "targetHandle": "Rom#RomIn",
      "id": "reactflow__edge-b0d7f5a4-23cd-4fb9-892e-b9c55fba6571Rom#RomOut-a4430e27-d789-4270-acee-b1d64f2d4d10Rom#RomIn"
    },
    {
      "source": "b0d7f5a4-23cd-4fb9-892e-b9c55fba6571",
      "sourceHandle": "Rom#RomOut",
      "target": "3a4aaf56-ab88-4ca1-86e3-3887e4f6d267",
      "targetHandle": "Rom#RomIn",
      "id": "reactflow__edge-b0d7f5a4-23cd-4fb9-892e-b9c55fba6571Rom#RomOut-3a4aaf56-ab88-4ca1-86e3-3887e4f6d267Rom#RomIn"
    }
  ]
}

export default MapAfrGroup