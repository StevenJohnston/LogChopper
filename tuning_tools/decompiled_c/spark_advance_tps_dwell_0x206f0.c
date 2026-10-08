/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: spark_advance_tps_dwell_0x206f0
 * Address:  0x206F0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void spark_advance_tps_dwell_0x206f0(void)

{
  uint uVar1;
  int iVar2;
  ushort uVar3;
  uint uVar4;
  uint uVar5;
  int iVar6;
  
  func_0x00020a14();
  uVar4 = (uint)_DAT_00808a3a;
  uVar5 = uVar4;
  func_0x00020ec8();
  if ((cMem0005035c != '\0') && (uVar1 = func_0x00021098(), (uVar1 & 0xffff) <= (uVar5 & 0xffff))) {
    uVar5 = uVar1;
  }
  if ((uVar4 & 0xffff) < (uVar5 & 0xffff)) {
    uVar5 = uVar4;
  }
  iVar6 = uVar5 + 0x8000;
  iVar2 = func_0x000210c4();
  func_0x0002113c();
  iVar2 = iVar6 + iVar2 + -0x80;
  func_0x0002248c();
  if ((DAT_00808a34 & 0x80) != 0) {
    func_0x0004db80(_DAT_0080aa2a,0x8000);
    iVar2 = func_0x0004e0d4(iVar2,_DAT_0080aa2c);
  }
  _DAT_0080aa32 = (undefined2)iVar2;
  iVar6 = func_0x00021158();
  iVar6 = iVar6 + iVar2 + -0x80;
  iVar2 = func_0x0002125c();
  iVar6 = iVar6 + iVar2 + -0x80;
  iVar2 = func_0x000222a0();
  iVar6 = iVar6 + iVar2;
  iVar2 = func_0x00040000();
  iVar6 = iVar6 + iVar2 + -0x80;
  iVar2 = func_0x000214fc();
  uVar5 = (iVar6 + iVar2) - 0x80;
  if ((_DAT_00808a4e < 0x80) && ((uVar5 & 0xffff) < (uMem000531ec + 0x8000 & 0xffff))) {
    uVar5 = uMem000531ec + 0x8000;
  }
  iVar2 = func_0x0002157c();
  uVar5 = func_0x0004e500(iVar2 + uVar5 + -0x80,0x8000);
  uVar4 = func_0x00021588();
  if ((uVar4 & 0xffff) <= (uVar5 & 0xffff)) {
    uVar5 = uVar4;
  }
  if ((_DAT_00808a50 != 0x80) && ((uVar5 & 0xffff) < (uint)uMem00053296)) {
    uVar5 = (uint)uMem00053296;
  }
  if ((_DAT_00808870 & 0x80) == 0) {
    _DAT_0080a264 = 0;
  }
  else {
    _RAM_Boost_Error = func_0x00020b88();
    func_0x0004e410(0x617fc);
    func_0x0004e410(0x62d36);
    _DAT_0080a264 = func_0x0004e1a8(0x5d39c);
    uVar5 = func_0x0004e500(uVar5,_DAT_0080a264);
  }
  _DAT_00809746 = (undefined2)uVar5;
  uVar5 = func_0x0004e500(uVar5,_DAT_00809732);
  uVar4 = func_0x0004f044(0x507a4,_DAT_00808796,_RAM_Load_Timing);
  uVar4 = uVar4 & 0xff;
  func_0x0004e1a8(0x52d04);
  uVar4 = func_0x0004db80(uVar4);
  _DAT_00809734 = (undefined2)uVar4;
  if ((uVar5 & 0xffff) < (uVar4 & 0xffff)) {
    uVar5 = uVar4;
  }
  _DAT_00809744 = (undefined2)uVar5;
  if ((uint)_DAT_0080aa2a <= (uVar5 & 0xffff)) {
    uVar5 = (uint)_DAT_0080aa2a;
  }
  if (((_DAT_00808a32 & 0x80) != 0) || ((_DAT_00808870 & 0x11) != 0)) {
    uVar5 = uMem000531c6 + 0x14;
  }
  uVar4 = 0;
  if (((((uint)_DAT_00808012 <= (uint)uMem00054378 << 1) && (_DAT_0080879c < uMem00054374)) &&
      (uMem00054376 < _DAT_008087ba)) &&
     (uVar4 = func_0x0004e1a8(&Discovered_2D_Throttle_Position_TPS_Vehicle_Speed_0x5ADA6),
     (uVar4 & 0xffff) == 0)) {
    uVar4 = 0;
  }
  uVar5 = func_0x0004dc38(uVar5,uVar4,0x46);
  _DAT_00808a80 = (undefined2)uVar5;
  func_0x00021c8c();
  if ((((_DAT_00808870 & 0x11) == 0) &&
      (uVar5 = func_0x0004e0d4(uVar5,0x19,_DAT_00808a7e), _DAT_00808a7e != 0xff)) &&
     ((uVar5 & 0xffff) < 0x19)) {
    uVar5 = 0x19;
  }
  _DAT_00808a38 = (short)uVar5;
  if ((_DAT_00808870 & 0x10) != 0) {
    if (uMem00053d98 < _DAT_00808686) {
      _DAT_00809a14 = 0;
    }
    else {
      _DAT_00809a14 = 2;
      if (uMem00053d9a < _DAT_00808686) {
        _DAT_00809a14 = 1;
      }
    }
    _DAT_00809a12 = 0;
  }
  uVar3 = 5;
  if (_DAT_00809a12 < 5) {
    uVar3 = _DAT_00809a12;
  }
  _DAT_00809960 = (ushort)*(byte *)((ushort)(uVar3 + _DAT_00809a14 * 6) + 0x57c12);
  return;
}


