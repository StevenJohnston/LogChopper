/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: target_idle_stepper_and_mivec_0x2525c
 * Address:  0x2525C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void target_idle_stepper_and_mivec_0x2525c(void)

{
  ushort uVar1;
  undefined4 uVar3;
  ushort uVar2;
  
  _DAT_008089ea = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x5BDF4);
  _DAT_008089ee = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x5BE0C);
  if ((_DAT_00808870 & 0x11) == 0) {
    func_0x0004e410(0x62854);
    uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5BE24);
    _DAT_00809c82 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x5BE34);
    uVar3 = func_0x0004e490(uVar3,2);
    _DAT_008089e8 = func_0x0004e0d4(_DAT_00809c82,_DAT_00809c80,uVar3);
    uVar3 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5BE4C);
    _DAT_00809c86 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x5BE40);
    uVar3 = func_0x0004e490(uVar3,2);
    _DAT_008089ec = func_0x0004e0d4(_DAT_00809c86,_DAT_00809c84,uVar3);
  }
  else {
    func_0x0004e410(0x6220e);
    _DAT_008089e8 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5BE18);
    _DAT_00809c80 = _DAT_008089e8;
    _DAT_008089ec = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5BE00);
    _DAT_00809c82 = 0;
    _DAT_00809c86 = 0;
    _DAT_00809c84 = _DAT_008089ec;
  }
  uVar1 = uMem00053e00;
  uVar2 = uMem00053dfe;
  if ((_DAT_00808646 & 0x20) != 0) {
    uVar1 = uMem00053b4a;
    uVar2 = uMem00053b48;
  }
  if ((DAT_0080888a & 4) == 0) {
    if (uVar2 < _DAT_008087ba) {
      DAT_0080888a = DAT_0080888a | 4;
    }
  }
  else if (_DAT_008087ba <= uVar1) {
    DAT_0080888a = DAT_0080888a & 0xfb;
  }
  func_0x0004e410(0x62870);
  _DAT_00808a1a = func_0x0004e1a8(0x5be5c);
  _DAT_00808a1c = func_0x0004e1a8(0x5bec4);
  return;
}


