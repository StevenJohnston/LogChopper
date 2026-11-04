/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_crank_angle_0x37240
 * Address:  0x37240
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_crank_angle_0x37240(void)

{
  short sVar1;
  bool bVar2;
  uint uVar3;
  int iVar4;
  uint uVar5;
  uint uVar6;
  int iVar7;
  undefined2 uStack_a;
  undefined2 uStack_8;
  
  if ((((_DAT_0080979c & 4) != 0) && ((DAT_00809948 & 0x20) == 0)) && (_DAT_008080b8 != 0)) {
    bVar2 = false;
    uStack_8 = 1;
    iVar7 = 0;
    for (uStack_a = 0; uStack_a < 4; uStack_a = uStack_a + 1) {
      if (*(short *)(iVar7 + 0x80998c) != -1) {
        sVar1 = *(short *)(iVar7 + 0x8099e8);
        uVar5 = (uint)*(ushort *)(iVar7 + 0x80998c);
        uVar6 = uVar5;
        if ((uVar5 != 0xffff) && (_DAT_00809972 != 0)) {
          uVar5 = func_0x0004e500(uVar5,_DAT_00809972);
          *(short *)(iVar7 + 0x80998c) = (short)uVar5;
        }
        uVar3 = uVar5 & 0xffff;
        if (uVar3 == 0xffff) {
LAB_00037310:
          iVar4 = 0;
        }
        else if (uVar3 == 2) {
          iVar4 = 1;
        }
        else if ((uVar3 == 1) || ((uVar3 == 0 && ((uVar6 & 0xffff) != 0)))) {
          iVar4 = 2;
        }
        else {
          if ((uVar5 & 0xffff) != 0) goto LAB_00037310;
          iVar4 = 3;
        }
        if ((iVar4 != 0) && ((iVar4 == 2 || (iVar4 == 3)))) {
          if (sVar1 != 0) {
            func_0x0000da8c(uStack_8);
          }
          bVar2 = true;
          _DAT_008099fa = _DAT_008099fa | uStack_8;
          *(undefined2 *)(iVar7 + 0x80998c) = 0xffff;
        }
      }
      iVar7 = iVar7 + 2;
      uStack_8 = uStack_8 << 1;
    }
    if ((bVar2) || (_DAT_0080885e != 0)) {
      func_0x00031454();
    }
  }
  return;
}


