import { nanoid } from 'nanoid';
import { RomSelectorType } from './RomSelectorTypes';
import { BaseRomData } from '@/app/_components/FlowNodes/BaseRom/BaseRomTypes';

export const RomSelectorNodeFactory = (position: { x: number; y: number; }) => ({
    id: nanoid(),
    type: RomSelectorType,
    position,
    data: new BaseRomData({}),
});
