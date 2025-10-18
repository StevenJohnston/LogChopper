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
  "groupName": "AFRMAP FIX2",
  "nodes": [
    {
      "position": {
        "x": -176.1247353016597,
        "y": -399.9391857385709
      },
      "id": "69894bc7-d669-410b-8546-c4828eb15320",
      "type": "GroupNode",
      "data": {
        "name": "AFRMAP FIX2",
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
      "id": "a5d2146a-9483-43f6-811d-545fc40f0df0",
      "type": "BaseRomNode",
      "data": {},
      "position": {
        "x": 35.271457383317625,
        "y": 643.9872165694227
      },
      "dragHandle": ".drag-handle",
      "width": 159,
      "height": 74,
      "positionAbsolute": {
        "x": -140.8532779183421,
        "y": 244.04803083085176
      },
      "dragging": true,
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    },
    {
      "id": "5f8de42f-0019-46e9-849a-e6e6c6d6721d",
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
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    },
    {
      "id": "8d2e769b-e5b9-41f4-9aa5-27abdff9f74b",
      "type": "BaseLogNode",
      "position": {
        "x": 54.49010215096473,
        "y": 47.58454532905341
      },
      "data": {},
      "width": 161,
      "height": 50,
      "positionAbsolute": {
        "x": -121.63463315069498,
        "y": -352.3546404095175
      },
      "dragging": false,
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    },
    {
      "position": {
        "x": 179.37047694317408,
        "y": 209.92798194068837
      },
      "id": "0383cb40-70fd-43b0-a233-55b291240cc1",
      "type": "TpsAfrDeleteNode",
      "data": {},
      "dragHandle": ".drag-handle",
      "width": 294,
      "height": 50,
      "selected": false,
      "positionAbsolute": {
        "x": 3.245741641514371,
        "y": -190.01120379788256
      },
      "dragging": true,
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    },
    {
      "id": "93f5f84f-339c-41bc-84a6-4cf011742bd8",
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
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    },
    {
      "id": "272ca3dc-87d9-43a0-8243-bb50702be509",
      "type": "LogAlterNode",
      "position": {
        "x": 564.767513564711,
        "y": 373.3712467095722
      },
      "data": {
        "func": "AFR / AFRMAP",
        "newLogField": "AFRDIFF"
      },
      "width": 209,
      "height": 170,
      "positionAbsolute": {
        "x": 388.64277826305124,
        "y": -26.56793902899875
      },
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "df47f612-8b50-41e2-848e-c3dcd242cdaa",
      "type": "FillLogTableNode",
      "position": {
        "x": 702.2627946495462,
        "y": 556.3840888488639
      },
      "data": {
        "weighted": true,
        "scalingValue": null
      },
      "width": 178,
      "height": 79,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 526.1380593478865,
        "y": 156.444903110293
      },
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    },
    {
      "id": "775e0851-b273-4cdd-a375-fed0faebb4a0",
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
      "width": 299,
      "height": 119,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1141.17585175047,
        "y": 2.056324397617459
      },
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    },
    {
      "id": "42bcc02c-4bce-4d9c-ab26-3bb31746bc1c",
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
      "width": 299,
      "height": 119,
      "positionAbsolute": {
        "x": 1015.4158925789566,
        "y": -144.26156517814195
      },
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "1e4ceace-deaa-4d91-9403-415bc00c1a17",
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
      "width": 299,
      "height": 119,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 820.6427782630512,
        "y": -326.56793902899864
      },
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    },
    {
      "id": "6adf05c2-a63a-48f6-ab57-d7d51d972d2f",
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
      "width": 299,
      "height": 119,
      "positionAbsolute": {
        "x": 1111.6427782630512,
        "y": 176.4320609710013
      },
      "dragging": false,
      "dragHandle": ".drag-handle",
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    },
    {
      "id": "504bcf54-5c1a-4ee2-8aca-810e3430f003",
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
      "width": 321,
      "height": 100,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1701.7976898533448,
        "y": -369.83313089682076
      },
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    },
    {
      "id": "e149b17f-f894-43f2-81bd-c099de141c9c",
      "type": "CombineNode",
      "position": {
        "x": 1914.6095790904706,
        "y": 207.74089568488603
      },
      "data": {
        "func": "diff = 1-joinTable[y][x];\nweight = sourceTable[y][x];\n1 + diff * weight;\nk = 20;\nnewWeight = weight   / (1 + exp(-k * (weight  - 0.1)));\nsuperWeight = 1-(1-newWeight )^10;\nnewDiff = 1 - superWeight * diff;\nnewDiff = newDiff < 0.9 ? 0.9 : (newDiff > 1.1 ? 1.1: newDiff);\n(newDiff-1)/5+1",
        "tableType": "3D",
        "scalingValue": null
      },
      "width": 455,
      "height": 292,
      "positionAbsolute": {
        "x": 1738.4848437888108,
        "y": -192.1982900536849
      },
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320",
      "dragHandle": ".drag-handle",
      "dragging": false
    },
    {
      "id": "87ba202d-0546-44a0-a616-deb379b21a64",
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
      "width": 270,
      "height": 100,
      "dragging": false,
      "dragHandle": ".drag-handle",
      "positionAbsolute": {
        "x": 1954.1963186150465,
        "y": 175.32174630860015
      },
      "parentNode": "69894bc7-d669-410b-8546-c4828eb15320"
    }
  ],
  "edges": [
    {
      "source": "5f8de42f-0019-46e9-849a-e6e6c6d6721d",
      "sourceHandle": "3D#TableOut",
      "target": "87ba202d-0546-44a0-a616-deb379b21a64",
      "targetHandle": "3D#TableIn1",
      "id": "reactflow__edge-e208d27a-cf9f-4c25-9045-10162111bfc23D#TableOut-ae1456d7-470d-4619-9976-c3656a9c21523D#TableIn1"
    },
    {
      "source": "42bcc02c-4bce-4d9c-ab26-3bb31746bc1c",
      "target": "504bcf54-5c1a-4ee2-8aca-810e3430f003",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-35be45c0-3a5e-4311-b9ef-bef97b854f4e3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "775e0851-b273-4cdd-a375-fed0faebb4a0",
      "sourceHandle": "3D#TableOut",
      "target": "504bcf54-5c1a-4ee2-8aca-810e3430f003",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-fdc5ac5e-a94d-4eef-9b52-8ad4d028cf9b3D#TableOut-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableIn2"
    },
    {
      "source": "504bcf54-5c1a-4ee2-8aca-810e3430f003",
      "target": "e149b17f-f894-43f2-81bd-c099de141c9c",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-299e225b-fcbf-4aca-9dec-d816a426a8273D#TableOut-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableIn1",
      "targetHandle": "3D#TableIn1"
    },
    {
      "source": "e149b17f-f894-43f2-81bd-c099de141c9c",
      "sourceHandle": "3D#TableOut",
      "target": "87ba202d-0546-44a0-a616-deb379b21a64",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-934e662d-1607-49c7-9fae-e9c2734c981b3D#TableOut-d8392d8f-361d-4a78-a53c-2ca0c947445c3D#TableIn2"
    },
    {
      "source": "272ca3dc-87d9-43a0-8243-bb50702be509",
      "target": "df47f612-8b50-41e2-848e-c3dcd242cdaa",
      "sourceHandle": "Log#LogSource",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-88de61ea-65ce-4799-99f1-bc9c71343514Log#LogSource-81c9ec2c-253a-4014-93f7-64dc799c0696Log#LogIn",
      "targetHandle": "Log#LogIn"
    },
    {
      "source": "5f8de42f-0019-46e9-849a-e6e6c6d6721d",
      "sourceHandle": "3D#TableOut",
      "target": "df47f612-8b50-41e2-848e-c3dcd242cdaa",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-500b067d-ca42-4ea8-a772-7d1337ac3af23D#TableOut-81c9ec2c-253a-4014-93f7-64dc799c06963D#TableIn"
    },
    {
      "source": "df47f612-8b50-41e2-848e-c3dcd242cdaa",
      "target": "6adf05c2-a63a-48f6-ab57-d7d51d972d2f",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-81c9ec2c-253a-4014-93f7-64dc799c06963D#TableOut-731fd71a-dd5e-4cca-a734-0a11fe95749f3D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "93f5f84f-339c-41bc-84a6-4cf011742bd8",
      "sourceHandle": "Log#LogSource",
      "target": "272ca3dc-87d9-43a0-8243-bb50702be509",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-66066f93-50d0-4c40-a7ad-ce277020b41dLog#LogSource-88de61ea-65ce-4799-99f1-bc9c71343514Log#LogTarget"
    },
    {
      "source": "df47f612-8b50-41e2-848e-c3dcd242cdaa",
      "sourceHandle": "3D#TableOut",
      "target": "775e0851-b273-4cdd-a375-fed0faebb4a0",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-81c9ec2c-253a-4014-93f7-64dc799c06963D#TableOut-eaa1198b-3d0f-4b6e-878c-d2101f6b14803D#TableIn"
    },
    {
      "source": "df47f612-8b50-41e2-848e-c3dcd242cdaa",
      "sourceHandle": "3D#TableOut",
      "target": "42bcc02c-4bce-4d9c-ab26-3bb31746bc1c",
      "targetHandle": "3D#TableIn",
      "id": "reactflow__edge-81c9ec2c-253a-4014-93f7-64dc799c06963D#TableOut-efd5690b-b276-400c-8905-9a3b437c850a3D#TableIn"
    },
    {
      "source": "6adf05c2-a63a-48f6-ab57-d7d51d972d2f",
      "sourceHandle": "3D#TableOut",
      "target": "e149b17f-f894-43f2-81bd-c099de141c9c",
      "targetHandle": "3D#TableIn2",
      "id": "reactflow__edge-731fd71a-dd5e-4cca-a734-0a11fe95749f3D#TableOut-65851cd0-8050-4d88-baea-646cfc3b34d73D#TableIn2"
    },
    {
      "source": "df47f612-8b50-41e2-848e-c3dcd242cdaa",
      "target": "1e4ceace-deaa-4d91-9403-415bc00c1a17",
      "sourceHandle": "3D#TableOut",
      "style": {
        "stroke": "black"
      },
      "id": "reactflow__edge-81c9ec2c-253a-4014-93f7-64dc799c06963D#TableOut-a2cee15e-aa25-4a9b-8fff-ade2e0efd2b13D#TableIn",
      "targetHandle": "3D#TableIn"
    },
    {
      "source": "a5d2146a-9483-43f6-811d-545fc40f0df0",
      "sourceHandle": "Rom#RomOut",
      "target": "5f8de42f-0019-46e9-849a-e6e6c6d6721d",
      "targetHandle": "Rom#RomIn",
      "id": "reactflow__edge-675f34e3-6496-4b62-bbb0-f3533b0ad1e3Rom#RomOut-0db07943-5e2e-4bdb-859a-c94c6fd05ab3Rom#RomIn"
    },
    {
      "source": "8d2e769b-e5b9-41f4-9aa5-27abdff9f74b",
      "sourceHandle": "Log#LogOut",
      "target": "0383cb40-70fd-43b0-a233-55b291240cc1",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-8d2e769b-e5b9-41f4-9aa5-27abdff9f74bLog#LogOut-0383cb40-70fd-43b0-a233-55b291240cc1Log#LogTarget"
    },
    {
      "source": "0383cb40-70fd-43b0-a233-55b291240cc1",
      "sourceHandle": "Log#LogSource",
      "target": "93f5f84f-339c-41bc-84a6-4cf011742bd8",
      "targetHandle": "Log#LogTarget",
      "id": "reactflow__edge-0383cb40-70fd-43b0-a233-55b291240cc1Log#LogSource-93f5f84f-339c-41bc-84a6-4cf011742bd8Log#LogTarget"
    }
  ]
}

export default AfrMapGroup