/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_ignition_timing_control
 * Address:  0x4BF18
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_ignition_timing_control(void)

{
  bool bVar1;
  bool bVar2;
  int iVar3;
  uint uVar4;
  undefined4 uVar5;
  char cVar6;
  uint uVar7;
  char cVar9;
  ushort uVar8;
  ushort uVar10;
  uint uVar11;
  undefined2 uVar12;
  uint uVar13;
  short *in_FP;
  uint uStack_6c;
  uint uStack_68;
  ushort uStack_62;
  uint uStack_60;
  uint uStack_5c;
  uint uStack_58;
  byte bStack_51;
  ushort uStack_50;
  ushort uStack_4e;
  ushort uStack_4c;
  ushort uStack_4a;
  uint uStack_48;
  ushort uStack_44;
  ushort uStack_42;
  ushort uStack_40;
  short sStack_3e;
  ushort uStack_3c;
  ushort uStack_3a;
  ushort uStack_38;
  undefined2 uStack_36;
  ushort uStack_34;
  ushort uStack_32;
  ushort uStack_30;
  byte bStack_2e;
  char cStack_2d;
  uint uStack_2c;
  uint uStack_28;
  undefined4 uStack_24;
  ushort uStack_1e;
  ushort uStack_1c;
  short sStack_1a;
  ushort uStack_18;
  ushort uStack_16;
  ushort uStack_14;
  short sStack_12;
  ushort uStack_10;
  ushort uStack_e;
  ushort uStack_c;
  ushort uStack_a;
  ushort uStack_8;
  undefined2 uStack_6;
  
  func_0x0004d1f0(&DAT_0080b18a,&DAT_0080b18c,&DAT_0080b182);
  func_0x0004d270(_DAT_0080b18c,_DAT_0080b182,_DAT_0080b180);
  if ((uint)_DAT_0080a5ec * (uint)_DAT_0080a5ea < 0x10000) {
    uStack_4e = (ushort)((uint)_DAT_0080a5ec * (uint)_DAT_0080a5ea);
  }
  else {
    uStack_4e = 0xffff;
  }
  iVar3 = (uint)_DAT_00808b44 * 0x20 - (uint)_DAT_0080a304;
  if (iVar3 < 0x8000) {
    uStack_50 = 0;
    if (-0x8001 < iVar3) {
      uStack_50 = (short)iVar3 + 0x8000;
    }
  }
  else {
    uStack_50 = 0xffff;
  }
  iVar3 = (uint)_DAT_0080b18c - (uint)_DAT_0080a304;
  if (iVar3 < 0x8000) {
    uVar13 = 0;
    if (-0x8001 < iVar3) {
      uVar13 = iVar3 + 0x8000;
    }
  }
  else {
    uVar13 = 0xffff;
  }
  bStack_51 = func_0x00068074(0x62748,0x5c9c2,0xb);
  func_0x000693bc(uMem00054424,_DAT_0080a5d4,&uStack_5c);
  uStack_58 = uStack_58 >> 8 | uStack_5c << 0x18;
  uStack_5c = uStack_5c >> 8;
  uVar11 = uStack_58 + (uint)uMem00054424 * -0x800000;
  iVar3 = uStack_5c - (uMem00054424 >> 9);
  if (uStack_58 < uVar11) {
    iVar3 = iVar3 + -1;
  }
  uStack_60 = uVar11 + 0x80000000;
  if (uStack_60 < uVar11) {
    iVar3 = iVar3 + 1;
  }
  if (iVar3 < 1) {
    if (iVar3 < 0) {
      uStack_60 = 0;
    }
  }
  else {
    uStack_60 = 0xffffffff;
  }
  if ((int)-(uint)uMem00054424 < -0x100) {
    uStack_62 = 0;
  }
  else {
    uStack_62 = (short)-(uint)uMem00054424 + 0x100;
  }
  bVar1 = (_DAT_0080a30a & 0x2000) != 0;
  if ((_DAT_0080a316 & 1) == 0) {
    uStack_4a = uMem00054430;
  }
  else if (bVar1) {
    uStack_4a = uMem0005443c;
  }
  else {
    uStack_4a = uMem0005443a;
  }
  if (((uMem0005443e < _DAT_00808838) || ((_DAT_0080a30a & 0x4000) == 0)) || (bVar1)) {
    uStack_4c = 0x20;
  }
  else {
    uStack_4c = uMem00054440;
  }
  iVar3 = (uint)_DAT_0080a304 - (uint)uMem00054446;
  if (iVar3 < 0x8000) {
    uVar11 = 0;
    if (-0x8001 < iVar3) {
      uVar11 = iVar3 + 0x8000;
    }
  }
  else {
    uVar11 = 0xffff;
  }
  uVar4 = (uint)_DAT_00808b44 * 0x20 - (uVar11 & 0xffff);
  if (-1 < (int)uVar4) {
    uVar4 = 0xffff;
  }
  if ((uVar4 & 0xffff) < 0x8000) {
    uVar10 = (short)uVar11 + 0x8000;
    if ((short)uVar10 < 0) {
      uVar10 = 0;
    }
  }
  else if ((uint)_DAT_00808b44 << 5 < 0x10000) {
    uVar10 = (ushort)((uint)_DAT_00808b44 << 5);
  }
  else {
    uVar10 = 0xffff;
  }
  if ((uint)uMem00054448 + (uint)_DAT_0080a304 < 0x8000) {
    uVar11 = (uint)uMem00054448 + (uint)_DAT_0080a304 + 0x8000;
  }
  else {
    uVar11 = 0xffff;
  }
  uVar4 = (uint)_DAT_00808b44 * 0x20 - (uVar11 & 0xffff);
  if (-1 < (int)uVar4) {
    uVar4 = 0xffff;
  }
  if ((uVar4 & 0xffff) < 0x8001) {
    if ((uint)_DAT_00808b44 << 5 < 0x10000) {
      uStack_38 = (ushort)((uint)_DAT_00808b44 << 5);
    }
    else {
      uStack_38 = 0xffff;
    }
  }
  else {
    uStack_38 = (short)uVar11 + 0x8000;
    if ((short)uStack_38 < 0) {
      uStack_38 = 0;
    }
  }
  if ((((_DAT_00808b16 & 0x10) == 0) || ((_DAT_0080b18e & 0x10) != 0)) ||
     ((uVar13 & 0xffff) < 0x8001)) {
    if (uStack_50 < 0x8000) {
      uStack_38 = uVar10;
    }
  }
  else {
    uStack_38 = _DAT_0080b18c;
  }
  bVar1 = (_DAT_0080a30a & 0x8000) == 0;
  uStack_6 = CONCAT11(uStack_6._0_1_,bVar1);
  uStack_3a = _DAT_0080a316 & 1;
  cStack_2d = (_DAT_0080a30a & 0x2000) == 0;
  bVar2 = (_DAT_0080a30a & 0x2000) != 0;
  uVar10 = uMem0005441e;
  if (!bVar2) {
    uVar10 = uMem0005442a;
  }
  uVar13 = (uint)uVar10;
  if (((bVar2) || ((_DAT_0080a30a & 0x4000) == 0)) || (uMem0005443e < _DAT_00808838)) {
    uVar11 = 0x20;
  }
  else {
    uVar11 = (uint)uMem00054442;
  }
  if ((uint)uMem00054422 * (uint)uStack_4e < 0x3fffc001) {
    uStack_42 = (ushort)((uint)uMem00054422 * (uint)uStack_4e >> 0xe);
  }
  else {
    uStack_42 = 0xffff;
  }
  if ((_DAT_0080a300 == 0) || (0xffff < 0x1d4c000 / _DAT_0080a300)) {
    uStack_40 = 0xffff;
  }
  else {
    uStack_40 = (ushort)(0x1d4c000 / _DAT_0080a300);
  }
  uVar4 = ((uint)uStack_40 * 0x19) / 0xc;
  if (uVar4 < 0x10000) {
    uStack_3c = (ushort)uVar4;
  }
  else {
    uStack_3c = 0xffff;
  }
  if ((uint)uMem00054420 * (uint)uStack_40 < 0x3fffc01) {
    uVar4 = (uint)uMem00054420 * (uint)uStack_40 >> 10;
  }
  else {
    uVar4 = 0xffff;
  }
  if (bVar1) {
    uVar5 = 0x4d1b4;
    uVar12 = _DAT_008087b4;
  }
  else {
    uVar5 = 0x4d1dc;
    uVar12 = _DAT_008087c8;
  }
  sStack_3e = func_0x00068264(uVar5,uVar12,uStack_40);
  iVar3 = (uint)uStack_40 - (uint)uStack_38;
  if (iVar3 < 0x8000) {
    uStack_44 = 0;
    if (-0x8001 < iVar3) {
      uStack_44 = (short)iVar3 + 0x8000;
    }
  }
  else {
    uStack_44 = 0xffff;
  }
  cVar9 = -1;
  if (0x7fff < uStack_44) {
    cVar9 = 0x8000 < uStack_44;
  }
  iVar3 = (uint)uStack_40 - (uint)_DAT_0080b18a;
  if (iVar3 < 0x8000) {
    uVar7 = 0;
    if (-0x8001 < iVar3) {
      uVar7 = iVar3 + 0x8000;
    }
  }
  else {
    uVar7 = 0xffff;
  }
  uVar7 = ((uVar7 & 0xffff) >> 1) + 0x4000;
  uStack_36 = (undefined2)uVar7;
  iVar3 = ((uVar7 * -0x10000 >> 0x10) * (uVar13 & 0xffff) >> 6) + (uVar13 & 0xffff) * -0x200;
  if (iVar3 < 0x8000) {
    uVar13 = 0;
    if (-0x8001 < iVar3) {
      uVar13 = iVar3 + 0x8000;
    }
  }
  else {
    uVar13 = 0xffff;
  }
  iVar3 = ((uVar13 & 0xffff) * (uVar4 & 0xffff) >> 0xc) + (uVar4 & 0xffff) * -8;
  if (iVar3 < 0x8000) {
    uVar13 = 0;
    if (-0x8001 < iVar3) {
      uVar13 = iVar3 + 0x8000;
    }
  }
  else {
    uVar13 = 0xffff;
  }
  iVar3 = ((uVar13 & 0xffff) * (uint)uStack_42 >> 0xc) + (uint)uStack_42 * -8;
  if (iVar3 < 0x8000) {
    uVar13 = 0;
    if (-0x8001 < iVar3) {
      uVar13 = iVar3 + 0x8000;
    }
  }
  else {
    uVar13 = 0xffff;
  }
  iVar3 = ((uVar13 & 0xffff) * (uVar11 & 0xffff) >> 5) + (uVar11 & 0xffff) * -0x400;
  if (iVar3 < 0x8000) {
    if (iVar3 < -0x8000) {
      _DAT_0080b176 = 0;
    }
    else {
      _DAT_0080b176 = (short)iVar3 + 0x8000;
    }
  }
  else {
    _DAT_0080b176 = 0xffff;
  }
  cVar6 = -1;
  if (0x7fff < uVar7) {
    cVar6 = 0x8000 < uVar7;
  }
  bStack_2e = cVar6 * cVar9 + 0x80;
  if ((DAT_0080b192 < 0x80) && (bStack_2e < 0x80)) {
    uVar13 = func_0x00068000(0x626fc,0x5ca78,0xc);
    uVar13 = (uVar13 & 0xffff) + (uint)uStack_38;
    if (uVar13 < 0x18000) {
      uStack_32 = 0;
      if (0x7fff < uVar13) {
        uStack_32 = (short)uVar13 + 0x8000;
      }
    }
    else {
      uStack_32 = 0xffff;
    }
  }
  else {
    uStack_32 = uStack_38;
  }
  if ((char)uStack_6 == '\0') {
    uVar5 = 0x4d1c8;
    uVar12 = _DAT_008087c8;
  }
  else {
    uVar5 = 0x4d1a0;
    uVar12 = _DAT_008087b4;
  }
  uStack_30 = func_0x00068264(uVar5,uVar12,uStack_32);
  iVar3 = ((uint)(ushort)((uStack_30 - sStack_3e) + 0x8000) * (uint)uStack_42 >> 0xc) +
          (uint)uStack_42 * -8;
  if (iVar3 < 0x8000) {
    uStack_34 = 0;
    if (-0x8001 < iVar3) {
      uStack_34 = (short)iVar3 + 0x8000;
    }
  }
  else {
    uStack_34 = 0xffff;
  }
  iVar3 = ((uint)uStack_34 * (uint)uStack_4a >> 7) + (uint)uStack_4a * -0x100;
  if (iVar3 < 0x8000) {
    uVar13 = 0;
    if (-0x8001 < iVar3) {
      uVar13 = iVar3 + 0x8000;
    }
  }
  else {
    uVar13 = 0xffff;
  }
  iVar3 = ((uVar13 & 0xffff) * (uint)uStack_4c >> 5) + (uint)uStack_4c * -0x400;
  if (iVar3 < 0x8000) {
    if (iVar3 < -0x8000) {
      _DAT_0080b178 = 0;
    }
    else {
      _DAT_0080b178 = (short)iVar3 + 0x8000;
    }
  }
  else {
    _DAT_0080b178 = 0xffff;
  }
  iVar3 = (uint)uStack_32 - (uint)uStack_40;
  if (iVar3 < 0x8000) {
    uVar13 = 0;
    if (-0x8001 < iVar3) {
      uVar13 = iVar3 + 0x8000;
    }
  }
  else {
    uVar13 = 0xffff;
  }
  iVar3 = -((uVar13 & 0xffff) * -0x100 + 0x800000);
  if (uStack_40 == 0) {
    if (iVar3 < 0) {
      uVar11 = 0;
    }
    else {
      uVar11 = 0xffff;
    }
  }
  else {
    uVar11 = iVar3 / (int)(uint)uStack_40 + 0x8000;
  }
  iVar3 = ((uVar11 & 0xffff) * (uint)uStack_30 >> 8) + (uint)uStack_30 * -0x80;
  if (iVar3 < 0x8000) {
    uVar11 = 0;
    if (-0x8001 < iVar3) {
      uVar11 = iVar3 + 0x8000;
    }
  }
  else {
    uVar11 = 0xffff;
  }
  uVar4 = (uVar11 & 0xffff) * (uint)uStack_62;
  uVar7 = uVar4 + (uint)uStack_62 * -0x8000;
  if (uVar4 < uVar7) {
    uStack_5c = 0xffffffff;
  }
  else {
    uStack_5c = 0;
  }
  uStack_58 = uVar7 + 0x80000000;
  if (uStack_58 < uVar7) {
    uStack_5c = uStack_5c + 1;
  }
  if (uStack_5c != 0) {
    uStack_58 = 0xffffffff;
  }
  uStack_58 = uStack_58 + uStack_60;
  uStack_5c = (uint)(uStack_58 < uStack_60);
  uStack_48 = -(-0x80000000 - uStack_58);
  uVar4 = uStack_5c;
  if (uStack_58 < uStack_48) {
    uVar4 = uStack_5c - 1;
  }
  if ((int)uVar4 < 1) {
    if ((int)uVar4 < 0) {
      uStack_48 = 0;
    }
  }
  else {
    uStack_48 = 0xffffffff;
  }
  if ((uVar13 & 0xffff) < 0x8001) {
    _DAT_0080b17a = 0x8000;
  }
  else {
    uVar13 = (uVar11 & 0xffff) - (uStack_48 >> 8);
    if ((int)uVar13 < -0x7f0000) {
      uVar11 = 0;
      if (-0x800001 < (int)uVar13) {
        uVar11 = uVar13;
      }
    }
    else {
      uVar11 = 0xffff;
    }
    iVar3 = ((uVar11 & 0xffff) * (uint)uStack_42 >> 0xc) + (uint)uStack_42 * -8;
    if (iVar3 < 0x8000) {
      if (iVar3 < -0x8000) {
        _DAT_0080b17a = 0;
      }
      else {
        _DAT_0080b17a = (short)iVar3 + 0x8000;
      }
    }
    else {
      _DAT_0080b17a = 0xffff;
    }
  }
  iVar3 = (uint)uStack_40 + (uint)_DAT_00808b44 * -0x20;
  if (iVar3 < 0x8000) {
    if (iVar3 < -0x8000) {
      _DAT_0080b174 = 0;
    }
    else {
      _DAT_0080b174 = (short)iVar3 + 0x8000;
    }
  }
  else {
    _DAT_0080b174 = 0xffff;
  }
  iVar3 = (uint)uStack_40 - (uint)_DAT_0080b18c;
  if (iVar3 < 0x8000) {
    uVar13 = 0;
    if (-0x8001 < iVar3) {
      uVar13 = iVar3 + 0x8000;
    }
  }
  else {
    uVar13 = 0xffff;
  }
  iVar3 = ((uVar13 & 0xffff) * (uint)uStack_3c >> 8) + (uint)uStack_3c * -0x80;
  if (iVar3 < 0x8000) {
    sStack_12 = 0;
    if (-0x8001 < iVar3) {
      sStack_12 = (short)iVar3 + -0x8000;
    }
  }
  else {
    sStack_12 = -1;
  }
  if (cStack_2d == '\0') {
    uVar5 = 0x5caa2;
  }
  else {
    uVar5 = 0x5ca96;
  }
  uVar13 = func_0x00068074(0x626d0,uVar5,7);
  if (uStack_3a != 0) {
    if (cStack_2d == '\0') {
      if (0xff < uMem00054438) goto LAB_0004ca8c;
      uVar13 = (uint)uMem00054438;
    }
    else if (uMem00054436 < 0x100) {
      uVar13 = (uint)uMem00054436;
    }
    else {
LAB_0004ca8c:
      uVar13 = 0xff;
    }
  }
  _DAT_0080a2e8 = (ushort)((uint)bStack_51 * (uVar13 & 0xff) >> 7);
  _DAT_0080a2de = uStack_40;
  _DAT_0080a2e0 = uStack_36;
  _DAT_0080a2e2 = _DAT_0080b174;
  _DAT_0080a5bc = _DAT_0080b176;
  _DAT_0080a5be = _DAT_0080b178;
  _DAT_0080a5c0 = _DAT_0080b17a;
  if (_DAT_0080b174 < 0x8000) {
    if ((int)(0x8000 - (uint)_DAT_0080b174) < 0) goto LAB_0004cb24;
    uStack_8 = (ushort)(0x8000 - (uint)_DAT_0080b174);
  }
  else {
    uStack_8 = *in_FP + 0x7174;
    if ((short)uStack_8 < 0) {
LAB_0004cb24:
      uStack_8 = 0;
    }
  }
  uVar13 = (uint)_DAT_0080b17a + (uint)_DAT_0080b178;
  if (uVar13 < 0x18000) {
    uVar11 = 0;
    if (0x7fff < uVar13) {
      uVar11 = uVar13 - 0x8000;
    }
  }
  else {
    uVar11 = 0xffff;
  }
  uVar13 = (uVar11 & 0xffff) + (uint)_DAT_0080b176;
  if (uVar13 < 0x18000) {
    uStack_14 = 0;
    if (0x7fff < uVar13) {
      uStack_14 = (short)uVar13 + 0x8000;
    }
  }
  else {
    uStack_14 = 0xffff;
  }
  if (uStack_14 < 0x8000) {
    uVar13 = 0x8000 - uStack_14;
    if ((int)uVar13 < 0) goto LAB_0004cbd4;
  }
  else {
    uVar13 = uStack_14 + 0x8000;
    if ((short)uVar13 < 0) {
LAB_0004cbd4:
      uVar13 = 0;
    }
  }
  uStack_10 = _DAT_0080a2e8;
  uStack_6 = func_0x00068000(&ECT,0x5cab0,7);
  uStack_a = func_0x00068000(&ECT,0x5cac6,7);
  uStack_e = func_0x00068000(&ECT,0x5cadc,7);
  uStack_c = func_0x00068000(&ECT,0x5caf2,7);
  uStack_1e = func_0x00068000(0x62766,0x5c9d4,0x48);
  uStack_2c = func_0x0004e050((uint)_DAT_0080ab64 * 0xf424,(uint)uStack_1e * 0x3d09,uMem00054424);
  if (((uint)bStack_51 * 0x7a == 0) ||
     (uVar11 = uStack_2c / ((uint)bStack_51 * 0x7a), 0xffff < uVar11)) {
    uVar11 = 0xffff;
  }
  if ((uStack_4e == 0) || (uVar11 = ((uVar11 & 0xffff) << 0xe) / (uint)uStack_4e, 0xffff < uVar11))
  {
    uStack_18 = 0xffff;
  }
  else {
    uStack_18 = (ushort)uVar11;
  }
  uStack_24 = func_0x0004e050(_DAT_0080a2f0,((uint)uStack_1e * (uint)_DAT_0080a302 >> 0xc) << 8,
                              uMem00054424);
  uVar11 = _DAT_008045a4;
  if ((_DAT_00808646 & 0x10) != 0) {
    uVar11 = _DAT_008045a8;
  }
  uVar11 = (uVar11 >> 8) + (uint)_DAT_0080a5b4;
  if (uVar11 < 0x810000) {
    uStack_16 = 0;
    if (0x7fffff < uVar11) {
      uStack_16 = (ushort)uVar11;
    }
  }
  else {
    uStack_16 = 0xffff;
  }
  uStack_28 = func_0x0004e050(_DAT_0080a5dc,(uint)uStack_16 << 8,uMem00054424);
  if (uStack_28 < 0x3fffc1) {
    uVar11 = uStack_28 >> 6;
  }
  else {
    uVar11 = 0xffff;
  }
  iVar3 = (uint)uStack_16 * 4 - (uVar11 & 0xffff);
  if (iVar3 < 0x8000) {
    uVar11 = 0;
    if (-0x8001 < iVar3) {
      uVar11 = iVar3 + 0x8000;
    }
  }
  else {
    uVar11 = 0xffff;
  }
  iVar3 = ((uVar11 & 0xffff) * (uint)uMem00054432 >> 6) + (uint)uMem00054432 * -0x200;
  if (iVar3 < 0x8000) {
    uVar11 = 0;
    if (-0x8001 < iVar3) {
      uVar11 = iVar3 + 0x8000;
    }
  }
  else {
    uVar11 = 0xffff;
  }
  if ((uVar11 & 0xffff) < 0x8000) {
    uVar4 = 0x8000 - (uVar11 & 0xffff);
    if ((int)uVar4 < 0) goto LAB_0004ce3c;
  }
  else {
    uVar4 = -(-0x8000 - uVar11);
    if ((short)uVar4 < 0) {
LAB_0004ce3c:
      uVar4 = 0;
    }
  }
  uStack_1c = (ushort)uVar11;
  if ((uVar4 & 0xffff) <= (uint)uMem00054434) {
    uStack_1c = 0x8000;
  }
  if ((uStack_6 < uStack_8) || ((uint)uStack_e < (uVar13 & 0xffff))) {
    bVar1 = false;
  }
  else {
    bVar1 = true;
  }
  if (bVar1) {
    uVar10 = _DAT_0080a30a | 4;
  }
  else {
    uVar10 = _DAT_0080a30a & 0xfffb;
  }
  if ((uStack_a < uStack_8) || ((uint)uStack_c < (uVar13 & 0xffff))) {
    bVar1 = false;
  }
  else {
    bVar1 = true;
  }
  uVar8 = uVar10 & 0xfff7;
  if (bVar1) {
    uVar8 = uVar10 | 8;
  }
  if (((_DAT_00808b16 & 0x10) == 0) ||
     ((((uVar8 & 0x20) != 0 || ((uVar8 & 4) == 0)) && (((uVar8 & 0x20) == 0 || ((uVar8 & 8) == 0))))
     )) {
    bVar1 = false;
  }
  else {
    bVar1 = true;
  }
  uVar10 = uVar8 & 0xffef;
  if (bVar1) {
    uVar10 = uVar8 | 0x10;
  }
  if ((uVar10 & 0x10) == 0) {
    sStack_1a = sMem00054428;
  }
  else {
    sStack_1a = _DAT_00808182;
  }
  if (sStack_1a == 0) {
    uVar10 = uVar10 & 0xffdf;
  }
  else {
    uVar10 = uVar10 | 0x20;
  }
  if ((uVar10 & 0x20) == 0) {
    iVar3 = ((uint)uStack_34 * (uint)uMem00054444 >> 8) + (uint)uMem00054444 * -0x80;
    if (iVar3 < 0x8000) {
      uVar13 = 0;
      if (-0x8001 < iVar3) {
        uVar13 = iVar3 + 0x8000;
      }
    }
    else {
      uVar13 = 0xffff;
    }
  }
  else {
    uVar13 = (uint)uStack_14;
  }
  iVar3 = ((uVar13 & 0xffff) * (uint)uStack_10 >> 4) + (uint)uStack_10 * -0x800;
  if (iVar3 < 0x8000) {
    uVar13 = 0;
    if (-0x8001 < iVar3) {
      uVar13 = iVar3 + 0x8000;
    }
  }
  else {
    uVar13 = 0xffff;
  }
  uVar12 = (undefined2)uVar13;
  if ((DAT_0080a310 & 0x80) == 0) {
    bVar1 = false;
    uVar13 = (uVar13 & 0xffff) + (uint)_DAT_0080b17c;
    if (uVar13 < 0x18000) {
      uVar11 = 0;
      if (0x7fff < uVar13) {
        uVar11 = uVar13 - 0x8000;
      }
    }
    else {
      uVar11 = 0xffff;
    }
    uVar13 = (uint)uStack_1c + (uVar11 & 0xffff);
    if (uVar13 < 0x18000) {
      if (uVar13 < 0x8000) {
        _DAT_0080a5d0 = 0;
      }
      else {
        _DAT_0080a5d0 = (short)uVar13 + -0x8000;
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
    uStack_68 = 0xffffffff;
  }
  else {
    func_0x000693bc(uStack_24,250000,&uStack_5c);
    uStack_68 = uStack_58;
    uStack_6c = uStack_5c;
    func_0x00069160(&uStack_6c,_DAT_0080a302);
    if (uStack_6c != 0) goto LAB_0004d0c0;
  }
  if (uStack_68 / 0x3d09 < 0x10000) {
    _DAT_0080a5ca = (undefined2)(uStack_68 / 0x3d09);
  }
  else {
    _DAT_0080a5ca = 0xffff;
  }
LAB_0004d0e4:
  _DAT_0080a2f0 = uStack_24;
  _DAT_0080a5ce = uStack_14;
  _DAT_0080a30a = uVar10;
  _DAT_00808182 = sStack_1a;
  _DAT_0080a5d8 = uVar12;
  _DAT_0080a5e0 = uStack_1c;
  _DAT_0080a5e2 = uStack_16;
  _DAT_0080a5dc = uStack_28;
  _DAT_0080ab62 = uStack_18 >> 2;
  _DAT_0080a5c2 = uStack_1e;
  if (uStack_2c / 0xf424 < 0x10000) {
    _DAT_0080ab64 = (ushort)(uStack_2c / 0xf424);
  }
  else {
    _DAT_0080ab64 = 0xffff;
  }
  _DAT_0080a2f4 = sStack_12;
  _DAT_0080a2f8 = uStack_32;
  _DAT_0080a304 = uStack_38;
  _DAT_0080a2fa = uStack_44;
  DAT_0080a2fc = bStack_2e;
  _DAT_0080a2e6 = uStack_30;
  _DAT_0080a2e4 = sStack_3e;
  _DAT_0080a5d4 = uStack_48;
  return;
}


