import { v4 as uuid } from "uuid";
import { AfrMlShifterData, AfrMlShifterType, AfrMlShifterNodeType } from "./AfrMlShifterTypes";

interface FactoryProps {
    x?: number;
    y?: number;
}

export const AfrMlShifterNodeFactory = ({ x = 0, y = 0 }: FactoryProps): AfrMlShifterNodeType => {
    const nodeId = uuid();
    return {
        id: nodeId,
        type: AfrMlShifterType,
        position: { x, y },
        data: new AfrMlShifterData({}),
        dragHandle: '.drag-handle', // Assuming a drag handle class
    };
};
