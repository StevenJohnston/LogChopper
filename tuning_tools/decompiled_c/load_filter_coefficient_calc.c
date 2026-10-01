/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: load_filter_coefficient_calc
 * Address:  0x15860
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void load_filter_coefficient_calc(void)

{
  uint uVar1;
  undefined4 uVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  ushort uVar5;
  uint uVar6;
  
  func_0x0004e410(0x63418);
  uVar1 = func_0x0004e278(0x61014);
  uVar1 = uVar1 & 0xffff;
  uVar2 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5FC_0x5500C);
  uVar3 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x55000);
  func_0x0004e410(0x6215c);
  uVar4 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x57702);
  func_0x0004ddd4(uVar1,uVar2);
  func_0x0004ddd4(uVar3);
  _DAT_0080aab8 = func_0x0004ddd4(uVar4);
  func_0x00000310();
  uVar1 = _DAT_0080aab4;
  uVar6 = _DAT_00808fe0;
  func_0x00000328();
  if ((_DAT_00808d5e & 0x80) == 0) {
    if (((DAT_00808854 & 0x20) == 0) && (uVar1 <= uVar6)) {
      _DAT_008087f8 = _Load_Ramp_Rate_1_Load_70;
      goto LAB_000159a0;
    }
    if (_DAT_0080800c < uMem0005368a) {
      _DAT_008087f8 = uMem0005300a;
      goto LAB_000159a0;
    }
    if ((DAT_00808878 & 1) == 0) {
      if ((_DAT_00808b16 & 0x10) == 0) {
        uVar1 = 0;
        func_0x00000310();
        if (_DAT_00808fe0 < _DAT_00808fdc) {
          uVar1 = 1;
        }
        func_0x00000328();
        _RAM_Boost_Error = _DAT_008095b2;
        func_0x0004e410(0x62da8);
        func_0x0004e410(0x62d8c);
        if ((uVar1 & 0xffff) == 0) {
          uVar2 = 0x5d6ec;
        }
        else {
          uVar2 = 0x5d68c;
        }
        _DAT_008087f8 = func_0x0004e1a8(uVar2);
      }
      else {
        _DAT_008087f8 = uMem00053008;
      }
      goto LAB_000159a0;
    }
  }
  _DAT_008087f8 = uMem0005342a;
LAB_000159a0:
  uVar5 = 0;
  if (_DAT_008087f8 <= uMem000530e2) {
    uVar5 = 0x200;
  }
  _DAT_00808888 = _DAT_00808888 & 0xfdff | uVar5;
  return;
}


