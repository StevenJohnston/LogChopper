/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: load_calc_fuel_rate_0x14f64
 * Address:  0x14F64
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void load_calc_fuel_rate_0x14f64(void)

{
  byte bVar1;
  uint uVar2;
  undefined4 uVar3;
  short sVar5;
  int iVar4;
  
  if (((_DAT_00808854 & 8) == 0) && (uMem000531b4 <= _DAT_0080879e)) {
    _RAM_Boost_Error = _RAM_Load_Calculated;
  }
  else {
    _RAM_Boost_Error = 0x100;
  }
  func_0x0004e410(0x621b6);
  uVar2 = func_0x0004e1a8(0x5adb2);
  uVar3 = func_0x0004e1a8(0x5af2a);
  if ((_DAT_00808870 & 0x11) != 0) {
    _DAT_00808960 = 0;
    _DAT_00808962 = 0x80;
    goto LAB_000150d0;
  }
  if (_DAT_00808960 == 0) {
    bVar1 = (byte)_DAT_00808648;
    if (((((bVar1 ^ (byte)_DAT_00808646) & bVar1 & 0x80) == 0) &&
        (((bVar1 ^ (byte)_DAT_00808646) & bVar1 & 0x20) == 0)) ||
       (((uVar2 & 0xffff) <= (uint)_DAT_00808938 && ((_DAT_0080893c == 0 && (_DAT_00808970 == 0)))))
       ) goto LAB_00015044;
    _DAT_008083aa = sMem00053a80;
LAB_0001504c:
    _DAT_00808962 = uMem00053a7e;
  }
  else {
LAB_00015044:
    if (_DAT_008083aa != 0) goto LAB_0001504c;
    if ((0x80 < _DAT_00808962) && ((_DAT_00808868 & 2) != 0)) {
      _DAT_00808962 = func_0x0004e500(_DAT_00808962,uMem00053a7c);
    }
  }
  if (_DAT_00808962 < 0x80) {
    _DAT_00808962 = 0x80;
  }
  sVar5 = func_0x00015120();
  if ((sVar5 == 0) || (_DAT_00808962 != 0x80)) {
    _DAT_00808960 = 0xff;
  }
  else if ((_DAT_00808868 & 2) != 0) {
    _DAT_00808960 = func_0x0004e500(_DAT_00808960,uMem00053a82);
  }
LAB_000150d0:
  func_0x0004e0d4(uVar2,uVar3,_DAT_00808960);
  iVar4 = func_0x0004e500(0x80);
  func_0x0004e410(0x6269e);
  uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x57162);
  iVar4 = func_0x0004dcf4(iVar4 << 7,uVar3,0x4000);
  _DAT_00808938 = func_0x0004dc14(iVar4 + 0x80);
  return;
}


