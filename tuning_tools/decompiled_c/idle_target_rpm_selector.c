/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_target_rpm_selector
 * Address:  0x25C3C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_target_rpm_selector(void)

{
  undefined4 uVar1;
  uint uVar2;
  uint uVar3;
  ushort uVar4;
  uint uVar5;
  
  uVar5 = 0;
  if (((((_DAT_00808848 & 1) == 0) || ((_DAT_00808c2c & 8) != 0)) &&
      (((_DAT_00808848 & 2) == 0 || ((_DAT_00808c2e & 0x40) != 0)))) || ((DAT_0080a490 & 2) == 0)) {
    DAT_0080a492 = DAT_0080a492 & 0xfd;
  }
  else {
    DAT_0080a492 = DAT_0080a492 | 2;
  }
  if (((_DAT_00808848 & 2) == 0) || ((_DAT_00808baa & 1) == 0)) {
    if ((_DAT_00808646 & 0x20) == 0) {
      if (((DAT_00808846 & 0x20) == 0) || ((_DAT_0080888e & 4) == 0)) {
        uVar1 = 0x56254;
      }
      else {
        uVar1 = 0x5ab14;
      }
      uVar2 = func_0x0004ef7c(uVar1,_DAT_00808694);
      uVar2 = uVar2 & 0xff;
    }
    else {
      uVar5 = 1;
      uVar2 = func_0x0004ef7c(0x56244,_DAT_00808694);
      uVar2 = uVar2 & 0xff;
      if (((_DAT_00808646 & 0x4000) != 0) && (uVar2 < _Target_Idle_1)) {
        uVar2 = (uint)_Target_Idle_1;
      }
    }
    _DAT_0080aa42 = (undefined2)uVar2;
    if ((_DAT_00809528 & 4) == 0) {
      _DAT_00809528 = _DAT_00809528 & 0xfff7;
    }
    else {
      _DAT_00809528 = _DAT_00809528 | 8;
    }
    if ((_DAT_00809528 & 0x400) == 0) {
      _DAT_00809528 = _DAT_00809528 & 0xf7ff;
    }
    else {
      _DAT_00809528 = _DAT_00809528 | 0x800;
    }
    if ((_DAT_00809528 & 2) == 0) {
      _DAT_00809528 = _DAT_00809528 & 0xfffb;
    }
    else {
      _DAT_00809528 = _DAT_00809528 | 4;
    }
    if ((_DAT_00809528 & 0x200) == 0) {
      _DAT_00809528 = _DAT_00809528 & 0xfbff;
    }
    else {
      _DAT_00809528 = _DAT_00809528 | 0x400;
    }
    if ((_DAT_00809528 & 4) != 0) {
      uVar5 = uVar5 & 0xffff;
      uVar4 = _Target_Idle_2;
      if (uVar5 == 0) {
        uVar4 = _Target_Idle_3;
      }
      if (uVar2 < uVar4) {
        uVar2 = (uint)uVar4;
      }
    }
    if ((_DAT_00809528 & 0x400) != 0) {
      uVar5 = uVar5 & 0xffff;
      uVar4 = _Target_Idle_2;
      if (uVar5 == 0) {
        uVar4 = _Target_Idle_3;
      }
      if (uVar2 < uVar4) {
        uVar2 = (uint)uVar4;
      }
    }
    if ((((DAT_00808846 & 0x20) != 0) && ((DAT_00808846 & 2) != 0)) && ((_DAT_00808b1a & 1) != 0)) {
      uVar5 = uVar5 & 0xffff;
      if (uVar5 == 0) {
        if (_DAT_0080a470 == 4) {
          uVar1 = 0x5ab46;
        }
        else {
          uVar1 = 0x5ab3a;
        }
      }
      else if (_DAT_0080a470 == 4) {
        uVar1 = 0x5a090;
      }
      else {
        uVar1 = 0x5a084;
      }
      uVar3 = func_0x0004e1a8(uVar1);
      if ((uVar2 & 0xffff) < (uVar3 & 0xffff)) {
        uVar2 = uVar3;
      }
    }
  }
  else {
    if ((_DAT_00808baa & 0x100) == 0) {
      uVar1 = 0x5f61c;
    }
    else {
      uVar1 = 0x5f62c;
    }
    uVar2 = func_0x0004ef7c(uVar1,_DAT_00808694);
    uVar2 = uVar2 & 0xff;
  }
  _DAT_00808b64 = (undefined2)uVar2;
  func_0x00026018();
  if ((_DAT_00808646 & 0x10) != 0) {
    uVar3 = uVar2;
    if ((_DAT_00808baa & 1) == 0) {
      uVar5 = uVar5 & 0xffff;
      if (uVar5 == 0) {
        if ((_DAT_00808646 & 1) == 0) {
          if (((DAT_00808846 & 0x20) == 0) || ((_DAT_0080865e & 0x20) == 0)) {
            uVar3 = (uint)_Target_Idle_9;
          }
          else {
            uVar3 = (uint)_Target_Idle_8;
          }
        }
        else {
          uVar3 = (uint)_Target_Idle_7;
        }
      }
      else if ((_DAT_00808646 & 1) == 0) {
        if (((DAT_00808846 & 0x20) == 0) || ((_DAT_0080865e & 0x20) == 0)) {
          uVar3 = (uint)_Target_Idle_6;
        }
        else {
          uVar3 = (uint)_Target_Idle_5;
        }
      }
      else {
        uVar3 = (uint)_Target_Idle_4;
      }
    }
    if ((uVar2 & 0xffff) <= (uVar3 & 0xffff)) {
      uVar2 = uVar3;
    }
  }
  if ((uVar2 & 0xffff) < (uint)_DAT_00808b66) {
    uVar2 = (uint)_DAT_00808b66;
  }
  if (((_DAT_00808848 & 2) == 0) || ((_DAT_00808baa & 1) == 0)) {
    uVar5 = uVar5 & 0xffff;
    if (uVar5 == 0) {
      uVar1 = 0x60e16;
    }
    else {
      uVar1 = 0x60e08;
    }
    _DAT_0080aa44 = func_0x0004e1a8(uVar1);
    uVar1 = func_0x0004dcf4(_DAT_0080aa44,_DAT_0080aa3a,0xff);
    _DAT_0080aa40 = func_0x0004db80(_DAT_0080aa42,uVar1);
    uVar4 = func_0x0004db80(_DAT_0080aa42,_DAT_0080aa44);
    if (uVar4 <= _DAT_0080aa40) {
      _DAT_0080aa40 = func_0x0004db80(_DAT_0080aa42,_DAT_0080aa44);
    }
    if ((uVar2 & 0xffff) < (uint)_DAT_0080aa40) {
      uVar2 = (uint)_DAT_0080aa40;
    }
  }
  if (((_DAT_00808848 & 3) != 0) && ((DAT_0080a492 & 2) != 0)) {
    uVar5 = uVar5 & 0xffff;
    if (uVar5 == 0) {
      if ((uVar2 & 0xffff) < (uint)uMem0005403c) {
        uVar2 = (uint)uMem0005403c;
      }
    }
    else if ((uVar2 & 0xffff) < (uint)uMem00054038) {
      uVar2 = (uint)uMem00054038;
    }
  }
  if ((_DAT_00808b1a & 0x20) != 0) {
    if ((uVar5 & 0xffff) == 0) {
      if ((uVar2 & 0xffff) < (uint)_Target_Idle_13) {
        uVar2 = (uint)_Target_Idle_13;
      }
    }
    else if ((uVar2 & 0xffff) < (uint)_Target_Idle_12) {
      uVar2 = (uint)_Target_Idle_12;
    }
  }
  if (((DAT_00808b1c & 0x20) != 0) && ((uVar2 & 0xffff) < (uint)_Target_Idle_14)) {
    uVar2 = (uint)_Target_Idle_14;
  }
  func_0x0004dc14(uVar2);
  _DAT_00808b44 = func_0x000aa1f0();
  return;
}


