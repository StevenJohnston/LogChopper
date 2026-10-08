/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: vehicle_speed_moving_check
 * Address:  0x1EBB8
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void vehicle_speed_moving_check(void)

{
  undefined2 uVar1;
  
  if (_DAT_00804abc == 0) {
    _DAT_00804abc = func_0x0004e4b0(_DAT_00804ac0,1000);
  }
  if ((DAT_00808868 & 1) != 0) {
    uVar1 = func_0x0004dcf4(_DAT_0080883a,0x8d,0x168);
    _DAT_00804abc = func_0x0004dba0(_DAT_00804abc,uVar1);
  }
  _DAT_00804ac0 = func_0x0004df84(_DAT_00804abc,1000);
  return;
}


