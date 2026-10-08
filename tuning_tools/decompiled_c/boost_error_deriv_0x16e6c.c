/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: boost_error_deriv_0x16e6c
 * Address:  0x16E6C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void boost_error_deriv_0x16e6c(void)

{
  undefined4 uVar1;
  uint uVar2;
  
  uVar2 = (uint)_DAT_00808934;
  func_0x0004e410(0x62ef0);
  uVar1 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x503F8);
  func_0x0004e490(uVar2,uVar1);
  return;
}


