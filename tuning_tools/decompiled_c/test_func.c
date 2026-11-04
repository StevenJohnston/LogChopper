/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: test_func
 * Address:  0x310BC
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void test_func(ushort param_1,undefined2 param_2)

{
  int iVar1;
  ushort uVar2;
  ushort uVar3;
  
  uVar2 = 1;
  iVar1 = 0;
  for (uVar3 = 0; uVar3 < 6; uVar3 = uVar3 + 1) {
    if (((((uVar2 & param_1) != 0) && ((_DAT_008099fc & param_1) != 0)) &&
        ((_DAT_008099fa & param_1) == 0)) &&
       (((_DAT_0080979c & 4) != 0 && ((DAT_00809948 & 0x20) == 0)))) {
      *(undefined2 *)(iVar1 + 0x80998c) = param_2;
    }
    iVar1 = iVar1 + 2;
    uVar2 = uVar2 << 1;
  }
  return;
}


