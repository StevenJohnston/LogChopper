import { nanoid } from 'nanoid';
import { RomSelectorNodeType, RomSelectorType } from './RomSelectorTypes';
import { BaseRomData } from '@/app/_components/FlowNodes/BaseRom/BaseRomTypes';

export const RomSelectorNodeFactory = (position: { x: number; y: number; }): RomSelectorNodeType => ({
    id: nanoid(),
    type: RomSelectorType,
    position,
    data: new BaseRomData({}),
});
