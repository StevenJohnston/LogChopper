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
      "id": "5b8b82ba-011b-4301-a68b-8190c125c704",
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
      "id": "aea363dc-7f77-4f0d-ac4f-29d1ea46d6db",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "High Octane Fuel Map"
      },
      "position": {
        "x": 79.41820997460559,
        "y": 550.3309805281074
      },
      "dragHandle": ".drag-handle",
      "width": 706,
      "height": 360,
      "positionAbsolute": {
        "x": 75.65069640989464,
        "y": 698.9597338185351
      },
      "dragging": false,
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704",
      "selected": false
    },
    {
      "id": "ebcebf09-0198-48fe-a3d0-2db938f8f4c6",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "MAP based Load Calc #2 - Cold/Interpolated"
      },
      "position": {
        "x": 30.415027071725717,
        "y": 385.78039049106286
      },
      "dragHandle": ".drag-handle",
      "width": 374,
      "height": 50,
      "selected": false,
      "positionAbsolute": {
        "x": 26.647513507014764,
        "y": 534.4091437814907
      },
      "dragging": false,
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704"
    },
    {
      "id": "0e9714a3-e334-4def-87dc-6ff98592b6cd",
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
      "width": 573,
      "height": 184,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 513.1678187932159,
        "y": 606.2420493508562
      },
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704",
      "selected": false
    },
    {
      "id": "184e4e75-1430-40f8-98ea-8802de53ece9",
      "type": "BaseLogNode",
      "position": {
        "x": 54.49010215096473,
        "y": 47.58454532905341
      },
      "data": {},
      "width": 309,
      "height": 98,
      "positionAbsolute": {
        "x": 50.72258858625378,
        "y": 196.21329861948124
      },
      "dragging": false,
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704"
    },
    {
      "id": "6646663a-1397-436e-b32d-9501c97d06a0",
      "type": "LogFilterNode",
      "position": {
        "x": 454.78604255216237,
        "y": 52.88666844167983
      },
      "data": {
        "func": "IPW>0 and AFR>0"
      },
      "width": 207,
      "height": 102,
      "dragging": false,
      "positionAbsolute": {
        "x": 451.0185289874514,
        "y": 201.51542173210765
      },
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704",
      "selected": false
    },
    {
      "id": "5ca63324-d803-4af3-8566-693dd2029467",
      "type": "LogAlterNode",
      "position": {
        "x": 459.89331512724993,
        "y": 189.67467155681106
      },
      "data": {
        "func": "AFR*(1-(CurrentLTFT+STFT)/100)",
        "newLogField": "AFRNEW"
      },
      "width": 207,
      "height": 154,
      "dragging": false,
      "positionAbsolute": {
        "x": 456.125801562539,
        "y": 338.3034248472389
      },
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704"
    },
    {
      "id": "7695e58d-c05d-40cc-9fdd-e12f3227f27b",
      "type": "FillLogTableNode",
      "position": {
        "x": 799.38034778426,
        "y": 253.4309322314952
      },
      "data": {
        "weighted": true
      },
      "width": 174,
      "height": 79,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 795.6128342195491,
        "y": 402.05968552192303
      },
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704"
    },
    {
      "id": "b7a58357-56a5-4b1f-8df8-90f82ff14650",
      "type": "FillTableNode",
      "position": {
        "x": 1405.6068966010287,
        "y": 352.26782108021905
      },
      "data": {
        "logField": "AFRNEW",
        "aggregator": "AVG"
      },
      "width": 894,
      "height": 476,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1401.8393830363177,
        "y": 500.8965743706469
      },
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704",
      "selected": false
    },
    {
      "id": "9aea2e30-4f75-4419-9f98-6fdaf6f51985",
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
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704",
      "selected": false
    },
    {
      "id": "fdc5ac5e-a94d-4eef-9b52-8ad4d028cf9b",
      "type": "FillTableNode",
      "position": {
        "x": 1452.3005870521297,
        "y": 189.9955101361884
      },
      "data": {
        "logField": "weight",
        "aggregator": "AVG"
      },
      "width": 463,
      "height": 121,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1448.5330734874187,
        "y": 338.6242634266162
      },
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704",
      "selected": false
    },
    {
      "id": "35be45c0-3a5e-4311-b9ef-bef97b854f4e",
      "type": "FillTableNode",
      "position": {
        "x": 1473.7198218649987,
        "y": 17.565166356770902
      },
      "data": {
        "logField": "LogID",
        "aggregator": "COUNT"
      },
      "width": 463,
      "height": 121,
      "selected": false,
      "positionAbsolute": {
        "x": 1469.9523083002878,
        "y": 166.19391964719873
      },
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "299e225b-fcbf-4aca-9dec-d816a426a827",
      "type": "CombineNode",
      "position": {
        "x": 2009.9224251550045,
        "y": 98.10605484175016
      },
      "data": {
        "func": "sourceTable[y][x] > 10 ? joinTable[y][x] : 0"
      },
      "width": 499,
      "height": 104,
      "selected": false,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 2006.1549115902935,
        "y": 246.734808132178
      },
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704"
    },
    {
      "id": "934e662d-1607-49c7-9fae-e9c2734c981b",
      "type": "CombineNode",
      "position": {
        "x": 2306.6095790904706,
        "y": 289.74089568488597
      },
      "data": {
        "func": "diff = 1-joinTable[y][x];\nweight = sourceTable[y][x];\n1 + diff * weight;\nk = 20;\nnewWeight = weight   / (1 + exp(-k * (weight  - 0.1)));\nsuperWeight = 1-(1-newWeight )^10;\nnewDiff = 1 - superWeight * diff;\nnewDiff < 0.9 ? 0.9 : (newDiff > 1.1 ? 1.1: newDiff)"
      },
      "width": 894,
      "height": 628,
      "selected": false,
      "positionAbsolute": {
        "x": 2302.8420655257596,
        "y": 438.3696489753138
      },
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "d8392d8f-361d-4a78-a53c-2ca0c947445c",
      "type": "CombineNode",
      "position": {
        "x": 2243.321053916706,
        "y": 606.2609320471711
      },
      "data": {
        "func": "sourceTable[y][x] * joinTable[y][x]"
      },
      "width": 894,
      "height": 459,
      "selected": false,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 2239.5535403519953,
        "y": 754.8896853375988
      },
      "parentNode": "5b8b82ba-011b-4301-a68b-8190c125c704"
    }
  ],
  "edges": [
    {
      "source": "7695e58d-c05d-40cc-9fdd-e12f3227f27b",
      "target": "b7a58357-56a5-4b1f-8df8-90f82ff14650",
      "sourceHandle": "3D#TableOut",
      "id": "reactflow__edge-f93a9166-c478-49f8-9694-cd9262f221d83D#TableOut-d6929c8c-e9c9-4b37-8bf6-46f414b6c8393D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "184e4e75-1430-40f8-98ea-8802de53ece9",
      "target": "6646663a-1397-436e-b32d-9501c97d06a0",
      "sourceHandle": "Log#LogOut",
      "id": "reactflow__edge-00fbfe29-f61d-4b08-92c5-542729437c8fLog#LogOut-aff427cb-8f40-4218-abf4-e1a984df3434Log#LogTarget",
      "targetHandle": "Log#LogTarget"
    },
    {
      "source": "6646663a-1397-436e-b32d-9501c97d06a0",
      "target": "5ca63324-d803-4af3-8566-693dd2029467",
      "sourceHandle": "Log#LogSource",
      "id": "reactflow__edge-aff427cb-8f40-4218-abf4-e1a984df3434Log#LogSource-dca583d5-4ca8-40ce-a183-36dc855e88ddLog#LogTarget",
      "targetHandle": "Log#LogTarget"
    },
    {
      "source": "5ca63324-d803-4af3-8566-693dd2029467",
      "sourceHandle": "Log#LogSource",
      "target": "7695e58d-c05d-40cc-9fdd-e12f3227f27b",
      "targetHandle": "Log#LogIn",
      "id": "reactflow__edge-dca583d5-4ca8-40ce-a183-36dc855e88ddLog#LogSource-f93a9166-c478-49f8-9694-cd9262f221d8Log#LogIn"
    },
    {
      "source": "aea363dc-7f77-4f0d-ac4f-29d1ea46d6db",
      "sourceHandle": "3D#TableOut",
      "target": "0e9714a3-e334-4def-87dc-6ff98592b6cd",
      "targetHandle": "3D#SourceHandle",
      "id": "reactflow__edge-93f7c06f-d71e-4f1c-9563-97131c19395c3D#TableOut-293f6a49-b52a-4531-9aed-d6a69744372f3D#SourceHandle"
    },
    {
      "source": "0e9714a3-e334-4def-87dc-6ff98592b6cd",
      "sourceHandle": "3D#TableOut",
      "target": "9aea2e30-4f75-4419-9f98-6fdaf6f51985",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-293f6a49-b52a-4531-9aed-d6a69744372f3D#TableOut-967f9c71-f642-44ea-b3f2-073da51c8f993D#TableIn2"
    },
    {
      "source": "7695e58d-c05d-40cc-9fdd-e12f3227f27b",
      "target": "fdc5ac5e-a94d-4eef-9b52-8ad4d028cf9b",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-56798608-e719-4b26-997c-59f02ca77f6b3D#TableOut-5fbb7c29-dce3-4ce1-9af3-4861ae18ada43D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "b7a58357-56a5-4b1f-8df8-90f82ff14650",
      "sourceHandle": "3D#TableOut",
      "target": "9aea2e30-4f75-4419-9f98-6fdaf6f51985",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-3b47a710-fb80-418a-a2e7-ca4f117031743D#TableOut-605a3e9e-a32f-4568-aa75-154ab59e080f3D#TableIn1"
    },
    {
      "source": "ebcebf09-0198-48fe-a3d0-2db938f8f4c6",
      "sourceHandle": "3D#TableOut",
      "target": "7695e58d-c05d-40cc-9fdd-e12f3227f27b",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-7a9fc3c1-9df5-4aa8-a2aa-87d75290ffca3D#TableIn"
    },
    {
      "source": "ebcebf09-0198-48fe-a3d0-2db938f8f4c6",
      "sourceHandle": "3D#TableOut",
      "target": "0e9714a3-e334-4def-87dc-6ff98592b6cd",
      "targetHandle": "3D#DestHandle",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-2e59aea2-e109-4a62-80b4-38f458f31e3a3D#DestHandle"
    },
    {
      "source": "ebcebf09-0198-48fe-a3d0-2db938f8f4c6",
      "sourceHandle": "3D#TableOut",
      "target": "d8392d8f-361d-4a78-a53c-2ca0c947445c",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-ae1456d7-470d-4619-9976-c3656a9c21523D#TableIn1"
    },
    {
      "source": "7695e58d-c05d-40cc-9fdd-e12f3227f27b",
      "target": "35be45c0-3a5e-4311-b9ef-bef97b854f4e",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-7695e58d-c05d-40cc-9fdd-e12f3227f27b3D#TableOut-35be45c0-3a5e-4311-b9ef-bef97b854f4e3D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "35be45c0-3a5e-4311-b9ef-bef97b854f4e",
      "target": "299e225b-fcbf-4aca-9dec-d816a426a827",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-35be45c0-3a5e-4311-b9ef-bef97b854f4e3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "fdc5ac5e-a94d-4eef-9b52-8ad4d028cf9b",
      "sourceHandle": "3D#TableOut",
      "target": "299e225b-fcbf-4aca-9dec-d816a426a827",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-fdc5ac5e-a94d-4eef-9b52-8ad4d028cf9b3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn2"
    },
    {
      "source": "299e225b-fcbf-4aca-9dec-d816a426a827",
      "target": "934e662d-1607-49c7-9fae-e9c2734c981b",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableOut-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "9aea2e30-4f75-4419-9f98-6fdaf6f51985",
      "sourceHandle": "3D#TableOut",
      "target": "934e662d-1607-49c7-9fae-e9c2734c981b",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-9aea2e30-4f75-4419-9f98-6fdaf6f519853D#TableOut-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableIn2"
    },
    {
      "source": "934e662d-1607-49c7-9fae-e9c2734c981b",
      "sourceHandle": "3D#TableOut",
      "target": "d8392d8f-361d-4a78-a53c-2ca0c947445c",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableOut-d8392d8f-361d-4a78-a53c-2ca0c947445c3D#TableIn2"
    }
  ]
}

export default MapAfrGroup