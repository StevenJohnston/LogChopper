/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: post_start_enrich_decay_rpm_0x22ecc
 * Address:  0x22ECC
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint post_start_enrich_decay_rpm_0x22ecc(void)

{
  undefined2 uVar3;
  uint uVar1;
  undefined *puVar2;
  ushort uVar4;
  uint uVar5;
  
  uVar5 = 1;
  uVar3 = _DAT_00808944;
  if ((_DAT_0080a72a & 0x40) != 0) {
    uVar3 = func_0x0004dc84(_DAT_00808944,uMem00054522,0x40);
  }
  func_0x0004e410(0x63096);
  if ((((_DAT_00808892 & 4) == 0) || (_DAT_0080868c < uMem00054392)) ||
     (uMem00054394 <= _DAT_0080868c)) {
    uVar1 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x59EA0);
    puVar2 = &Discovered_2D_Engine_RPM_0x59EBC;
  }
  else {
    uVar1 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x59EAE);
    puVar2 = &Discovered_2D_Engine_RPM_0x59ECA;
  }
  uVar4 = func_0x0004e1a8(puVar2);
  if ((uVar1 & 0xffff) < (uint)_DAT_0080893c) {
    uVar5 = (uint)uMem00054028;
    uVar3 = _DAT_0080a53c;
  }
  else if (uVar4 < _DAT_0080893c) {
    uVar5 = (uint)uMem0005402a;
    uVar3 = _DAT_00808968;
  }
  _DAT_0080a6ca = uVar3;
  return uVar5;
}


