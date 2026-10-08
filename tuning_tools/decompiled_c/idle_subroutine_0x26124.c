/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_subroutine_0x26124
 * Address:  0x26124
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_subroutine_0x26124(void)

{
  ushort uVar1;
  byte bVar2;
  ushort uVar3;
  
  if (cMem00050353 == '\x01') {
    bVar2 = (byte)_DAT_00808648;
    if (((bVar2 ^ (byte)_DAT_00808646) & bVar2 & 8) != 0) {
      _DAT_00808076 = 0;
    }
    if (_DAT_00808838 < uMem000532f8) {
      _DAT_00808b16 = _DAT_00808b16 & 0xfbff;
    }
    else {
      _DAT_00808b16 = _DAT_00808b16 | 0x400;
    }
    if (((bVar2 ^ (byte)_DAT_00808646) & bVar2 & 8) != 0) {
      if ((_DAT_00808b16 & 0x400) == 0) {
        _DAT_00808b16 = _DAT_00808b16 & 0xfdff;
      }
      else {
        _DAT_00808b16 = _DAT_00808b16 | 0x200;
      }
    }
    if (((_DAT_00808b16 & 0x200) == 0) && ((_DAT_00808646 & 0x18) == 0)) {
      uVar3 = uMem000532f2;
      if ((_DAT_00808646 & 0x20) != 0) {
        uVar3 = uMem000532f0;
      }
      if (uVar3 < _DAT_00808076) {
        _DAT_00808b16 = _DAT_00808b16 & 0xf7ff | 0x1000;
      }
      else {
        _DAT_00808b16 = _DAT_00808b16 | 0x1800;
      }
    }
    else {
      _DAT_00808b16 = _DAT_00808b16 & 0xe7ff;
    }
    uVar3 = _DAT_00808b80;
    if (((_DAT_00808646 & 8) != 0) &&
       (_DAT_00808162 = sMem000532ec, uVar3 = uMem000532ea, (_DAT_00808646 & 0x20) != 0)) {
      uVar3 = uMem000532e8;
    }
    if (_DAT_00808162 == 0) {
      if ((_DAT_00808b16 & 0x1800) == 0x1000) {
        if ((_DAT_00808646 & 0x20) == 0) {
          _DAT_00808162 = sMem000532fc;
        }
        else {
          _DAT_00808162 = sMem000532fa;
        }
      }
      else {
        _DAT_00808162 = sMem000532ec;
      }
      uVar3 = func_0x0004e500(uVar3,uMem000532ee);
    }
    _DAT_00808b80 = uVar3;
    if ((_DAT_00808b16 & 0x800) != 0) {
      uVar1 = uMem000532f6;
      if ((_DAT_00808646 & 0x20) != 0) {
        uVar1 = uMem000532f4;
      }
      if (uVar3 < uVar1) {
        _DAT_00808b80 = uVar1;
      }
    }
  }
  else if (cMem00050353 == '\x02') {
    func_0x000262f8();
  }
  else {
    _DAT_00808b80 = 0;
  }
  if (uMem0005404e <= _DAT_00808b80) {
    _DAT_00808b80 = uMem0005404e;
  }
  return;
}


