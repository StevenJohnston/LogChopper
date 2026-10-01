/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: table_interpolate_2d_and_3d
 * Address:  0x4E1A8
 * Description: Core 2D Curve and 3D Surface Interpolation Engine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


undefined2 table_interpolate_2d_and_3d(short *param_1)

{
  ushort uVar1;
  int iVar2;
  uint uVar3;
  undefined2 uVar4;
  uint uVar5;
  uint uVar6;
  uint uVar7;
  byte *pbVar8;
  int in_FP;
  
  uVar5 = (uint)(byte)*param_1;
  uVar1 = *(ushort *)((short)(*param_1 + 2) + in_FP);
  uVar3 = uVar1 & 0xff;
  uVar6 = (uint)(uVar1 >> 8);
  if (*(char *)param_1 == '\x03') {
    iVar2 = uVar3 + (uint)*(byte *)(param_1 + 3) *
                    (*(ushort *)((short)(*param_1 + 4) + in_FP) & 0xff);
    pbVar8 = (byte *)((int)param_1 + iVar2 + 7);
    uVar3 = func_0x0004e3a0(*pbVar8 + uVar5 & 0xff,
                            *(byte *)((int)param_1 + iVar2 + 8) + uVar5 & 0xff,uVar6);
    uVar7 = func_0x0004e3a0(pbVar8[*(byte *)(param_1 + 3)] + uVar5 & 0xff,
                            (pbVar8 + *(byte *)(param_1 + 3))[1] + uVar5 & 0xff,uVar6);
    uVar6 = (uint)(*(ushort *)((short)(*param_1 + 4) + in_FP) >> 8);
  }
  else {
    uVar7 = *(byte *)((int)param_1 + uVar3 + 5) + uVar5 & 0xff;
    uVar3 = *(byte *)((int)param_1 + uVar3 + 4) + uVar5 & 0xff;
  }
  uVar4 = func_0x0004e3a0(uVar3,uVar7,uVar6);
  return uVar4;
}


