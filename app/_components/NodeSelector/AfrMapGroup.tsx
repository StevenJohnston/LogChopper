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
  "groupName": "AFRMAP FIX",
  "nodes": [
    {
      "position": {
        "x": -176.1247353016597,
        "y": -399.9391857385709
      },
      "id": "8b7b3422-9719-4f8f-874a-915b77de6252",
      "type": "GroupNode",
      "data": {
        "name": "AFRMAP FIX",
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
        "x": -176.1247353016597,
        "y": -399.9391857385709
      },
      "dragging": false,
      "resizing": false
    },
    {
      "id": "a3cb13f0-467f-4cc8-8dcc-9c8db11cd107",
      "type": "BaseRomNode",
      "data": {},
      "position": {
        "x": 35.271457383317625,
        "y": 643.9872165694227
      },
      "dragHandle": ".drag-handle",
      "width": 647,
      "height": 74,
      "positionAbsolute": {
        "x": -140.8532779183421,
        "y": 244.04803083085176
      },
      "dragging": true,
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252"
    },
    {
      "id": "183fc3f3-210c-40ef-9bcd-479be940ea5b",
      "type": "BaseLogNode",
      "position": {
        "x": 54.49010215096473,
        "y": 47.58454532905341
      },
      "data": {},
      "width": 331,
      "height": 74,
      "positionAbsolute": {
        "x": -121.63463315069498,
        "y": -352.3546404095175
      },
      "dragging": false,
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252"
    },
    {
      "id": "74e6ab19-4aea-4518-abc5-c52c98e875d9",
      "type": "BaseTableNode",
      "data": {
        "tableKey": "MAP based Load Calc #2 - Cold/Interpolated",
        "tableType": "3D",
        "scalingValue": {
          "name": "Loadify",
          "units": "%",
          "toExpr": "(x*10/512)*10/32",
          "frExpr": "(x*32/10)*512/10",
          "format": "%.1f",
          "min": "0",
          "max": "300",
          "inc": "1",
          "storageType": "uint16",
          "endian": "big"
        }
      },
      "position": {
        "x": 70.12496263201172,
        "y": 728.9713590608283
      },
      "dragHandle": ".drag-handle",
      "width": 381,
      "height": 50,
      "positionAbsolute": {
        "x": -105.999772669648,
        "y": 329.03217332225734
      },
      "dragging": false,
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252",
      "selected": false
    },
    {
      "position": {
        "x": 435.8503660056592,
        "y": 51.62075193554773
      },
      "id": "7b0a8470-9afb-484b-a5f4-b368328ef448",
      "type": "AfrShiftNode",
      "data": {},
      "width": 402,
      "height": 296,
      "positionAbsolute": {
        "x": 259.7256307039995,
        "y": -348.3184338030232
      },
      "dragging": false,
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252"
    },
    {
      "position": {
        "x": 74.18227624152405,
        "y": 189.8657988423671
      },
      "id": "ec116e5c-847f-40e6-a279-d7eefccedb9f",
      "type": "RunningLogAlterNode",
      "data": {
        "newFieldName": "delete",
        "untilFunc": "[true, currentLogRecord.RPM]",
        "alterFunc": "logRecord.delete or logRecord.RPM + 0 > accumulator"
      },
      "dragHandle": ".drag-handle",
      "width": 243,
      "height": 248,
      "positionAbsolute": {
        "x": -101.94245906013566,
        "y": -210.07338689620383
      },
      "dragging": false,
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252"
    },
    {
      "id": "3f18ebed-d1b4-4d74-b003-1ce7ba608e40",
      "type": "LogFilterNode",
      "position": {
        "x": 90.72514039616681,
        "y": 496.0851199144888
      },
      "data": {
        "func": "IPW>0 and AFR>0 and ECT>75 and (APP > 10 or Speed == 0)"
      },
      "width": 402,
      "height": 134,
      "dragging": false,
      "positionAbsolute": {
        "x": -85.3995949054929,
        "y": 96.14593417591789
      },
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252"
    },
    {
      "id": "d948b742-ed19-41a2-b5a8-8080c7910085",
      "type": "LogAlterNode",
      "position": {
        "x": 564.767513564711,
        "y": 373.3712467095722
      },
      "data": {
        "func": "AFR / AFRMAP",
        "newLogField": "AFRDIFF"
      },
      "width": 211,
      "height": 170,
      "positionAbsolute": {
        "x": 388.64277826305124,
        "y": -26.56793902899875
      },
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "c3db9238-eee6-4c76-a1f1-773cba43ff99",
      "type": "FillLogTableNode",
      "position": {
        "x": 702.2627946495462,
        "y": 556.3840888488639
      },
      "data": {
        "weighted": true
      },
      "width": 506,
      "height": 79,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 526.1380593478865,
        "y": 156.444903110293
      },
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252"
    },
    {
      "id": "58a40a6b-7e9a-4b7a-864c-1072fdbf532e",
      "type": "FillTableNode",
      "position": {
        "x": 1317.3005870521297,
        "y": 401.9955101361884
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
        "x": 1141.17585175047,
        "y": 2.056324397617459
      },
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252",
      "selected": false
    },
    {
      "id": "2c049449-c0ef-4db2-83b0-bec8272d6146",
      "type": "FillTableNode",
      "position": {
        "x": 1191.5406278806163,
        "y": 255.67762056042898
      },
      "data": {
        "logField": "LogID",
        "aggregator": "COUNT",
        "tableType": "3D"
      },
      "width": 474,
      "height": 119,
      "positionAbsolute": {
        "x": 1015.4158925789566,
        "y": -144.26156517814195
      },
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252",
      "dragHandle": ".drag-handle",
      "dragging": false,
      "selected": false
    },
    {
      "id": "01c0dc7e-c206-49c9-b15a-61cb05dfc328",
      "type": "FillTableNode",
      "position": {
        "x": 996.767513564711,
        "y": 73.37124670957229
      },
      "data": {
        "logField": "AFR",
        "aggregator": "AVG",
        "tableType": "3D",
        "scalingValue": {
          "name": "AFR",
          "units": "AFR",
          "toExpr": "14.7*128/x",
          "frExpr": "14.7*128/x",
          "format": "%.1f",
          "min": "8",
          "max": "20",
          "inc": "0.1",
          "storageType": "uint8",
          "endian": "big"
        }
      },
      "width": 474,
      "height": 119,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 820.6427782630512,
        "y": -326.56793902899864
      },
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252",
      "selected": false
    },
    {
      "id": "0a03bc68-7d2e-4e87-8273-aaa1a7842d25",
      "type": "FillTableNode",
      "position": {
        "x": 1287.767513564711,
        "y": 576.3712467095722
      },
      "data": {
        "logField": "AFRDIFF",
        "aggregator": "AVG",
        "tableType": "3D"
      },
      "width": 474,
      "height": 119,
      "positionAbsolute": {
        "x": 1111.6427782630512,
        "y": 176.4320609710013
      },
      "dragging": false,
      "dragHandle": ".drag-handle",
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252",
      "selected": false
    },
    {
      "id": "1893d8b2-5f22-4955-adae-aba3a662cc62",
      "type": "CombineNode",
      "position": {
        "x": 2130.321053916706,
        "y": 575.2609320471711
      },
      "data": {
        "func": "sourceTable[y][x] * joinTable[y][x]",
        "tableType": "3D",
        "scalingValue": {
          "name": "Loadify",
          "units": "%",
          "toExpr": "(x*10/512)*10/32",
          "frExpr": "(x*32/10)*512/10",
          "format": "%.1f",
          "min": "0",
          "max": "300",
          "inc": "1",
          "storageType": "uint16",
          "endian": "big"
        }
      },
      "width": 511,
      "height": 100,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1954.1963186150465,
        "y": 175.32174630860015
      },
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252"
    },
    {
      "id": "2e808aea-3c82-4426-bd62-491997857b8f",
      "type": "CombineNode",
      "position": {
        "x": 1914.6095790904706,
        "y": 207.74089568488603
      },
      "data": {
        "func": "diff = 1-joinTable[y][x];\nweight = sourceTable[y][x];\n1 + diff * weight;\nk = 20;\nnewWeight = weight   / (1 + exp(-k * (weight  - 0.1)));\nsuperWeight = 1-(1-newWeight )^10;\nnewDiff = 1 - superWeight * diff;\nnewDiff < 0.9 ? 0.9 : (newDiff > 1.1 ? 1.1: newDiff)",
        "tableType": "3D",
        "scalingValue": null
      },
      "width": 511,
      "height": 268,
      "positionAbsolute": {
        "x": 1738.4848437888108,
        "y": -192.1982900536849
      },
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252",
      "dragHandle": ".drag-handle",
      "dragging": false,
      "selected": false
    },
    {
      "id": "7ba07d71-472b-424e-8ad0-87cd18130ddf",
      "type": "CombineNode",
      "position": {
        "x": 1877.9224251550045,
        "y": 30.106054841750165
      },
      "data": {
        "func": "sourceTable[y][x] > 5 ? joinTable[y][x] : 0",
        "tableType": "3D",
        "scalingValue": null
      },
      "width": 967,
      "height": 528,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1701.7976898533448,
        "y": -369.83313089682076
      },
      "parentNode": "8b7b3422-9719-4f8f-874a-915b77de6252",
      "selected": false
    }
  ],
  "edges": [
    {
      "source": "74e6ab19-4aea-4518-abc5-c52c98e875d9",
      "sourceHandle": "3D#TableOut",
      "target": "1893d8b2-5f22-4955-adae-aba3a662cc62",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-ae1456d7-470d-4619-9976-c3656a9c21523D#TableIn1"
    },
    {
      "source": "2c049449-c0ef-4db2-83b0-bec8272d6146",
      "target": "7ba07d71-472b-424e-8ad0-87cd18130ddf",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-35be45c0-3a5e-4311-b9ef-bef97b854f4e3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "58a40a6b-7e9a-4b7a-864c-1072fdbf532e",
      "sourceHandle": "3D#TableOut",
      "target": "7ba07d71-472b-424e-8ad0-87cd18130ddf",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-fdc5ac5e-a94d-4eef-9b52-8ad4d028cf9b3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn2"
    },
    {
      "source": "7ba07d71-472b-424e-8ad0-87cd18130ddf",
      "target": "2e808aea-3c82-4426-bd62-491997857b8f",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableOut-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "2e808aea-3c82-4426-bd62-491997857b8f",
      "sourceHandle": "3D#TableOut",
      "target": "1893d8b2-5f22-4955-adae-aba3a662cc62",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableOut-d8392d8f-361d-4a78-a53c-2ca0c947445c3D#TableIn2"
    },
    {
      "source": "183fc3f3-210c-40ef-9bcd-479be940ea5b",
      "sourceHandle": "Log#LogOut",
      "target": "7b0a8470-9afb-484b-a5f4-b368328ef448",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-1bb82150-193e-4d52-bbca-dde80465839dLog#LogOut-5085f918-8e62-4d32-bfd9-02406759d63eLog#LogTarget"
    },
    {
      "source": "7b0a8470-9afb-484b-a5f4-b368328ef448",
      "sourceHandle": "Log#LogSource",
      "target": "ec116e5c-847f-40e6-a279-d7eefccedb9f",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-b913f906-8dd7-400f-a50f-842d10dec1ddLog#LogSource-0ca58972-7a25-4a8b-8961-b10e3f671a34Log#LogTarget"
    },
    {
      "source": "ec116e5c-847f-40e6-a279-d7eefccedb9f",
      "sourceHandle": "Log#LogSource",
      "target": "3f18ebed-d1b4-4d74-b003-1ce7ba608e40",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-0ca58972-7a25-4a8b-8961-b10e3f671a34Log#LogSource-f0bed2d1-6003-4e5b-8b3e-8ac05977a020Log#LogTarget"
    },
    {
      "source": "d948b742-ed19-41a2-b5a8-8080c7910085",
      "target": "c3db9238-eee6-4c76-a1f1-773cba43ff99",
      "sourceHandle": "Log#LogSource",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-88de61ea-65ce-4799-99f1-bc9c71343514Log#LogSource-81c9ec2c-253a-4014-93f7-64dc799c0696Log#LogIn",
      "targetHandle": "Log#LogIn"
    },
    {
      "source": "74e6ab19-4aea-4518-abc5-c52c98e875d9",
      "sourceHandle": "3D#TableOut",
      "target": "c3db9238-eee6-4c76-a1f1-773cba43ff99",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-500b067d-ca42-4ea8-a772-7d1337ac3af23D#TableOut-81c9ec2c-253a-4014-93f7-64dc799c06963D#TableIn"
    },
    {
      "source": "c3db9238-eee6-4c76-a1f1-773cba43ff99",
      "target": "0a03bc68-7d2e-4e87-8273-aaa1a7842d25",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-81c9ec2c-253a-4014-93f7-64dc799c06963D#TableOut-731fd71a-dd5e-4cca-a734-0a11fe95749f3D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "3f18ebed-d1b4-4d74-b003-1ce7ba608e40",
      "sourceHandle": "Log#LogSource",
      "target": "d948b742-ed19-41a2-b5a8-8080c7910085",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-66066f93-50d0-4c40-a7ad-ce277020b41dLog#LogSource-88de61ea-65ce-4799-99f1-bc9c71343514Log#LogTarget"
    },
    {
      "source": "c3db9238-eee6-4c76-a1f1-773cba43ff99",
      "sourceHandle": "3D#TableOut",
      "target": "58a40a6b-7e9a-4b7a-864c-1072fdbf532e",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-81c9ec2c-253a-4014-93f7-64dc799c06963D#TableOut-eaa1198b-3d0f-4b6e-878c-d2101f6b14803D#TableIn"
    },
    {
      "source": "c3db9238-eee6-4c76-a1f1-773cba43ff99",
      "sourceHandle": "3D#TableOut",
      "target": "2c049449-c0ef-4db2-83b0-bec8272d6146",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-81c9ec2c-253a-4014-93f7-64dc799c06963D#TableOut-efd5690b-b276-400c-8905-9a3b437c850a3D#TableIn"
    },
    {
      "source": "0a03bc68-7d2e-4e87-8273-aaa1a7842d25",
      "sourceHandle": "3D#TableOut",
      "target": "2e808aea-3c82-4426-bd62-491997857b8f",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-731fd71a-dd5e-4cca-a734-0a11fe95749f3D#TableOut-65851cd0-8050-4d88-baea-646cfc3b34d73D#TableIn2"
    },
    {
      "source": "c3db9238-eee6-4c76-a1f1-773cba43ff99",
      "target": "01c0dc7e-c206-49c9-b15a-61cb05dfc328",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-81c9ec2c-253a-4014-93f7-64dc799c06963D#TableOut-a2cee15e-aa25-4a9b-8fff-ade2e0efd2b13D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "a3cb13f0-467f-4cc8-8dcc-9c8db11cd107",
      "sourceHandle": "Rom#RomOut",
      "target": "74e6ab19-4aea-4518-abc5-c52c98e875d9",
      "targetHandle": "Rom#RomIn",
      "id": "reactflow__edge-675f34e3-6496-4b62-bbb0-f3533b0ad1e3Rom#RomOut-0db07943-5e2e-4bdb-859a-c94c6fd05ab3Rom#RomIn"
    }
  ]
}

export default AfrMapGroup