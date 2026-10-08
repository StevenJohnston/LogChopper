/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_spark_stability_0x21e9c
 * Address:  0x21E9C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint idle_spark_stability_0x21e9c(uint param_1)

{
  uint uVar1;
  int iVar2;
  undefined4 uVar3;
  
  uVar1 = param_1 & 0xffff;
  if (0x13 < uVar1) {
    iVar2 = func_0x0004e500((_RAM_Load_Timing >> 1) + 0x20,
                            (uint)_DAT_00808bbe + (uint)_Atmospheric_Boost_Omni4bar);
    _RAM_Boost_Error = func_0x0004dc14(iVar2 << 2);
    func_0x0004e410(0x62fe8);
    uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x58CC8);
    iVar2 = func_0x0004e500(param_1 - 0x14,uVar3);
    param_1 = iVar2 + 0x14;
    if (uVar1 < (param_1 & 0xffff)) {
      param_1 = uVar1;
    }
  }
  return param_1;
}


