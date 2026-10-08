/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: knock_cylinder_trim_calc_0x17e9c
 * Address:  0x17E9C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void knock_cylinder_trim_calc_0x17e9c(void)

{
  undefined4 uVar1;
  
  func_0x0004e410(0x61c14);
  func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5057A);
  uVar1 = func_0x0004e490(3);
  if ((_DAT_00808844 & 0x80) != 0) {
    uVar1 = func_0x0004e500(_DAT_008094f2);
  }
  func_0x0004dcf4(uVar1,_DAT_008094ea,0x4000);
  func_0x0004db80(0x80);
  _DAT_0080970c = func_0x0004e500(_DAT_008094ec);
  _DAT_0080971a = func_0x000179f4(0x80,2000);
  func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5058E);
  uVar1 = func_0x0004e490(3);
  if ((_DAT_00808844 & 0x80) != 0) {
    uVar1 = func_0x0004e500(_DAT_008094f2);
  }
  func_0x0004dcf4(uVar1,_DAT_008094ea,0x4000);
  func_0x0004db80(0x80);
  _DAT_0080970e = func_0x0004e500(_DAT_008094ec);
  _DAT_0080971c = func_0x000179f4(0x80,2000);
  return;
}


