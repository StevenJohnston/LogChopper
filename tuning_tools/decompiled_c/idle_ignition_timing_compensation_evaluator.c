/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_ignition_timing_compensation_evaluator
 * Address:  0x2125C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_ignition_timing_compensation_evaluator(void)

{
  bool bVar1;
  int iVar2;
  undefined4 uVar3;
  undefined *puVar4;
  uint uVar5;
  undefined2 uVar6;
  uint uVar7;
  uint uVar8;
  uint uVar9;
  
  uVar7 = 0x80;
  if ((_DAT_00808a32 & 0x10) != 0) {
    uVar7 = func_0x0004ddbc(_DAT_00808b44,uMem000531ea);
    bVar1 = false;
    uVar5 = (_DAT_008087a8 >> 3) + 1 >> 1;
    if ((uVar7 & 0xffff) < uVar5) {
      uVar7 = uVar5;
    }
    if ((_DAT_00808a32 & 0x4000) == 0) {
      iVar2 = 0;
    }
    else if ((uVar7 & 0xffff) < (uint)_DAT_00808796) {
      iVar2 = _DAT_00808796 - uVar7;
      bVar1 = true;
    }
    else {
      iVar2 = -(_DAT_00808796 - uVar7);
    }
    if ((_DAT_0080a316 & 1) == 0) {
      if (bVar1) {
        _RAM_Boost_Error = func_0x0004e500(0x8000,iVar2);
      }
      else {
        _RAM_Boost_Error = func_0x0004db80(0x8000,iVar2);
      }
      func_0x0004e410(0x630ae);
      if ((_DAT_00808646 & 0x20) == 0) {
        uVar3 = 0x5f8ae;
      }
      else {
        uVar3 = 0x5f88c;
      }
      uVar7 = func_0x0004e1a8(uVar3);
      if (((_DAT_00808a32 & 0x200) != 0) && (uMem00054b16 + 0x80 <= (uVar7 & 0xffff))) {
        uVar7 = uMem00054b16 + 0x80;
      }
    }
    else {
      if (bVar1) {
        _RAM_Boost_Error = func_0x0004e500(0x8000,iVar2);
      }
      else {
        _RAM_Boost_Error = func_0x0004db80(0x8000,iVar2);
      }
      func_0x0004e410(0x630ae);
      if ((_DAT_00808646 & 0x20) == 0) {
        uVar3 = 0x5f86a;
      }
      else {
        uVar3 = 0x5f848;
      }
      uVar7 = func_0x0004e1a8(uVar3);
    }
    goto LAB_000214e4;
  }
  if ((DAT_0080888c & 0x10) == 0) {
    if ((DAT_00808870 & 0x80) == 0) goto LAB_000214e4;
    uVar8 = (_DAT_008087aa >> 3) + 1 >> 1;
    uVar5 = (uint)uMem00053288;
    if ((_DAT_00808848 & 1) != 0) {
      _RAM_Boost_Error = _DAT_00808838;
      func_0x0004e410(0x633dc);
      if ((_DAT_0080a66e & 2) == 0) {
        puVar4 = &Discovered_2D_Engine_RPM_0x60ECE;
      }
      else {
        puVar4 = &Discovered_2D_Engine_RPM_0x60EDE;
      }
      uVar5 = func_0x0004e1a8(puVar4);
    }
    uVar9 = (uint)uMem00053284;
    uVar8 = func_0x0004e500(_DAT_00808796,uVar8);
    if ((uVar8 & 0xffff) <= (uVar9 & 0xffff)) goto LAB_000214e4;
    uVar7 = func_0x0004de60(uVar5,uVar8);
  }
  else {
    uVar7 = (_DAT_008087a6 >> 3) + 1 >> 1;
    if (uVar7 < _DAT_00808796) {
      iVar2 = _DAT_00808796 - uVar7;
    }
    else {
      iVar2 = -(_DAT_00808796 - uVar7);
    }
    uVar5 = (uint)(uVar7 < _DAT_00808796);
    if ((_DAT_00808646 & 0x20) == 0) {
      uVar6 = uMem00053e84;
      if (uVar5 == 0) {
        uVar8 = (uint)uMem00053e8a;
      }
      else {
        uVar8 = (uint)uMem00053e8c;
      }
    }
    else {
      uVar6 = uMem00053e82;
      if (uVar5 == 0) {
        uVar8 = (uint)uMem00053e86;
      }
      else {
        uVar8 = (uint)uMem00053e88;
      }
    }
    uVar7 = func_0x0004de60(uVar6,iVar2);
    if ((uVar8 & 0xffff) <= (uVar7 & 0xffff)) {
      uVar7 = uVar8;
    }
    if ((uVar5 & 0xffff) == 0) {
      uVar7 = func_0x0004dc14(uVar7 + 0x80);
      goto LAB_000214e4;
    }
  }
  uVar7 = func_0x0004e500(0x80,uVar7);
LAB_000214e4:
  _DAT_00808a4e = func_0x000aa150(uVar7);
  return;
}


