/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: fuel_coolant_trim_calc
 * Address:  0x22BF4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void fuel_coolant_trim_calc(void)

{
  short sVar1;
  short sVar2;
  undefined4 uVar3;
  uint uVar4;
  uint uVar5;
  uint uVar6;
  
  if ((_DAT_00808870 & 0x11) != 0) {
    _DAT_0080a53c = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BF52);
    _DAT_00808944 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x556BE);
    _DAT_00808964 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x571BC);
    _DAT_00808968 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x571E4);
    _DAT_0080896c = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x571CA);
    _DAT_0080a53e = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BF6E);
    _DAT_0080a540 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BF8A);
    _DAT_0080a542 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BF60);
    _DAT_00808946 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BD80);
    _DAT_00808966 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BD8E);
    _DAT_0080896a = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BD9C);
    _DAT_0080896e = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BDAA);
    _DAT_0080a544 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BF7C);
    _DAT_0080a546 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BF98);
  }
  if ((_DAT_00808870 & 0x10) == 0) {
    if ((_DAT_00808870 & 1) != 0) {
      _DAT_0080893c = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x556B0);
      _DAT_0080893e = _DAT_0080893c;
      _DAT_00808970 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x571AE);
      _DAT_00808940 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BD64);
      _DAT_00808942 = _DAT_00808940;
      _DAT_00808972 = func_0x0004e1a8(&Discovered_2D_Fast_Engine_Coolant_Temp_ECT_0x5BD72);
    }
  }
  else {
    _DAT_0080893c = 0;
    _DAT_0080893e = 0;
    _DAT_00808970 = 0;
    _DAT_00808940 = 0;
    _DAT_00808942 = 0;
    _DAT_00808972 = 0;
  }
  if (_DAT_0080a6ca != 0) {
    _DAT_0080a6ca = _DAT_0080a6ca + -1;
  }
  if (_DAT_0080a6cc != 0) {
    _DAT_0080a6cc = _DAT_0080a6cc + -1;
  }
  sVar1 = _DAT_0080a6cc;
  if (_DAT_0080a6ce != 0) {
    _DAT_0080a6ce = _DAT_0080a6ce + -1;
  }
  sVar2 = _DAT_0080a6ce;
  if (_DAT_0080a6d0 != 0) {
    _DAT_0080a6d0 = _DAT_0080a6d0 - 1;
  }
  if (_DAT_0080a6d2 != 0) {
    _DAT_0080a6d2 = _DAT_0080a6d2 - 1;
  }
  if (_DAT_0080a6d4 != 0) {
    _DAT_0080a6d4 = _DAT_0080a6d4 - 1;
  }
  uVar4 = (uint)_DAT_0080a6d0;
  uVar5 = (uint)_DAT_0080a6d2;
  uVar6 = (uint)_DAT_0080a6d4;
  if ((_DAT_0080893c != 0) && (_DAT_0080a6ca == 0)) {
    uVar3 = func_0x00022ecc();
    _DAT_0080893c = func_0x0004e500(_DAT_0080893c,uVar3);
  }
  if ((_DAT_0080893e != 0) && (sVar1 == 0)) {
    uVar3 = func_0x00023030();
    _DAT_0080893e = func_0x0004e500(_DAT_0080893e,uVar3);
  }
  if ((_DAT_00808970 != 0) && (sVar2 == 0)) {
    _DAT_00808970 = _DAT_00808970 + -1;
    func_0x00023194();
  }
  if ((_DAT_00808940 != 0) && ((uVar4 & 0xffff) == 0)) {
    uVar3 = func_0x00022f9c();
    _DAT_00808940 = func_0x0004e500(_DAT_00808940,uVar3);
  }
  if ((_DAT_00808972 != 0) && ((uVar6 & 0xffff) == 0)) {
    _DAT_00808972 = _DAT_00808972 + -1;
    func_0x0002327c();
  }
  if ((_DAT_00808942 != 0) && ((uVar5 & 0xffff) == 0)) {
    uVar3 = func_0x00023100();
    _DAT_00808942 = func_0x0004e500(_DAT_00808942,uVar3);
  }
  if ((_DAT_00808646 & 0x20) == 0) {
    _DAT_00808974 = _DAT_0080893e;
  }
  else {
    _DAT_00808974 = _DAT_0080893c;
  }
  return;
}


