/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_throttle_airflow_calc
 * Address:  0x7CB18
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

ushort idle_throttle_airflow_calc(void)

{
  ushort uVar1;
  
  uVar1 = _DAT_0080aa70;
  if ((_DAT_00808646 & 0x80) == 0) {
    _DAT_008082ce = sMem00054962;
    _DAT_008082d0 = sMem00054966;
  }
  else if ((uint)(_DAT_00808b44 >> 2) + (uint)uMem00054964 < (uint)_DAT_0080879e) {
    _DAT_008082ce = sMem00054962;
  }
  if (((((_DAT_00808646 & 0x20) == 0) && ((_DAT_00808646 & 0x80) != 0)) &&
      (((_DAT_00808646 & 4) == 0 || ((DAT_00808baa & 0x10) != 0)))) &&
     (((_DAT_008082ce == 0 || (_DAT_008082d0 == 0)) && ((_DAT_0080a3ee & 0x20) == 0)))) {
    _DAT_0080aa70 = _DAT_0080aa70 | 2;
  }
  else {
    _DAT_0080aa70 = _DAT_0080aa70 & 0xfffd;
  }
  if (((uVar1 & 2) == 0) || ((_DAT_00808646 & 0x80) != 0)) {
    _DAT_0080aa70 = _DAT_0080aa70 & 0xfffb;
  }
  else {
    _DAT_0080aa70 = _DAT_0080aa70 | 4;
    uVar1 = uMem0005495c;
    if (_DAT_0080879c < uMem0005495c) {
      uVar1 = _DAT_0080879c;
    }
    _DAT_0080aa6c = func_0x0004e500(uVar1,uMem0005495a);
  }
  if ((_DAT_0080aa70 & 4) == 0) {
    if ((((_DAT_00808870 & 0x10) == 0) &&
        ((((byte)_DAT_00808648 ^ (byte)_DAT_00808646) & (byte)_DAT_00808648 & 0x20) == 0)) &&
       (((_DAT_0080aa70 & 1) != 0 && (_DAT_00808b44 < _DAT_0080aa6e)))) {
      if (_DAT_008082d2 == 0) {
        _DAT_0080aa6e = func_0x0004e500(_DAT_0080aa6e,uMem0005495e);
        _DAT_008082d2 = sMem00054960;
      }
      if (_DAT_0080aa6e < _DAT_00808b44) {
        _DAT_0080aa6e = _DAT_00808b44;
      }
      goto LAB_0007ccac;
    }
LAB_0007cc48:
    _DAT_0080aa6e = _DAT_00808b44;
  }
  else {
    if (_DAT_0080aa6c < _DAT_00808b44) goto LAB_0007cc48;
    _DAT_0080aa6e = _DAT_0080aa6c;
  }
  _DAT_008082d2 = sMem00054960;
LAB_0007ccac:
  _DAT_0080aa70 = _DAT_0080aa70 | 1;
  return _DAT_0080aa6e;
}


