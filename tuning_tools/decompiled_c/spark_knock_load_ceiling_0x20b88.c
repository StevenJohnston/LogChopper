/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: spark_knock_load_ceiling_0x20b88
 * Address:  0x20B88
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int spark_knock_load_ceiling_0x20b88(void)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  
  if (((_DAT_00808854 & 8) == 0) || ((_DAT_00808854 & 0x2000) == 0)) {
    uVar2 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5E2_0x56158);
    iVar3 = func_0x0004de60((uint)_DAT_00808a60 * (uint)uMem000531da,uVar2);
    iVar1 = func_0x00020be8();
    iVar1 = iVar1 + iVar3;
  }
  else {
    iVar1 = func_0x0004e330(0x63668);
    iVar1 = iVar1 << 1;
  }
  _DAT_00808a58 = (short)iVar1;
  return iVar1;
}


