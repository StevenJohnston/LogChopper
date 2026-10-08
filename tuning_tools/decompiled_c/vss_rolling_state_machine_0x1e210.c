/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: vss_rolling_state_machine_0x1e210
 * Address:  0x1E210
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void vss_rolling_state_machine_0x1e210(int param_1)

{
  byte *pbVar1;
  undefined2 uVar2;
  ushort uVar3;
  undefined2 uVar4;
  uint uVar5;
  undefined *puVar6;
  
  puVar6 = &Discovered_2D_Engine_RPM_0x5591A;
  uVar5 = (uint)uMem00053166;
  uVar4 = **(undefined2 **)(param_1 + 0x28);
  if (cMem000503bc != '\0') {
    uVar5 = func_0x0004e0d4(uMem0005317c,uVar5,_DAT_00804b06);
  }
  if ((_DAT_008088b4 & 1) == 0) {
    if ((_DAT_008088b4 & 2) == 0) goto LAB_0001e2c0;
    puVar6 = &Discovered_2D_Engine_RPM_0x5593E;
    uVar2 = uMem00053180;
    uVar3 = uMem0005316a;
  }
  else {
    puVar6 = &Discovered_2D_Engine_RPM_0x5592C;
    uVar2 = uMem0005317e;
    uVar3 = uMem00053168;
  }
  uVar5 = (uint)uVar3;
  if (cMem000503bc != '\0') {
    uVar5 = func_0x0004e0d4(uVar2,uVar5,_DAT_00804b06);
  }
LAB_0001e2c0:
  if ((**(ushort **)(param_1 + 0x18) & 0x80) == 0) {
    puVar6 = &Discovered_2D_Engine_RPM_0x55908;
  }
  if (_DAT_008085c4 == 0) {
    func_0x0004db80(uVar4,0x80);
    _RAM_Boost_Error = func_0x0004e500(uVar5);
    func_0x0004e410(0x616ec);
    uVar4 = func_0x0004e1a8(puVar6);
    **(undefined2 **)(param_1 + 0x34) = uVar4;
  }
  if (((**(ushort **)(param_1 + 0x18) & 0x80) == 0) || (_DAT_008085c4 != 0)) {
    pbVar1 = (byte *)(*(int *)(param_1 + 0x24c) + 1);
    *pbVar1 = *pbVar1 & 0xfe;
  }
  else {
    pbVar1 = (byte *)(*(int *)(param_1 + 0x24c) + 1);
    *pbVar1 = *pbVar1 | 1;
  }
  return;
}


