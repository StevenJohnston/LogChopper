/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: fuel_crank_startup_scaling_0x2281c
 * Address:  0x2281C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 fuel_crank_startup_scaling_0x2281c(void)

{
  short sVar1;
  uint uVar2;
  short sVar4;
  ushort uVar5;
  undefined4 uVar3;
  uint uVar6;
  
  uVar6 = (uint)_DAT_0080895a;
  func_0x0004e410(0x61756);
  uVar2 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x558E8);
  sVar4 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x558C0);
  uVar5 = func_0x0004e500(uVar2,_Hysteresis);
  if ((DAT_00808886 & 8) == 0) {
    if ((uVar2 & 0xffff) < (uint)_DAT_008087ba) {
      DAT_00808886 = DAT_00808886 | 8;
    }
  }
  else if (_DAT_008087ba <= uVar5) {
    DAT_00808886 = DAT_00808886 & 0xf7;
  }
  sVar1 = sVar4;
  if ((DAT_00808886 & 8) == 0) {
    if (_DAT_0080811e == 0) {
      uVar6 = func_0x0004e500(uVar6,1);
      _DAT_0080811e = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x558D4);
    }
  }
  else if ((_Stop_RPM <= _DAT_0080879e) ||
          ((sVar1 = _DAT_0080811c, _DAT_0080811c == 0 &&
           (uVar6 = func_0x0004db80(uVar6,1), sVar1 = sVar4, 0xff < (uVar6 & 0xffff))))) {
    uVar6 = 0xff;
    sVar1 = sVar4;
  }
  _DAT_0080811c = sVar1;
  _DAT_0080895a = (short)uVar6;
  if (((_DAT_00808686 < _Min_Temp) || ((_DAT_00808870 & 2) != 0)) || ((DAT_00808886 & 8) == 0)) {
    uVar3 = 0;
  }
  else {
    uVar3 = 1;
  }
  return uVar3;
}


