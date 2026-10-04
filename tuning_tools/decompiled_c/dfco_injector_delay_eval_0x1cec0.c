/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: dfco_injector_delay_eval_0x1cec0
 * Address:  0x1CEC0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void dfco_injector_delay_eval_0x1cec0(void)

{
  uint uVar1;
  uint uVar2;
  uint uVar3;
  
  func_0x0001cfb4();
  func_0x0001d11c();
  func_0x0001d4a0();
  func_0x0001d4e4();
  if ((_DAT_00808844 & 2) != 0) {
    func_0x0001e7dc(0x8df8);
  }
  func_0x0001d5b4(0x8df8);
  func_0x0001d924(0x8df8);
  _DAT_00808884 = 0;
  _DAT_00808880 = 0;
  if ((_DAT_00808870 & 0x800) == 0) {
    _DAT_00808870 = _DAT_00808870 & 0xff7f;
  }
  else {
    _DAT_00808870 = _DAT_00808870 | 0x80;
  }
  if ((_DAT_00808848 & 2) != 0) {
    uVar3 = (uint)(_RAM_Load_Timing >> 2);
    func_0x0004e410(0x6161c);
    uVar1 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5F604);
    uVar2 = func_0x0004e500(uMem000546e6);
    if ((_DAT_008096ec & 8) == 0) {
      if ((uVar1 & 0xffff) < (uVar3 & 0xffff)) {
        _DAT_008096ec = _DAT_008096ec | 8;
      }
    }
    else if ((uVar3 & 0xffff) <= (uVar2 & 0xffff)) {
      _DAT_008096ec = _DAT_008096ec & 0xfff7;
    }
    if ((((_DAT_008096ec & 0x100) != 0) && ((_DAT_00808870 & 0x80) == 0)) &&
       ((_DAT_008096ec & 8) != 0)) {
      _DAT_008096ec = _DAT_008096ec | 4;
      return;
    }
  }
  _DAT_008096ec = _DAT_008096ec & 0xfffb;
  return;
}


