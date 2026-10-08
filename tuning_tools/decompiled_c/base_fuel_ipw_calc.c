/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: base_fuel_ipw_calc
 * Address:  0x22BB8
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void base_fuel_ipw_calc(void)

{
  undefined4 uVar1;
  uint uVar2;
  
  uVar2 = (uint)uMem0080501e;
  uVar1 = func_0x0004e380(0x55017);
  _DAT_00808928 = func_0x0004ddbc((uint)uMem00053cc0 * (uVar2 & 0xffff) + 1 >> 1,uVar1);
  return;
}


