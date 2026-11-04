/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: func_injection_timing_calc_0x25028
 * Address:  0x25028
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void func_injection_timing_calc_0x25028(void)

{
  undefined2 uVar1;
  ushort uVar2;
  ushort uVar3;
  
  uVar3 = _DAT_00808870 & 0x89f;
  uVar2 = _DAT_00808872 & 0x800;
  uVar1 = _DAT_00808984;
  if ((_DAT_00808870 & 1) == 0) {
    uVar1 = _DAT_00808982;
  }
  func_0x00000310();
  _DAT_00808a2e = _DAT_00808a2c;
  _DAT_008088d6 = _DAT_008088d6 & 0x7560 | uVar3;
  _DAT_008088d8 = _DAT_008088d8 & 0xf7ff | uVar2;
  _DAT_008088e6 = _DAT_008088e4;
  _DAT_008088ea = _DAT_008088e8;
  _DAT_00808952 = _DAT_00808948;
  _DAT_00808954 = _DAT_0080894a;
  _DAT_008088fe = _DAT_008088fc;
  _DAT_00808902 = _DAT_00808900;
  _DAT_00808906 = _DAT_00808904;
  _DAT_0080890a = _DAT_00808908;
  if ((_DAT_0080936c == 5) || (_DAT_0080936c == 8)) {
    _DAT_0080936c = _DAT_0080936c + 1;
  }
  if ((_DAT_0080936e == 5) || (_DAT_0080936e == 8)) {
    _DAT_0080936e = _DAT_0080936e + 1;
  }
  if ((DAT_00808c0c & 0x80) != 0) {
    _DAT_00809396 = _DAT_00808c08;
    _RAM_STFT = _DAT_00808c08;
    DAT_00808c0c = DAT_00808c0c & 0x7f;
  }
  if (((DAT_00808bce & 0x80) != 0) ||
     (((_DAT_00808c18 & 0x40) != 0 && ((_DAT_00809178 & 0xbb) == 0)))) {
    _DAT_00809396 = 0x8080;
    _RAM_STFT = 0x8080;
  }
  _DAT_008099f6 = _DAT_008099f4;
  _DAT_00808986 = uVar1;
  func_0x00000328();
  return;
}


