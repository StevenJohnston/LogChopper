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

const AfrMapGroup = () => {
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
      {`AFRMAP Map Fix`}
    </NodeSelectorButton>
  )
}

const savedGroup: SavedGroup = {
  "groupName": "Stock MAP AFR FixS elected Rom",
  "nodes": [
    {
      "position": {
        "x": -3.767513564710953,
        "y": 148.62875329042782
      },
      "id": "2b9c4ba0-15b9-41fb-a862-785a3d373b44",
      "type": "GroupNode",
      "data": {
        "name": "Stock MAP AFR FixS elected Rom",
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
      "id": "f698492c-a94e-4891-b30e-1b00340750b1",
      "type": "BaseLogNode",
      "position": {
        "x": 54.49010215096473,
        "y": 47.58454532905341
      },
      "data": {},
      "width": 334,
      "height": 74,
      "positionAbsolute": {
        "x": 50.72258858625378,
        "y": 196.21329861948124
      },
      "dragging": false,
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    },
    {
      "position": {
        "x": 109.85036600565923,
        "y": 133.62075193554773
      },
      "id": "72c68c37-9496-48cf-b09b-548661f5a621",
      "type": "RunningLogAlterNode",
      "data": {
        "newFieldName": "AFR",
        "untilFunc": "reduced = accumulator + futureLogRecord.RPM * pow(futureLogRecord.Load + 30, 1.4);\n[reduced > 2500000, reduced];",
        "alterFunc": "futureLogRecord.AFR"
      },
      "width": 402,
      "height": 296,
      "positionAbsolute": {
        "x": 106.08285244094827,
        "y": 282.24950522597555
      },
      "dragging": false,
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    },
    {
      "id": "384c9a07-39fb-4cd7-8ed8-7da6bb882fe9",
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
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    },
    {
      "id": "7fd59a40-5f5c-405b-9c31-a45743e0ccb6",
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
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    },
    {
      "id": "91003f3d-efc2-4ec4-951b-7f94c758620d",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "MAP based Load Calc #2 - Cold/Interpolated",
        "tableType": "3D"
      },
      "position": {
        "x": 54.124962632011716,
        "y": 620.9713590608283
      },
      "dragHandle": ".drag-handle",
      "width": 381,
      "height": 50,
      "selected": false,
      "positionAbsolute": {
        "x": 50.35744906730076,
        "y": 769.600112351256
      },
      "dragging": false,
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    },
    {
      "id": "281dacc2-2e1c-4b4d-a5f9-d9d93f36c995",
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
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    },
    {
      "id": "865dc53c-2aa9-4fb6-915e-659864541f5f",
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
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    },
    {
      "id": "6469c4c0-e496-4e71-abc6-1d01c21f702d",
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
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    },
    {
      "id": "732327f1-4d5e-4b0e-9a77-107b45fd6383",
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
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "b2567aae-9193-42bf-9923-bf1dd175f941",
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
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    },
    {
      "id": "b46b9f89-1471-4f26-bd8a-dd4726cbdead",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "High Octane Fuel Map",
        "tableType": "3D"
      },
      "position": {
        "x": 79.7998873812245,
        "y": 713.2471101971576
      },
      "dragHandle": ".drag-handle",
      "width": 219,
      "height": 50,
      "positionAbsolute": {
        "x": 76.03237381651354,
        "y": 861.8758634875853
      },
      "dragging": false,
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44",
      "selected": false
    },
    {
      "id": "cb64ec60-0707-4860-99ed-2c2ae87d53c5",
      "type": "CombineAdvancedTableNode",
      "position": {
        "x": 714.5384294123089,
        "y": 561.2927805427166
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
        "x": 710.770915847598,
        "y": 709.9215338331444
      },
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44",
      "selected": false
    },
    {
      "id": "24ddcfb9-a513-4b18-ac97-26ff1ed42321",
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
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    },
    {
      "id": "21f9f2a6-0d70-4164-8282-dca69fa46afb",
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
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "77ddd8e6-9c03-48aa-b16f-1ba7eed5a87e",
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
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44",
      "selected": false
    },
    {
      "id": "520a7646-13cb-422d-a839-d6c6ca79dc10",
      "type": "BaseRomNode",
      "data": {},
      "position": {
        "x": 35.76751356471095,
        "y": 467.9712467095722
      },
      "dragHandle": ".drag-handle",
      "width": 647,
      "height": 74,
      "selected": false,
      "positionAbsolute": {
        "x": 32,
        "y": 616.6
      },
      "dragging": true,
      "parentNode": "2b9c4ba0-15b9-41fb-a862-785a3d373b44"
    }
  ],
  "edges": [
    {
      "source": "281dacc2-2e1c-4b4d-a5f9-d9d93f36c995",
      "target": "865dc53c-2aa9-4fb6-915e-659864541f5f",
      "sourceHandle": "3D#TableOut",
      "id": "reactflow__edge-f93a9166-c478-49f8-9694-cd9262f221d83D#TableOut-d6929c8c-e9c9-4b37-8bf6-46f414b6c8393D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "384c9a07-39fb-4cd7-8ed8-7da6bb882fe9",
      "target": "7fd59a40-5f5c-405b-9c31-a45743e0ccb6",
      "sourceHandle": "Log#LogSource",
      "id": "reactflow__edge-aff427cb-8f40-4218-abf4-e1a984df3434Log#LogSource-dca583d5-4ca8-40ce-a183-36dc855e88ddLog#LogTarget",
      "targetHandle": "Log#LogTarget"
    },
    {
      "source": "7fd59a40-5f5c-405b-9c31-a45743e0ccb6",
      "sourceHandle": "Log#LogSource",
      "target": "281dacc2-2e1c-4b4d-a5f9-d9d93f36c995",
      "targetHandle": "Log#LogIn",
      "id": "reactflow__edge-dca583d5-4ca8-40ce-a183-36dc855e88ddLog#LogSource-f93a9166-c478-49f8-9694-cd9262f221d8Log#LogIn"
    },
    {
      "source": "b46b9f89-1471-4f26-bd8a-dd4726cbdead",
      "sourceHandle": "3D#TableOut",
      "target": "cb64ec60-0707-4860-99ed-2c2ae87d53c5",
      "targetHandle": "3D#SourceHandle",
      "id": "reactflow__edge-93f7c06f-d71e-4f1c-9563-97131c19395c3D#TableOut-293f6a49-b52a-4531-9aed-d6a69744372f3D#SourceHandle"
    },
    {
      "source": "cb64ec60-0707-4860-99ed-2c2ae87d53c5",
      "sourceHandle": "3D#TableOut",
      "target": "24ddcfb9-a513-4b18-ac97-26ff1ed42321",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-293f6a49-b52a-4531-9aed-d6a69744372f3D#TableOut-967f9c71-f642-44ea-b3f2-073da51c8f993D#TableIn2"
    },
    {
      "source": "281dacc2-2e1c-4b4d-a5f9-d9d93f36c995",
      "target": "6469c4c0-e496-4e71-abc6-1d01c21f702d",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-56798608-e719-4b26-997c-59f02ca77f6b3D#TableOut-5fbb7c29-dce3-4ce1-9af3-4861ae18ada43D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "865dc53c-2aa9-4fb6-915e-659864541f5f",
      "sourceHandle": "3D#TableOut",
      "target": "24ddcfb9-a513-4b18-ac97-26ff1ed42321",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-3b47a710-fb80-418a-a2e7-ca4f117031743D#TableOut-605a3e9e-a32f-4568-aa75-154ab59e080f3D#TableIn1"
    },
    {
      "source": "91003f3d-efc2-4ec4-951b-7f94c758620d",
      "sourceHandle": "3D#TableOut",
      "target": "281dacc2-2e1c-4b4d-a5f9-d9d93f36c995",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-7a9fc3c1-9df5-4aa8-a2aa-87d75290ffca3D#TableIn"
    },
    {
      "source": "91003f3d-efc2-4ec4-951b-7f94c758620d",
      "sourceHandle": "3D#TableOut",
      "target": "cb64ec60-0707-4860-99ed-2c2ae87d53c5",
      "targetHandle": "3D#DestHandle",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-2e59aea2-e109-4a62-80b4-38f458f31e3a3D#DestHandle"
    },
    {
      "source": "91003f3d-efc2-4ec4-951b-7f94c758620d",
      "sourceHandle": "3D#TableOut",
      "target": "77ddd8e6-9c03-48aa-b16f-1ba7eed5a87e",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-ae1456d7-470d-4619-9976-c3656a9c21523D#TableIn1"
    },
    {
      "source": "281dacc2-2e1c-4b4d-a5f9-d9d93f36c995",
      "target": "732327f1-4d5e-4b0e-9a77-107b45fd6383",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-7695e58d-c05d-40cc-9fdd-e12f3227f27b3D#TableOut-35be45c0-3a5e-4311-b9ef-bef97b854f4e3D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "732327f1-4d5e-4b0e-9a77-107b45fd6383",
      "target": "b2567aae-9193-42bf-9923-bf1dd175f941",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-35be45c0-3a5e-4311-b9ef-bef97b854f4e3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "6469c4c0-e496-4e71-abc6-1d01c21f702d",
      "sourceHandle": "3D#TableOut",
      "target": "b2567aae-9193-42bf-9923-bf1dd175f941",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-fdc5ac5e-a94d-4eef-9b52-8ad4d028cf9b3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn2"
    },
    {
      "source": "b2567aae-9193-42bf-9923-bf1dd175f941",
      "target": "21f9f2a6-0d70-4164-8282-dca69fa46afb",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableOut-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "24ddcfb9-a513-4b18-ac97-26ff1ed42321",
      "sourceHandle": "3D#TableOut",
      "target": "21f9f2a6-0d70-4164-8282-dca69fa46afb",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-9aea2e30-4f75-4419-9f98-6fdaf6f519853D#TableOut-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableIn2"
    },
    {
      "source": "21f9f2a6-0d70-4164-8282-dca69fa46afb",
      "sourceHandle": "3D#TableOut",
      "target": "77ddd8e6-9c03-48aa-b16f-1ba7eed5a87e",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableOut-d8392d8f-361d-4a78-a53c-2ca0c947445c3D#TableIn2"
    },
    {
      "source": "f698492c-a94e-4891-b30e-1b00340750b1",
      "sourceHandle": "Log#LogOut",
      "target": "72c68c37-9496-48cf-b09b-548661f5a621",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-1bb82150-193e-4d52-bbca-dde80465839dLog#LogOut-5085f918-8e62-4d32-bfd9-02406759d63eLog#LogTarget"
    },
    {
      "source": "72c68c37-9496-48cf-b09b-548661f5a621",
      "sourceHandle": "Log#LogSource",
      "target": "384c9a07-39fb-4cd7-8ed8-7da6bb882fe9",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-5085f918-8e62-4d32-bfd9-02406759d63eLog#LogSource-117d9dbd-a5e2-4702-9c95-4fce9ba7634aLog#LogTarget"
    },
    {
      "source": "520a7646-13cb-422d-a839-d6c6ca79dc10",
      "sourceHandle": "Rom#RomOut",
      "target": "91003f3d-efc2-4ec4-951b-7f94c758620d",
      "targetHandle": "Rom#RomIn",
      "id": "reactflow__edge-520a7646-13cb-422d-a839-d6c6ca79dc10Rom#RomOut-91003f3d-efc2-4ec4-951b-7f94c758620dRom#RomIn"
    },
    {
      "source": "520a7646-13cb-422d-a839-d6c6ca79dc10",
      "sourceHandle": "Rom#RomOut",
      "target": "b46b9f89-1471-4f26-bd8a-dd4726cbdead",
      "targetHandle": "Rom#RomIn",
      "id": "reactflow__edge-520a7646-13cb-422d-a839-d6c6ca79dc10Rom#RomOut-b46b9f89-1471-4f26-bd8a-dd4726cbdeadRom#RomIn"
    }
  ]
}

export default AfrMapGroup