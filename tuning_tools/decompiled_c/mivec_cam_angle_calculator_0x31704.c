/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: mivec_cam_angle_calculator_0x31704
 * Address:  0x31704
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint mivec_cam_angle_calculator_0x31704(uint param_1)

{
  undefined4 uVar1;
  uint uVar2;
  undefined2 uVar3;
  undefined2 uStack_6;
  
  uStack_6 = _DAT_008089f6;
  _DAT_00808a10 = (undefined2)param_1;
  if ((_DAT_00808978 != 0) || (uVar2 = (uint)_DAT_00808a04, _DAT_008083bc != 0)) {
    uVar2 = param_1;
    uStack_6 = _DAT_00808a10;
  }
  uVar1 = func_0x0004e01c(uStack_6,uVar2,_DAT_008089ea);
  uVar3 = (undefined2)uVar2;
  uVar2 = func_0x0004e01c(param_1,uVar1,_DAT_008089e8);
  _DAT_00808a12 = (undefined2)uVar2;
  if ((param_1 & 0xffff) < (uVar2 & 0xffff)) {
    _DAT_00808a1e = func_0x0004e500(uVar2,param_1);
    if (_DAT_008083ba != 0) {
      _DAT_00808a1c = 0;
    }
    func_0x0004dd6c(_DAT_00808a1e,_DAT_00808a1c);
    _DAT_00808a20 = func_0x0004dcf4(0x100,_DAT_008089e8);
    uVar2 = func_0x0004e500(param_1,_DAT_00808a20);
    uVar2 = uVar2 & 0xffff;
    if (uVar2 == 0) {
      uVar2 = 1;
    }
  }
  else {
    _DAT_00808a1e = func_0x0004e500(param_1 & 0xffff,uVar2);
    func_0x0004dd6c(_DAT_00808a1e,_DAT_00808a1a);
    _DAT_00808a20 = func_0x0004dcf4(0x100,_DAT_008089e8);
    uVar2 = func_0x0004db80(param_1,_DAT_00808a20);
  }
  _DAT_00808a14 = (short)uVar2;
  _DAT_00808a16 = (short)uVar2;
  _DAT_00808a0c = uStack_6;
  _DAT_00808a0e = uVar3;
  if ((((uMem00053b4c <= _DAT_0080800c) && ((DAT_0080888a & 4) == 0)) &&
      (uMem00054232 <= _DAT_00808a1e)) && ((_DAT_00808d5e & 0x80) == 0)) {
    param_1 = uVar2;
  }
  if (_DAT_00808978 != 0) {
    _DAT_00808978 = _DAT_00808978 + -1;
  }
  return param_1;
}


