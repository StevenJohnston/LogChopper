import { NodeWithType } from "@/app/_components/FlowNodes/FlowNodesTypes";
import { BaseLogData } from "@/app/_components/FlowNodes/BaseLog/BaseLogTypes";

export const LogSelectorType = "logSelector";

export type LogSelectorNodeType = NodeWithType<BaseLogData, typeof LogSelectorType>;
