/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: fuel_pulse_width_eval_0x222a0
 * Address:  0x222A0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 fuel_pulse_width_eval_0x222a0(void)

{
  uint uVar1;
  uint uVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  uint uVar5;
  uint uVar6;
  
  uVar5 = 1;
  uVar6 = (uint)_DAT_008087b4;
  func_0x0004e410(0x61e10);
  uVar1 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5D4D4);
  uVar2 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5D4E2);
  if ((uVar6 & 0xffff) < (uVar1 & 0xffff)) {
    if ((uVar2 & 0xffff) <= (uVar6 & 0xffff)) goto LAB_0002233c;
    _DAT_00808144 = sMem000549c8;
    if (_DAT_0080879e < uMem000549b8) {
      uVar5 = 0;
      _DAT_008083c2 = sMem000549c6;
    }
  }
  else if ((uMem000549b8 < _DAT_0080879e) || (_DAT_0080879e < uMem000549b6)) {
LAB_0002233c:
    _DAT_00808144 = sMem000549c8;
  }
  else {
    uVar5 = 2;
  }
  if ((_DAT_008083c2 == 0) || ((uVar5 & 0xffff) == 0)) {
    if (_DAT_00808146 != 0) goto LAB_000223a8;
    if ((uVar5 & 0xffff) == 0) {
      func_0x0004db80(_DAT_0080a68a,1);
      _DAT_0080a68a = func_0x0004dc14();
      _DAT_00808146 = sMem000549ba;
      goto LAB_000223a8;
    }
    _DAT_0080a68a = func_0x0004e500(_DAT_0080a68a,1);
  }
  _DAT_00808146 = sMem000549bc;
LAB_000223a8:
  if (uMem000549b8 <= _DAT_0080879e) {
    _DAT_0080a68a = 0;
  }
  if (((((uVar5 & 0xffff) == 2) && (_DAT_00808686 < uMem000549c0)) && (uMem000549be < _DAT_00808686)
      ) && ((_DAT_00808144 == 0 && ((_DAT_00808d5e & 0x80) == 0)))) {
    func_0x0004e410(0x61e10);
    func_0x0004e410(0x61e2a);
    uVar3 = func_0x0004e1a8(0x5d472);
    uVar4 = func_0x0004e500(uMem000549c4,uMem000549c2);
    func_0x0004e500(uMem000549c4,_DAT_008086a2);
    uVar1 = func_0x0004dcf4(0x80,uVar4);
    if (0x7f < (uVar1 & 0xffff)) {
      uVar1 = 0x80;
    }
    uVar3 = func_0x0004ddbc(uVar3,uVar1);
    uVar3 = func_0x0004de60(_DAT_0080a68a,uVar3);
  }
  else {
    uVar3 = 0;
  }
  return uVar3;
}


