/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: rpm_transient_filter_0x19830
 * Address:  0x19830
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void rpm_transient_filter_0x19830(void)

{
  bool bVar1;
  int iVar2;
  undefined4 uVar3;
  undefined2 uVar4;
  uint uVar5;
  uint uVar6;
  
  uVar5 = (uint)_DAT_008086a2 << 0x10;
  bVar1 = _DAT_0080a5fc <= uVar5;
  if (bVar1) {
    iVar2 = func_0x0004e518(uVar5,_DAT_0080a5fc);
  }
  else {
    iVar2 = func_0x0004e518(_DAT_0080a5fc,uVar5);
  }
  uVar6 = (uint)!bVar1;
  uVar5 = iVar2 + 0x80U >> 8;
  if (0xffe < uVar5) {
    uVar5 = 0xfff;
  }
  _DAT_0080a604 = uVar5;
  func_0x0004e410(0x62bae);
  uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5CCB0);
  _DAT_0080a608 = (undefined2)uVar3;
  uVar4 = func_0x0004e490(uMem00054476,uVar3);
  iVar2 = func_0x0004e4b0(uVar5,uVar4);
  uVar3 = func_0x0004dc28(iVar2 + 0x4000U >> 0xf);
  if ((uVar6 & 0xffff) == 1) {
    uVar3 = func_0x0004db80(0x1000);
  }
  else {
    uVar3 = func_0x0004e500(0x1000,uVar3);
  }
  _DAT_0080a60a = (undefined2)uVar3;
  uVar5 = func_0x0004dc38(uVar3,uMem00054478,uMem0005447a);
  _DAT_0080a600 = uVar5 & 0xffff;
  return;
}


