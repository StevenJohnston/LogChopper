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
        "x": -3.767513564710953,
        "y": 148.62875329042782
      },
      "id": "2814677b-3737-4c30-8aed-a1a1bb11fd39",
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
        "x": -3.767513564710953,
        "y": 148.62875329042782
      },
      "dragging": false,
      "resizing": false
    },
    {
      "id": "1bb82150-193e-4d52-bbca-dde80465839d",
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
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39"
    },
    {
      "id": "d30ad8d4-8381-4d4e-a64b-54bfae600621",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "High Octane Fuel Map"
      },
      "position": {
        "x": 77.7998873812245,
        "y": 631.2471101971576
      },
      "dragHandle": ".drag-handle",
      "width": 706,
      "height": 360,
      "positionAbsolute": {
        "x": 74.03237381651354,
        "y": 779.8758634875853
      },
      "dragging": false,
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39",
      "selected": false
    },
    {
      "id": "76e470fd-99f2-476f-8fa5-ea0fe67eba67",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "MAP based Load Calc #2 - Cold/Interpolated"
      },
      "position": {
        "x": 40.124962632011716,
        "y": 490.9713590608282
      },
      "dragHandle": ".drag-handle",
      "width": 374,
      "height": 50,
      "selected": false,
      "positionAbsolute": {
        "x": 36.35744906730076,
        "y": 639.600112351256
      },
      "dragging": false,
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39"
    },
    {
      "id": "d74a5526-b93f-4b80-a557-3301018a8700",
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
        ]
      },
      "width": 573,
      "height": 184,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 548.770915847598,
        "y": 683.9215338331444
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39",
      "selected": false
    },
    {
      "position": {
        "x": 109.85036600565923,
        "y": 133.62075193554773
      },
      "id": "5085f918-8e62-4d32-bfd9-02406759d63e",
      "type": "RunningLogAlterNode",
      "data": {
        "alterFunc": "futureLogRecord.AFR",
        "untilFunc": "reduced = prevVal + futureLogRecord.RPM * pow(futureLogRecord.Load + 30, 1.4);\n          reduced > 2500000 ? true : reduced;",
        "newFieldName": "AFR"
      },
      "width": 402,
      "height": 260,
      "selected": false,
      "positionAbsolute": {
        "x": 106.08285244094827,
        "y": 282.24950522597555
      },
      "dragging": false,
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39"
    },
    {
      "id": "117d9dbd-a5e2-4702-9c95-4fce9ba7634a",
      "type": "LogFilterNode",
      "position": {
        "x": 590.7251403961668,
        "y": 35.085119914488814
      },
      "data": {
        "func": "IPW>0 and AFR>0 and ECT>75"
      },
      "width": 203,
      "height": 102,
      "dragging": false,
      "positionAbsolute": {
        "x": 586.9576268314559,
        "y": 183.71387320491664
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39",
      "selected": false
    },
    {
      "id": "7bc7f903-03ff-4fe1-855c-f52eb14d8bc8",
      "type": "LogAlterNode",
      "position": {
        "x": 874.1838990327872,
        "y": 35.93402518561561
      },
      "data": {
        "func": "AFR*(1-(CurrentLTFT+STFT)/100)",
        "newLogField": "AFRNEW"
      },
      "width": 203,
      "height": 154,
      "dragging": false,
      "positionAbsolute": {
        "x": 870.4163854680762,
        "y": 184.56277847604343
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39",
      "selected": false
    },
    {
      "id": "017b09c6-9c6f-4f35-b07f-f96cf1b77236",
      "type": "FillLogTableNode",
      "position": {
        "x": 839.838412618785,
        "y": 246.95764185797117
      },
      "data": {
        "weighted": true
      },
      "width": 178,
      "height": 79,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 836.0708990540741,
        "y": 395.586395148399
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39",
      "selected": false
    },
    {
      "id": "a24602d1-fa08-4253-b9c6-679e51d4c440",
      "type": "FillTableNode",
      "position": {
        "x": 1405.6068966010287,
        "y": 352.26782108021905
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
        "x": 1401.8393830363177,
        "y": 500.8965743706469
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39"
    },
    {
      "id": "287de2ae-fc7c-4b4d-ab7d-6fb131756021",
      "type": "CombineNode",
      "position": {
        "x": 1378.8014899691452,
        "y": 541.2247764443857
      },
      "data": {
        "func": "(sourceTable[y][x]/joinTable[y][x])"
      },
      "width": 499,
      "height": 104,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1375.0339764044343,
        "y": 689.8535297348135
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39"
    },
    {
      "id": "b2484ff1-13bc-44d3-af69-48cbd4798172",
      "type": "FillTableNode",
      "position": {
        "x": 1452.3005870521297,
        "y": 189.9955101361884
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
        "x": 1448.5330734874187,
        "y": 338.6242634266162
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39"
    },
    {
      "id": "2c3feef4-4af8-4b83-890b-47c87867bb96",
      "type": "FillTableNode",
      "position": {
        "x": 1473.7198218649987,
        "y": 17.565166356770902
      },
      "data": {
        "logField": "LogID",
        "aggregator": "COUNT"
      },
      "width": 299,
      "height": 119,
      "positionAbsolute": {
        "x": 1469.9523083002878,
        "y": 166.19391964719873
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "d7b8b0cb-9a2e-46ec-bd19-ef39e4feeb98",
      "type": "CombineNode",
      "position": {
        "x": 2009.9224251550045,
        "y": 98.10605484175016
      },
      "data": {
        "func": "sourceTable[y][x] > 10 ? joinTable[y][x] : 0"
      },
      "width": 321,
      "height": 80,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 2006.1549115902935,
        "y": 246.734808132178
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39"
    },
    {
      "id": "7717a7ff-9644-4597-91cf-d32bc39208ae",
      "type": "CombineNode",
      "position": {
        "x": 2306.6095790904706,
        "y": 289.74089568488597
      },
      "data": {
        "func": "diff = 1-joinTable[y][x];\nweight = sourceTable[y][x];\n1 + diff * weight;\nk = 20;\nnewWeight = weight   / (1 + exp(-k * (weight  - 0.1)));\nsuperWeight = 1-(1-newWeight )^10;\nnewDiff = 1 - superWeight * diff;\nnewDiff < 0.9 ? 0.9 : (newDiff > 1.1 ? 1.1: newDiff)"
      },
      "width": 396,
      "height": 248,
      "positionAbsolute": {
        "x": 2302.8420655257596,
        "y": 438.3696489753138
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "0cc4d5fe-1f86-495a-97d4-b8315b23fb1e",
      "type": "CombineNode",
      "position": {
        "x": 2243.321053916706,
        "y": 606.2609320471711
      },
      "data": {
        "func": "sourceTable[y][x] * joinTable[y][x]"
      },
      "width": 262,
      "height": 80,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 2239.5535403519953,
        "y": 754.8896853375988
      },
      "parentNode": "2814677b-3737-4c30-8aed-a1a1bb11fd39"
    }
  ],
  "edges": [
    {
      "source": "017b09c6-9c6f-4f35-b07f-f96cf1b77236",
      "target": "a24602d1-fa08-4253-b9c6-679e51d4c440",
      "sourceHandle": "3D#TableOut",
      "id": "reactflow__edge-f93a9166-c478-49f8-9694-cd9262f221d83D#TableOut-d6929c8c-e9c9-4b37-8bf6-46f414b6c8393D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "117d9dbd-a5e2-4702-9c95-4fce9ba7634a",
      "target": "7bc7f903-03ff-4fe1-855c-f52eb14d8bc8",
      "sourceHandle": "Log#LogSource",
      "id": "reactflow__edge-aff427cb-8f40-4218-abf4-e1a984df3434Log#LogSource-dca583d5-4ca8-40ce-a183-36dc855e88ddLog#LogTarget",
      "targetHandle": "Log#LogTarget"
    },
    {
      "source": "7bc7f903-03ff-4fe1-855c-f52eb14d8bc8",
      "sourceHandle": "Log#LogSource",
      "target": "017b09c6-9c6f-4f35-b07f-f96cf1b77236",
      "targetHandle": "Log#LogIn",
      "id": "reactflow__edge-dca583d5-4ca8-40ce-a183-36dc855e88ddLog#LogSource-f93a9166-c478-49f8-9694-cd9262f221d8Log#LogIn"
    },
    {
      "source": "d30ad8d4-8381-4d4e-a64b-54bfae600621",
      "sourceHandle": "3D#TableOut",
      "target": "d74a5526-b93f-4b80-a557-3301018a8700",
      "targetHandle": "3D#SourceHandle",
      "id": "reactflow__edge-93f7c06f-d71e-4f1c-9563-97131c19395c3D#TableOut-293f6a49-b52a-4531-9aed-d6a69744372f3D#SourceHandle"
    },
    {
      "source": "d74a5526-b93f-4b80-a557-3301018a8700",
      "sourceHandle": "3D#TableOut",
      "target": "287de2ae-fc7c-4b4d-ab7d-6fb131756021",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-293f6a49-b52a-4531-9aed-d6a69744372f3D#TableOut-967f9c71-f642-44ea-b3f2-073da51c8f993D#TableIn2"
    },
    {
      "source": "017b09c6-9c6f-4f35-b07f-f96cf1b77236",
      "target": "b2484ff1-13bc-44d3-af69-48cbd4798172",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-56798608-e719-4b26-997c-59f02ca77f6b3D#TableOut-5fbb7c29-dce3-4ce1-9af3-4861ae18ada43D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "a24602d1-fa08-4253-b9c6-679e51d4c440",
      "sourceHandle": "3D#TableOut",
      "target": "287de2ae-fc7c-4b4d-ab7d-6fb131756021",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-3b47a710-fb80-418a-a2e7-ca4f117031743D#TableOut-605a3e9e-a32f-4568-aa75-154ab59e080f3D#TableIn1"
    },
    {
      "source": "76e470fd-99f2-476f-8fa5-ea0fe67eba67",
      "sourceHandle": "3D#TableOut",
      "target": "017b09c6-9c6f-4f35-b07f-f96cf1b77236",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-7a9fc3c1-9df5-4aa8-a2aa-87d75290ffca3D#TableIn"
    },
    {
      "source": "76e470fd-99f2-476f-8fa5-ea0fe67eba67",
      "sourceHandle": "3D#TableOut",
      "target": "d74a5526-b93f-4b80-a557-3301018a8700",
      "targetHandle": "3D#DestHandle",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-2e59aea2-e109-4a62-80b4-38f458f31e3a3D#DestHandle"
    },
    {
      "source": "76e470fd-99f2-476f-8fa5-ea0fe67eba67",
      "sourceHandle": "3D#TableOut",
      "target": "0cc4d5fe-1f86-495a-97d4-b8315b23fb1e",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-ae1456d7-470d-4619-9976-c3656a9c21523D#TableIn1"
    },
    {
      "source": "017b09c6-9c6f-4f35-b07f-f96cf1b77236",
      "target": "2c3feef4-4af8-4b83-890b-47c87867bb96",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-7695e58d-c05d-40cc-9fdd-e12f3227f27b3D#TableOut-35be45c0-3a5e-4311-b9ef-bef97b854f4e3D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "2c3feef4-4af8-4b83-890b-47c87867bb96",
      "target": "d7b8b0cb-9a2e-46ec-bd19-ef39e4feeb98",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-35be45c0-3a5e-4311-b9ef-bef97b854f4e3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "b2484ff1-13bc-44d3-af69-48cbd4798172",
      "sourceHandle": "3D#TableOut",
      "target": "d7b8b0cb-9a2e-46ec-bd19-ef39e4feeb98",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-fdc5ac5e-a94d-4eef-9b52-8ad4d028cf9b3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn2"
    },
    {
      "source": "d7b8b0cb-9a2e-46ec-bd19-ef39e4feeb98",
      "target": "7717a7ff-9644-4597-91cf-d32bc39208ae",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableOut-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "287de2ae-fc7c-4b4d-ab7d-6fb131756021",
      "sourceHandle": "3D#TableOut",
      "target": "7717a7ff-9644-4597-91cf-d32bc39208ae",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-9aea2e30-4f75-4419-9f98-6fdaf6f519853D#TableOut-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableIn2"
    },
    {
      "source": "7717a7ff-9644-4597-91cf-d32bc39208ae",
      "sourceHandle": "3D#TableOut",
      "target": "0cc4d5fe-1f86-495a-97d4-b8315b23fb1e",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableOut-d8392d8f-361d-4a78-a53c-2ca0c947445c3D#TableIn2"
    },
    {
      "source": "1bb82150-193e-4d52-bbca-dde80465839d",
      "sourceHandle": "Log#LogOut",
      "target": "5085f918-8e62-4d32-bfd9-02406759d63e",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-1bb82150-193e-4d52-bbca-dde80465839dLog#LogOut-5085f918-8e62-4d32-bfd9-02406759d63eLog#LogTarget"
    },
    {
      "source": "5085f918-8e62-4d32-bfd9-02406759d63e",
      "sourceHandle": "Log#LogSource",
      "target": "117d9dbd-a5e2-4702-9c95-4fce9ba7634a",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-5085f918-8e62-4d32-bfd9-02406759d63eLog#LogSource-117d9dbd-a5e2-4702-9c95-4fce9ba7634aLog#LogTarget"
    }
  ]
}

export default MapAfrGroup