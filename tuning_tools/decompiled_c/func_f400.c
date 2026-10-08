/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_f400
 * Address:  0xF400
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_f400(void)

{
  ushort uVar1;
  short *psVar2;
  undefined4 in_R8;
  undefined2 uVar3;
  undefined4 in_R9;
  uint in_R10;
  undefined4 in_stack_00000010;
  
  if ((DAT_00809948 & 0x20) == 0) {
    func_0x00036974();
    func_0x000373a0(in_stack_00000010);
    func_0x00038174(in_R9);
    if (_DAT_00809794 == 0) {
      func_0x0000f578(in_R8,in_R9);
    }
    if ((cMem000503b5 == '\x02') && (_DAT_00809794 == 0xe)) {
      func_0x0000f6b8(in_R8,in_R9);
    }
    if ((_DAT_00809794 == 0xb) && ((DAT_00809948 & 0x10) == 0)) {
      func_0x0006f3a8();
      func_0x0000f61c(in_R8,in_R9);
    }
    if ((_DAT_00809794 == 10) && ((_DAT_00809ac0 & 0x40) == 0)) {
      func_0x00033db8();
    }
    if ((_DAT_00809794 != 0xb) && (_DAT_00809794 != 0)) {
      func_0x00036a20();
      func_0x000378e4();
      func_0x00037240();
    }
    if ((_DAT_00808848 & 2) != 0) {
      func_0x00033c10();
    }
  }
  else {
    _DAT_0080a72a = _DAT_0080a72a & 0x3fe2;
  }
  uVar3 = (undefined2)in_R8;
  func_0x00037e98();
  if ((in_R10 & 0xffff) != 0) {
    _DAT_0080a408 = uVar3;
    _DAT_0080a40c = in_R9;
  }
  uVar1 = _DAT_00809c1e + 1;
  if (_DAT_00809c1e == 0xffff) {
    uVar1 = _DAT_00809c1e;
  }
  _DAT_00809c1e = uVar1;
  if (10 < _DAT_00809c1e) {
    _DAT_00809c1e = 0;
  }
  _DAT_0080a886 = 0;
  if (_DAT_00809794 == 0) {
    psVar2 = (short *)0x80aff2;
  }
  else if (_DAT_00809794 == 0xb) {
    psVar2 = (short *)0x80aff0;
  }
  else {
    psVar2 = (short *)0x80aff4;
  }
  _DAT_0080a70c = in_R9;
  *psVar2 = _TMS1CT - _DAT_0080aff6;
  if (((_DAT_0080979c & 0x80) != 0) && ((_DAT_00809794 == 0 || (_DAT_00809794 == 0xb)))) {
    func_0x00033f20();
  }
  return;
}


