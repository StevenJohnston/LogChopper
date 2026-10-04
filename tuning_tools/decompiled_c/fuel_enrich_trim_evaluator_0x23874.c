/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: fuel_enrich_trim_evaluator_0x23874
 * Address:  0x23874
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void fuel_enrich_trim_evaluator_0x23874(void)

{
  byte bVar1;
  uint uVar3;
  int iVar4;
  undefined4 uVar5;
  uint uVar6;
  uint uVar7;
  uint uVar8;
  uint uVar9;
  undefined2 uVar10;
  byte bVar2;
  
  if (((_DAT_00808878 & 0x10) != 0) || ((_DAT_00808646 & 0x80) == 0)) {
    _DAT_00808118 = sMem000530b4;
  }
  uVar10 = 0x18;
  if ((cMem00050390 == '\x02') && ((_DAT_0080888c & 8) != 0)) {
    uVar7 = (uint)bMem0005dd67;
    uVar8 = (uint)bMem0005dd68;
    goto LAB_00023ac4;
  }
  if ((DAT_00808888 & 0x20) != 0) {
    uVar7 = (uint)bMem00055656;
    uVar8 = (uint)bMem00055657;
    goto LAB_00023ac4;
  }
  if (_DAT_00808118 == 0) {
    bVar1 = bMem00055658;
    bVar2 = bMem00055659;
    if (_DAT_00808686 < uMem00053ab2) {
      bVar1 = bMem00057160;
      bVar2 = bMem00057161;
    }
    uVar8 = (uint)bVar2;
    uVar7 = (uint)bVar1;
    uVar10 = 0;
    if ((_DAT_00808646 & 0x20) == 0) {
      uVar10 = 0x12;
    }
    goto LAB_00023ac4;
  }
  if ((DAT_0080887e & 2) != 0) {
    uVar7 = (uint)bMem0005565a;
    uVar8 = (uint)bMem0005565b;
    uVar10 = _DAT_00808dd4;
    goto LAB_00023ac4;
  }
  uVar3 = func_0x00023ae0();
  iVar4 = func_0x0004e360(0x636c8);
  uVar3 = uVar3 & 0xffff;
  uVar7 = (uint)*(byte *)(iVar4 + uVar3);
  uVar9 = uVar3;
  iVar4 = func_0x0004e360(0x63708);
  uVar8 = (uint)*(byte *)(iVar4 + uVar3);
  if (cMem000503bc != '\0') {
    iVar4 = func_0x0004e360(0x636e8);
    uVar6 = (uint)*(byte *)(iVar4 + uVar3);
    iVar4 = func_0x0004e360(0x63728,uVar6);
    uVar3 = (uint)*(byte *)(iVar4 + uVar3);
    uVar7 = func_0x0004e0d4(uVar6,uVar7,_DAT_00804b06);
    uVar8 = func_0x0004e0d4(uVar3,uVar8,_DAT_00804b06);
  }
  if (_DAT_00808686 < uMem00053ab0) {
    iVar4 = func_0x0004e360(0x637c8);
    uVar3 = uVar9 & 0xffff;
    uVar7 = (uint)*(byte *)(iVar4 + uVar3);
    iVar4 = func_0x0004e360(0x637e8);
    uVar8 = (uint)*(byte *)(iVar4 + uVar3);
  }
  uVar10 = (undefined2)(uVar9 << 1);
  if (((_DAT_00808844 & 2) != 0) && ((_DAT_008088b4 & 0x10) != 0)) {
    if (_DAT_008086cc < uMem0005378c) {
      if (uMem0005378a < _DAT_008086cc) goto LAB_00023a70;
      func_0x0004ddbc(uVar7,uMem00053782);
      uVar7 = func_0x0004dc14();
      func_0x0004ddbc(uVar8,uMem00053784);
    }
    else {
      func_0x0004ddbc(uVar7,uMem00053786);
      uVar7 = func_0x0004dc14();
      func_0x0004ddbc(uVar8,uMem00053788);
    }
    uVar8 = func_0x0004dc14();
  }
LAB_00023a70:
  if ((cMem000503b5 != '\0') && (uMem00053ab6 <= _DAT_008048ba)) {
    func_0x0004e410(0x61bd0);
    uVar5 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x57138);
    func_0x0004ddbc(uVar7,uVar5);
    uVar7 = func_0x0004dc14();
    uVar5 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5714C);
    func_0x0004ddbc(uVar8,uVar5);
    uVar8 = func_0x0004dc14();
  }
LAB_00023ac4:
  _DAT_008088e0 = (short)uVar7;
  _DAT_008088e2 = (short)uVar8;
  _DAT_00808dd4 = uVar10;
  return;
}


