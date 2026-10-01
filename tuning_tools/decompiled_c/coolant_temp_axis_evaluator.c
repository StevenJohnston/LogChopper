/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: coolant_temp_axis_evaluator
 * Address:  0x4CBE0
 * Description: Engine Coolant Temperature (ECT) Axis Breakpoint Evaluator
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void coolant_temp_axis_evaluator(void)

{
  bool bVar1;
  int iVar2;
  uint uVar3;
  ushort uVar4;
  uint uVar5;
  undefined2 uVar6;
  uint in_R10;
  ushort uVar7;
  int iStack0000002c;
  uint uStack00000030;
  int in_stack_0000003c;
  uint in_stack_00000040;
  byte in_stack_00000047;
  ushort in_stack_0000004a;
  undefined4 in_stack_00000050;
  undefined2 in_stack_00000054;
  undefined2 in_stack_0000005a;
  undefined2 in_stack_00000060;
  ushort in_stack_00000064;
  undefined2 in_stack_00000066;
  undefined2 in_stack_00000068;
  undefined1 in_stack_0000006a;
  uint uStack0000006c;
  uint uStack00000070;
  undefined4 uStack00000074;
  ushort uStack0000007a;
  ushort uStack0000007c;
  short sStack0000007e;
  ushort uStack00000080;
  ushort uStack00000082;
  ushort in_stack_00000084;
  undefined2 in_stack_00000086;
  ushort in_stack_00000088;
  ushort uStack0000008a;
  ushort uStack0000008c;
  ushort uStack0000008e;
  ushort in_stack_00000090;
  ushort uStack00000092;
  
  uStack00000092 = func_0x00068000(&ECT,0x5cab0,7);
  uStack0000008e = func_0x00068000(&ECT,0x5cac6,7);
  uStack0000008a = func_0x00068000(&ECT,0x5cadc,7);
  uStack0000008c = func_0x00068000(&ECT,0x5caf2,7);
  uStack0000007a = func_0x00068000(0x62766,0x5c9d4,0x48);
  uStack0000006c =
       func_0x0004e050((uint)_DAT_0080ab64 * 0xf424,(uint)uStack0000007a * 0x3d09,uMem00054424);
  if (((uint)in_stack_00000047 * 0x7a == 0) ||
     (uVar5 = uStack0000006c / ((uint)in_stack_00000047 * 0x7a), 0xffff < uVar5)) {
    uVar5 = 0xffff;
  }
  if ((in_stack_0000004a == 0) ||
     (uVar5 = ((uVar5 & 0xffff) << 0xe) / (uint)in_stack_0000004a, 0xffff < uVar5)) {
    uStack00000080 = 0xffff;
  }
  else {
    uStack00000080 = (ushort)uVar5;
  }
  uStack00000074 =
       func_0x0004e050(_DAT_0080a2f0,((uint)uStack0000007a * (uint)_DAT_0080a302 >> 0xc) << 8,
                       uMem00054424);
  uVar5 = _DAT_008045a4;
  if ((_DAT_00808646 & 0x10) != 0) {
    uVar5 = _DAT_008045a8;
  }
  uVar5 = (uVar5 >> 8) + (uint)_DAT_0080a5b4;
  if (uVar5 < 0x810000) {
    uStack00000082 = 0;
    if (0x7fffff < uVar5) {
      uStack00000082 = (ushort)uVar5;
    }
  }
  else {
    uStack00000082 = 0xffff;
  }
  uStack00000070 = func_0x0004e050(_DAT_0080a5dc,(uint)uStack00000082 << 8,uMem00054424);
  if (uStack00000070 < 0x3fffc1) {
    uVar5 = uStack00000070 >> 6;
  }
  else {
    uVar5 = 0xffff;
  }
  iVar2 = (uint)uStack00000082 * 4 - (uVar5 & 0xffff);
  if (iVar2 < 0x8000) {
    uVar5 = 0;
    if (-0x8001 < iVar2) {
      uVar5 = iVar2 + 0x8000;
    }
  }
  else {
    uVar5 = 0xffff;
  }
  iVar2 = ((uVar5 & 0xffff) * (uint)uMem00054432 >> 6) + (uint)uMem00054432 * -0x200;
  if (iVar2 < 0x8000) {
    uVar5 = 0;
    if (-0x8001 < iVar2) {
      uVar5 = iVar2 + 0x8000;
    }
  }
  else {
    uVar5 = 0xffff;
  }
  if ((uVar5 & 0xffff) < 0x8000) {
    uVar3 = 0x8000 - (uVar5 & 0xffff);
    if ((int)uVar3 < 0) goto LAB_0004ce3c;
  }
  else {
    uVar3 = -(-0x8000 - uVar5);
    if ((short)uVar3 < 0) {
LAB_0004ce3c:
      uVar3 = 0;
    }
  }
  uStack0000007c = (ushort)uVar5;
  if ((uVar3 & 0xffff) <= (uint)uMem00054434) {
    uStack0000007c = 0x8000;
  }
  if ((uStack00000092 < in_stack_00000090) || ((uint)uStack0000008a < (in_R10 & 0xffff))) {
    bVar1 = false;
  }
  else {
    bVar1 = true;
  }
  if (bVar1) {
    uVar7 = _DAT_0080a30a | 4;
  }
  else {
    uVar7 = _DAT_0080a30a & 0xfffb;
  }
  if ((uStack0000008e < in_stack_00000090) || ((uint)uStack0000008c < (in_R10 & 0xffff))) {
    bVar1 = false;
  }
  else {
    bVar1 = true;
  }
  uVar4 = uVar7 & 0xfff7;
  if (bVar1) {
    uVar4 = uVar7 | 8;
  }
  if (((_DAT_00808b16 & 0x10) == 0) ||
     ((((uVar4 & 0x20) != 0 || ((uVar4 & 4) == 0)) && (((uVar4 & 0x20) == 0 || ((uVar4 & 8) == 0))))
     )) {
    bVar1 = false;
  }
  else {
    bVar1 = true;
  }
  uVar7 = uVar4 & 0xffef;
  if (bVar1) {
    uVar7 = uVar4 | 0x10;
  }
  if ((uVar7 & 0x10) == 0) {
    sStack0000007e = sMem00054428;
  }
  else {
    sStack0000007e = _DAT_00808182;
  }
  if (sStack0000007e == 0) {
    uVar7 = uVar7 & 0xffdf;
  }
  else {
    uVar7 = uVar7 | 0x20;
  }
  if ((uVar7 & 0x20) == 0) {
    iVar2 = ((uint)in_stack_00000064 * (uint)uMem00054444 >> 8) + (uint)uMem00054444 * -0x80;
    if (iVar2 < 0x8000) {
      uVar5 = 0;
      if (-0x8001 < iVar2) {
        uVar5 = iVar2 + 0x8000;
      }
    }
    else {
      uVar5 = 0xffff;
    }
  }
  else {
    uVar5 = (uint)in_stack_00000084;
  }
  iVar2 = ((uVar5 & 0xffff) * (uint)in_stack_00000088 >> 4) + (uint)in_stack_00000088 * -0x800;
  if (iVar2 < 0x8000) {
    uVar5 = 0;
    if (-0x8001 < iVar2) {
      uVar5 = iVar2 + 0x8000;
    }
  }
  else {
    uVar5 = 0xffff;
  }
  uVar6 = (undefined2)uVar5;
  if ((DAT_0080a310 & 0x80) == 0) {
    bVar1 = false;
    uVar5 = (uVar5 & 0xffff) + (uint)_DAT_0080b17c;
    if (uVar5 < 0x18000) {
      uVar3 = 0;
      if (0x7fff < uVar5) {
        uVar3 = uVar5 - 0x8000;
      }
    }
    else {
      uVar3 = 0xffff;
    }
    uVar5 = (uint)uStack0000007c + (uVar3 & 0xffff);
    if (uVar5 < 0x18000) {
      if (uVar5 < 0x8000) {
        _DAT_0080a5d0 = 0;
      }
      else {
        _DAT_0080a5d0 = (short)uVar5 + -0x8000;
      }
    }
    else {
      _DAT_0080a5d0 = -1;
    }
  }
  else {
    bVar1 = true;
    _DAT_0080a5d0 = _DAT_0080b184;
  }
  if (bVar1) {
    _DAT_0080a5ca = _DAT_0080b182;
    goto LAB_0004d0e4;
  }
  if (_DAT_0080a302 == 0) {
LAB_0004d0c0:
    uStack00000030 = 0xffffffff;
  }
  else {
    func_0x000693bc(uStack00000074,250000,&stack0x0000003c);
    uStack00000030 = in_stack_00000040;
    iStack0000002c = in_stack_0000003c;
    func_0x00069160(&stack0x0000002c,_DAT_0080a302);
    if (iStack0000002c != 0) goto LAB_0004d0c0;
  }
  if (uStack00000030 / 0x3d09 < 0x10000) {
    _DAT_0080a5ca = (undefined2)(uStack00000030 / 0x3d09);
  }
  else {
    _DAT_0080a5ca = 0xffff;
  }
LAB_0004d0e4:
  _DAT_0080a2f0 = uStack00000074;
  _DAT_0080a5ce = in_stack_00000084;
  _DAT_0080a30a = uVar7;
  _DAT_00808182 = sStack0000007e;
  _DAT_0080a5d8 = uVar6;
  _DAT_0080a5e0 = uStack0000007c;
  _DAT_0080a5e2 = uStack00000082;
  _DAT_0080a5dc = uStack00000070;
  _DAT_0080ab62 = uStack00000080 >> 2;
  _DAT_0080a5c2 = uStack0000007a;
  if (uStack0000006c / 0xf424 < 0x10000) {
    _DAT_0080ab64 = (ushort)(uStack0000006c / 0xf424);
  }
  else {
    _DAT_0080ab64 = 0xffff;
  }
  _DAT_0080a2f4 = in_stack_00000086;
  _DAT_0080a2f8 = in_stack_00000066;
  _DAT_0080a304 = in_stack_00000060;
  _DAT_0080a2fa = in_stack_00000054;
  DAT_0080a2fc = in_stack_0000006a;
  _DAT_0080a2e6 = in_stack_00000068;
  _DAT_0080a2e4 = in_stack_0000005a;
  _DAT_0080a5d4 = in_stack_00000050;
  return;
}


