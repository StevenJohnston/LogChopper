/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: boost_solenoid_duty_eval_0x16eb4
 * Address:  0x16EB4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void boost_solenoid_duty_eval_0x16eb4(void)

{
  undefined4 uVar1;
  undefined4 uVar2;
  undefined4 uVar3;
  short sVar5;
  uint uVar4;
  uint uVar6;
  
  uVar1 = func_0x0004db80(_DAT_00809504,_DAT_008094e8);
  uVar6 = (uint)(_DAT_008096d2 >> 2);
  func_0x0001afb4(uVar6,_DAT_00808796);
  uVar2 = func_0x0004e490(3);
  _DAT_008094d8 = (undefined2)uVar2;
  if ((_DAT_00808844 & 0x80) != 0) {
    uVar3 = func_0x00016e14();
    uVar2 = func_0x0004e500(uVar2,uVar3);
  }
  uVar2 = func_0x0004dcf4(uVar2,_DAT_008094ea,0x4000);
  if (((_DAT_00808870 & 8) != 0) && ((_DAT_00808646 & 0x80) != 0)) {
    uVar2 = 0;
  }
  func_0x0004db80(uVar2,0x80);
  _DAT_008094e0 = func_0x0004e500(uVar1);
  _DAT_0080971e = func_0x000179f4(_DAT_008094e0,0x80,2000);
  func_0x0004e410(0x61c14);
  _DAT_0080a874 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5EFB6);
  if (_DAT_0080971e < _DAT_00809720) {
    _DAT_00809720 = func_0x0004e01c(_DAT_00809720,_DAT_0080971e,_DAT_0080a874);
  }
  else {
    _DAT_00809720 = _DAT_0080971e;
  }
  _DAT_0080a872 = func_0x0004e500(_DAT_00809712,_DAT_00809720);
  if ((_DAT_00808848 & 2) == 0) {
    return;
  }
  if ((_DAT_00808c2c & 2) == 0) {
    if (_DAT_0080a7fc == 0) {
      _DAT_008096ec = _DAT_008096ec | 1;
    }
    else {
      _DAT_008096ec = _DAT_008096ec & 0xfffe;
    }
    sVar5 = func_0x00018630();
    if (sVar5 == 0) {
      _DAT_008096ec = _DAT_008096ec & 0xfffd;
    }
    else {
      _DAT_008096ec = _DAT_008096ec | 2;
    }
  }
  else {
    _DAT_008096ec = _DAT_008096ec & 0xfffc;
  }
  if (((_DAT_0080a49c & 0x80) == 0) || ((_DAT_008096ec & 3) != 0)) {
    uVar4 = (uint)_DAT_00808796;
  }
  else {
    uVar4 = func_0x0004dcf4(_DAT_0080a7ec,0x100,1000);
  }
  func_0x0001afb4(uVar6,uVar4);
  _DAT_008094da = func_0x0004e490(3);
  func_0x0001b0a0(uVar6,uVar4);
  if ((DAT_00808854 & 4) == 0) {
    func_0x0004e4a4(_DAT_008094da,_DAT_008087f0);
    func_0x0004ddd4(_Throttle_Conditional_Switch);
    _DAT_008094de = func_0x0004df68(_DAT_008087ee);
    if (_DAT_008094de < _DAT_008094da) goto LAB_00017088;
  }
  _DAT_008094de = _DAT_008094da;
LAB_00017088:
  uVar6 = (uint)_DAT_008094de;
  if ((_DAT_00808844 & 0x80) != 0) {
    uVar2 = func_0x00016e14();
    uVar6 = func_0x0004e500(uVar6,uVar2);
  }
  uVar2 = func_0x0004dcf4(uVar6,_DAT_008094ea,0x4000);
  if (((_DAT_00808870 & 8) != 0) && ((_DAT_00808646 & 0x80) != 0)) {
    uVar2 = 0;
  }
  func_0x0004db80(uVar2,0x80);
  _DAT_008094e2 = func_0x0004e500(uVar1);
  _DAT_00809726 = func_0x000179f4(_DAT_008094e2,0x80,2000);
  func_0x0004e410(0x61c14);
  _DAT_0080a876 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x61258);
  if (_DAT_00809726 < _DAT_00809724) {
    _DAT_00809724 = func_0x0004e01c(_DAT_00809724,_DAT_00809726,_DAT_0080a876);
  }
  else {
    _DAT_00809724 = _DAT_00809726;
  }
  return;
}


