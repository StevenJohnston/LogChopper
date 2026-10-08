/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_rpm_error_calc
 * Address:  0x4BDC0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_rpm_error_calc(void)

{
  if ((uint)_DAT_00808b44 << 5 < 0x10000) {
    _DAT_0080a2f8 = (undefined2)((uint)_DAT_00808b44 << 5);
  }
  else {
    _DAT_0080a2f8 = 0xffff;
  }
  if ((uint)_DAT_00808b44 << 5 < 0x10000) {
    _DAT_0080a304 = (undefined2)((uint)_DAT_00808b44 << 5);
  }
  else {
    _DAT_0080a304 = 0xffff;
  }
  _DAT_0080a5dc = (uint)_DAT_0080a5b4 << 8;
  if ((uint)_DAT_0080a5b4 << 2 < 0x10000) {
    _DAT_0080a5ca = (undefined2)((uint)_DAT_0080a5b4 << 2);
  }
  else {
    _DAT_0080a5ca = 0xffff;
  }
  if ((uint)_DAT_0080a5b4 << 2 < 0x10000) {
    _DAT_0080a5c8 = (undefined2)((uint)_DAT_0080a5b4 << 2);
  }
  else {
    _DAT_0080a5c8 = 0xffff;
  }
  if ((uint)_DAT_0080a5b4 << 2 < 0x10000) {
    _DAT_0080a5c6 = (undefined2)((uint)_DAT_0080a5b4 << 2);
  }
  else {
    _DAT_0080a5c6 = 0xffff;
  }
  if ((uint)_DAT_0080a5b4 << 2 < 0x10000) {
    _DAT_0080a5c4 = (undefined2)((uint)_DAT_0080a5b4 << 2);
  }
  else {
    _DAT_0080a5c4 = 0xffff;
  }
  if ((uint)_DAT_0080a5b4 << 2 < 0x10000) {
    _DAT_0080a5d2 = (undefined2)((uint)_DAT_0080a5b4 << 2);
  }
  else {
    _DAT_0080a5d2 = 0xffff;
  }
  if ((uint)_DAT_0080a5b4 << 2 < 0x10000) {
    _DAT_0080a5d0 = (undefined2)((uint)_DAT_0080a5b4 << 2);
  }
  else {
    _DAT_0080a5d0 = 0xffff;
  }
  _DAT_0080a5e2 = _DAT_0080a5b4;
  if ((uint)_DAT_0080a5b4 << 2 < 0x10000) {
    _DAT_0080a5c2 = (undefined2)((uint)_DAT_0080a5b4 << 2);
  }
  else {
    _DAT_0080a5c2 = 0xffff;
  }
  _DAT_0080a5bc = 0x8000;
  _DAT_0080a5be = 0x8000;
  _DAT_0080a5c0 = 0x8000;
  _DAT_0080a5d4 = 0x80000000;
  _DAT_0080a5e0 = 0x8000;
  _DAT_00808182 = uMem00054428;
  _DAT_0080a2e8 = 0x20;
  _DAT_0080a2f0 = (uint)uMem00054426 << 0xe;
  _DAT_0080a2de = 0;
  _DAT_0080a2dc = 0;
  _DAT_0080a2f4 = 0x8000;
  _DAT_0080a2f6 = 0x8000;
  DAT_0080a2fc = 0x80;
  _DAT_0080a2fa = 0x8000;
  DAT_0080a30b = DAT_0080a30b | 0x20;
  return;
}


