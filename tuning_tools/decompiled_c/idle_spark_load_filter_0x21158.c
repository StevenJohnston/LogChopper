/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_spark_load_filter_0x21158
 * Address:  0x21158
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 idle_spark_load_filter_0x21158(void)

{
  undefined2 uVar1;
  ushort uVar2;
  short sVar3;
  undefined4 uVar4;
  
  uVar4 = 0x80;
  uVar2 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5E2_0x56196);
  if (uVar2 < _DAT_008087bc) {
    uVar4 = func_0x0004e1a8(0x56180);
  }
  if ((_DAT_00808888 & 2) != 0) {
    uVar4 = func_0x0004e500(uVar4,uMem000531b0);
  }
  if ((DAT_00808a32 & 0x10) != 0) {
    uVar4 = func_0x0004e500(uVar4,uMem000532a2);
  }
  if ((uMem00053298 <= _DAT_008087bc) && (uMem0005329c <= _DAT_00808686)) {
    uVar1 = uMem000532a0;
    if (uMem0005329a <= _DAT_00808686) {
      uVar1 = uMem0005329e;
    }
    uVar4 = func_0x0004e500(uVar4,uVar1);
  }
  sVar3 = func_0x00021224();
  if (sVar3 != 0) {
    uVar4 = func_0x0004e500(uVar4,uMem00053aec);
  }
  _DAT_00808a4c = (short)uVar4;
  return uVar4;
}


