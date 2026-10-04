/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_func_0277a0
 * Address:  0x277A0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_func_0277a0(void)

{
  undefined2 *in_R4;
  
  _DAT_00808b54 = *in_R4;
  _DAT_00808b56 = *in_R4;
  _DAT_008045c0 = func_0x0004df34(_DAT_00808b54);
  RAM_Engine_RPM_High = RAM_Engine_RPM_High & 0x7f;
  RAM_Engine_RPM_High = RAM_Engine_RPM_High | 0x40;
  func_0x00000328();
  return;
}


