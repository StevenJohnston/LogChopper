import { NodeWithType } from "@/app/_components/FlowNodes/FlowNodesTypes";
import { BaseRomData } from "@/app/_components/FlowNodes/BaseRom/BaseRomTypes";

export const RomSelectorType = "romSelector";

export type RomSelectorNodeType = NodeWithType<BaseRomData, typeof RomSelectorType>;
