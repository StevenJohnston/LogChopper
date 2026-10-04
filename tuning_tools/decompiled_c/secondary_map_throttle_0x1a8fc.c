/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: secondary_map_throttle_0x1a8fc
 * Address:  0x1A8FC
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void secondary_map_throttle_0x1a8fc(void)

{
  bool bVar1;
  ushort uVar4;
  ushort uVar5;
  undefined4 uVar2;
  undefined4 uVar3;
  undefined2 uVar6;
  undefined2 uVar7;
  undefined1 uVar11;
  ushort uVar8;
  undefined2 uVar9;
  undefined2 uVar10;
  uint uVar12;
  int iVar13;
  int iVar14;
  uint uVar15;
  undefined2 uStack_14;
  
  bVar1 = false;
  func_0x00000310();
  uVar4 = _DAT_0080a736;
  if (_DAT_0080a736 < 0x8000) {
    uVar4 = -_DAT_0080a736;
  }
  if ((_DAT_008096be == _DAT_0080a268) && ((ushort)(uVar4 + 0x8000) <= uMem00054aec)) {
    uVar12 = 1;
  }
  else {
    uVar12 = 0;
    _DAT_0080aaca = sMem00054aee;
  }
  func_0x00000328();
  if (0x7ff < _DAT_00808796) {
    _DAT_008083ac = sMem000547c2;
    return;
  }
  uStack_14 = _DAT_0080aaa4;
  uVar4 = func_0x0004df48(_DAT_00808796,0x100);
  uVar5 = func_0x0004db80(1);
  uVar2 = func_0x0004e490(uVar4,0x100);
  uVar3 = func_0x0004e490(uVar5,0x100);
  uVar6 = func_0x0004e500(_DAT_00808796,uVar2);
  uVar2 = func_0x0004e500(uVar3,_DAT_00808796);
  if (((((_DAT_00808890 & 0x10) != 0) && ((uVar12 & 0xffff) != 0)) && (_DAT_0080aaca == 0)) &&
     ((_DAT_00808854 & 8) == 0)) {
    if (_DAT_008083ac != 0) goto LAB_0001aaf8;
    uVar7 = func_0x0004dcf4(uMem000547c4,uVar2,0x100);
    uVar2 = func_0x0004dcf4(uMem000547c4,uVar6,0x100);
    uVar3 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC5E4_0x5F9D0);
    uVar11 = func_0x0004ef7c(0x615b8,_DAT_00808734);
    uVar8 = func_0x0004dcf4(uVar3,uVar11,0xff);
    iVar13 = (uint)uVar4 * 2;
    if (_RAM_Load_Timing < uVar8) {
      uVar7 = func_0x0004db80(*(undefined2 *)(iVar13 + 0x804d96),uVar7);
      *(undefined2 *)(iVar13 + 0x804d96) = uVar7;
      uVar7 = func_0x0004db80(*(undefined2 *)((uint)uVar5 * 2 + 0x804d96),uVar2);
    }
    else {
      uVar7 = func_0x0004e500(*(undefined2 *)(iVar13 + 0x804d96),uVar7);
      *(undefined2 *)(iVar13 + 0x804d96) = uVar7;
      uVar7 = func_0x0004e500(*(undefined2 *)((uint)uVar5 * 2 + 0x804d96),uVar2);
    }
    *(undefined2 *)((uint)uVar5 * 2 + 0x804d96) = uVar7;
    bVar1 = true;
  }
  _DAT_008083ac = sMem000547c2;
LAB_0001aaf8:
  uVar7 = func_0x0004e500(0x1000,uMem00054af0);
  uVar9 = func_0x0004db80(0x1000,uMem00054af0);
  uVar12 = (uint)uVar4;
  iVar14 = uVar12 * 2;
  uVar10 = func_0x0004dc38(*(undefined2 *)(iVar14 + 0x804d96),uVar7,uVar9);
  *(undefined2 *)(iVar14 + 0x804d96) = uVar10;
  uVar15 = (uint)uVar5;
  iVar13 = uVar15 * 2;
  uVar10 = func_0x0004dc38(*(undefined2 *)(iVar13 + 0x804d96),uVar7,uVar9);
  *(undefined2 *)(iVar13 + 0x804d96) = uVar10;
  if (bVar1) {
    if (*(ushort *)(iVar13 + 0x804d96) < *(ushort *)(iVar14 + 0x804d96)) {
      uVar8 = *(ushort *)(iVar13 + 0x804d96);
    }
    else {
      uVar8 = *(ushort *)(iVar14 + 0x804d96);
      uVar12 = uVar15;
    }
    uVar2 = func_0x0004dcf4((uint)*(ushort *)(uVar12 * 2 + 0x804d96) - (uint)uVar8,uVar6,0x100);
    uVar6 = *(undefined2 *)((uint)uVar4 * 2 + 0x804d96);
    if (*(ushort *)((uint)uVar4 * 2 + 0x804d96) < *(ushort *)((uint)uVar5 * 2 + 0x804d96)) {
      uStack_14 = func_0x0004db80(uVar6,uVar2);
    }
    else {
      uStack_14 = func_0x0004e500(uVar6,uVar2);
    }
  }
  _DAT_0080aaa4 = func_0x0004dc38(uStack_14,uVar7,uVar9);
  return;
}


