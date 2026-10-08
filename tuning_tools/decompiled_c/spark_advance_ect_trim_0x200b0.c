/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: spark_advance_ect_trim_0x200b0
 * Address:  0x200B0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 spark_advance_ect_trim_0x200b0(void)

{
  ushort uVar1;
  ushort uVar3;
  undefined4 uVar2;
  
  func_0x0004e410(0x63298);
  uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x561FC);
  uVar1 = _DAT_008087b4;
  if (_IAT_to_switch_Load_from_Baro_Temp_to_Baro < _DAT_008086a2) {
    uVar1 = _DAT_00808fea;
  }
  if ((((_DAT_00808686 < uMem0005323c) || ((_DAT_00808858 & 1) != 0)) || ((_DAT_00808854 & 8) != 0))
     || (((_DAT_00808aa0 & 0x40) == 0 || (uVar1 < uVar3)))) {
    uVar2 = 0;
  }
  else {
    uVar2 = 1;
  }
  return uVar2;
}


