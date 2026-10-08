/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: latest_fuel_target_afr_and_calibration_calc
 * Address:  0x22A48
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void latest_fuel_target_afr_and_calibration_calc(void)

{
  uint uVar1;
  uint uVar2;
  ushort uVar3;
  
  uVar3 = _DAT_00809604;
  if (_DAT_00809604 <= _DAT_00809776) {
    uVar3 = _DAT_00809776;
  }
  _RAM_Boost_Error = func_0x0004df9c(uVar3,4);
  func_0x0004e410(0x6216e);
  uVar1 = func_0x0004e1a8(0x57a1e);
  _RAM_Boost_Error = func_0x00022b38();
  func_0x0004e410(0x61790);
  func_0x0004e410(0x617b6);
  uVar2 = func_0x0004e330(0x635e8);
  if ((_DAT_00808844 & 0x80) != 0) {
    func_0x000fb7f8(0x805020);
    uVar2 = func_0x0004e0d4(uVar2,_DAT_008045a0);
  }
  _RAM_Current_Target_AFR = (undefined2)uVar2;
  if ((uVar2 & 0xffff) < (uVar1 & 0xffff)) {
    _RAM_Current_Target_AFR = (undefined2)uVar1;
  }
  _RAM_Boost_Error = _RAM_Load_Timing;
  func_0x0004e410(0x6218a);
  func_0x0004e410(0x621b6);
  func_0x0004e1a8(_DAT_0080505c);
  _DAT_00808fe8 = func_0x000a9f54();
  return;
}


