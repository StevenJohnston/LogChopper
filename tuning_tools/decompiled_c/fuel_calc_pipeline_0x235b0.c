/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: fuel_calc_pipeline_0x235b0
 * Address:  0x235B0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void fuel_calc_pipeline_0x235b0(int param_1)

{
  undefined4 uVar1;
  undefined4 uVar2;
  uint uVar3;
  ushort uVar4;
  undefined2 uVar5;
  uint uVar6;
  uint uVar7;
  ushort uStack_8;
  
  uStack_8 = func_0x0004dcf4((uint)_DAT_00808938 * (uint)_DAT_00808976,
                             (uint)_DAT_00808974 * 2 + 0x80,0x4000);
  uVar7 = (uint)**(ushort **)(param_1 + 0x50);
  func_0x0004ded0(_DAT_00808928);
  func_0x0004dd84(_DAT_00808fe8);
  func_0x0004dca8(_DAT_0080a26a,0xff);
  uVar1 = func_0x0004dd84(_DAT_00808962);
  uVar2 = func_0x0004db80(_DAT_00808c02,0x80);
  uVar1 = func_0x0004dca8(uVar1,uVar2,0x100);
  uVar6 = (uint)_DAT_0080a46c;
  if ((_DAT_0080a46a & 1) == 0) {
    if (uMem0005436e < _DAT_00808838) {
      _DAT_0080a46a = _DAT_0080a46a | 1;
    }
  }
  else if (_DAT_00808838 <= uMem00054370) {
    _DAT_0080a46a = _DAT_0080a46a & 0xfffe;
  }
  if (((_DAT_0080a46a & 1) == 0) && ((_DAT_00808878 & 0xf) == 0)) {
    func_0x0004e410(0x6268a);
    uVar4 = (ushort)uVar6;
    if (_DAT_00808300 != 0) goto LAB_000236e8;
    uVar6 = uVar6 + 1 & 0xffff;
    if (uVar6 == 0) {
      uVar6 = 0xffffffff;
    }
    uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5AD8E);
    uVar4 = (ushort)uVar6;
    if ((uVar3 & 0xffff) <= (uVar6 & 0xffff)) {
      uVar4 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5AD8E);
    }
  }
  else {
    uVar4 = _DAT_0080a46c;
    if (_DAT_00808300 != 0) goto LAB_000236e8;
    if (uVar6 != 0) {
      uVar4 = _DAT_0080a46c - 1;
    }
  }
  _DAT_00808300 = sMem00054372;
LAB_000236e8:
  if ((_DAT_00808870 & 0x11) != 0) {
    uVar4 = 0;
    _DAT_00808300 = sMem00054372;
  }
  _DAT_0080a46c = uVar4;
  uVar1 = func_0x0004de28(uVar1,uVar4 + 0x100);
  if (_DAT_00808686 <= uMem000540ce) {
    uVar7 = func_0x0004dd6c(uVar7,_DAT_00808938);
    if ((_DAT_00808646 & 0x20) == 0) {
      func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5AD80);
    }
    else {
      func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5AD72);
    }
    uVar6 = func_0x0004e490(2);
    if ((uVar6 & 0xffff) <= (uVar7 & 0xffff)) {
      uVar7 = uVar6;
    }
    uVar7 = func_0x0004dc84(uVar7,0x80,_DAT_00808938);
  }
  _DAT_0080897c = (undefined2)uVar7;
  if (((_DAT_00808848 & 2) == 0) || ((_DAT_008096ec & 4) == 0)) {
    if (uStack_8 < 0x81) {
      uStack_8 = 0x80;
    }
    uVar1 = func_0x0004dd84(uVar1,uStack_8);
  }
  else {
    uVar6 = (uint)uStack_8;
    _RAM_Boost_Error = func_0x00022b38();
    func_0x0004e410(0x61790);
    func_0x0004e410(0x617b6);
    uVar4 = func_0x0004e1a8(0x57a52);
    uVar7 = func_0x0004dd84(uVar6 & 0xffff,uVar7);
    if ((uVar7 & 0xffff) < (uint)uVar4) {
      uVar7 = (uint)uVar4;
    }
    _DAT_0080960a = (undefined2)uVar7;
  }
  func_0x0004dd84(uVar1,uVar7);
  uVar5 = func_0x0004def8();
  **(undefined2 **)(param_1 + 0x54) = uVar5;
  return;
}


