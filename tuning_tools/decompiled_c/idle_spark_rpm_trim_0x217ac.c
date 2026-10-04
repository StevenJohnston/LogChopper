/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_spark_rpm_trim_0x217ac
 * Address:  0x217AC
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_spark_rpm_trim_0x217ac(void)

{
  ushort uVar1;
  
  func_0x0004e410(0x61720);
  _DAT_00808a82 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x561DA);
  func_0x0004e410(0x623fc);
  func_0x0004e410(0x62420);
  uVar1 = func_0x0004e1a8(0x585aa);
  _DAT_00808a84 = uVar1 << 4;
  _DAT_0080ab60 = uVar1 & 0xfff;
  return;
}


