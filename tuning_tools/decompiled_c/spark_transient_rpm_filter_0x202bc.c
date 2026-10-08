/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: spark_transient_rpm_filter_0x202bc
 * Address:  0x202BC
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void spark_transient_rpm_filter_0x202bc(void)

{
  int iVar1;
  int iVar2;
  uint uVar3;
  
  if (((_DAT_00808a32 & 4) != 0) || (_DAT_00808a72 != 0)) {
    if (cMem00050364 == '\0') {
      func_0x0004e410(0x616b6);
      uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x56210);
    }
    else {
      uVar3 = (uint)_DAT_00808b14;
    }
    func_0x0004e410(0x61748);
    iVar1 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5621A);
    iVar2 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x56222);
    func_0x0004dcf4(uVar3,iVar1 * iVar2,0x4000);
    _DAT_00808a76 = func_0x0004dc14();
  }
  return;
}


