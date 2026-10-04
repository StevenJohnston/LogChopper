/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: vss_speed_calculation_0x137d0
 * Address:  0x137D0
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void vss_speed_calculation_0x137d0(void)

{
  bool bVar1;
  short sVar3;
  uint uVar2;
  ushort uVar4;
  ushort uVar5;
  ushort uVar6;
  uint uVar7;
  uint uVar8;
  undefined2 uVar9;
  ushort uStack_a;
  ushort uStack_8;
  ushort uStack_6;
  
  uStack_8 = _DAT_00808658;
  uVar5 = _DAT_0080864e;
  _DAT_00808644 = _DAT_00808642;
  _DAT_00808650 = _DAT_0080864e;
  _DAT_0080865c = _DAT_00808658;
  uVar7 = (uint)_DAT_0080a470;
  uVar4 = _DAT_0080a7ce & 7;
  uVar6 = _DAT_0080a47a & 0xf;
  if (((_DAT_00808848 & 1) == 0) || ((_DAT_00808c2c & 8) != 0)) {
    if ((_DAT_00808848 & 2) != 0) {
      if (uVar6 == 0xb) goto LAB_00013860;
      if (((((uVar6 == 6) || (uVar6 == 5)) || (uVar6 == 4)) || ((uVar6 == 3 || (uVar6 == 2)))) ||
         (uVar6 == 1)) goto LAB_00013898;
      if (uVar6 == 0xd) goto LAB_000138c4;
    }
LAB_000138cc:
    uStack_a = 0xfff2;
    uVar4 = 2;
LAB_000138d4:
    uStack_a = (uVar4 | _DAT_00808662) & uStack_a;
    _DAT_008080de = sMem000545f4;
  }
  else {
    if (uVar4 == 1) {
LAB_00013860:
      uStack_a = 0xfff4;
      uVar4 = 4;
    }
    else {
      if (uVar4 != 4) {
        if (uVar4 != 0) goto LAB_000138cc;
LAB_000138c4:
        uStack_a = 0xfff8;
        uVar4 = 8;
        goto LAB_000138d4;
      }
LAB_00013898:
      uStack_a = 0xfff1;
      uVar4 = 1;
    }
    uStack_a = (uVar4 | _DAT_00808662) & uStack_a;
    _DAT_008080dc = sMem000545f2;
  }
  uVar8 = _DAT_00808642 & 0xb9ff;
  uStack_6 = _DAT_0080864e & 0xffef;
  if (((_DAT_00808870 & 0x11) == 0) && (uMem000532d0 <= _DAT_0080800e)) {
    if ((_DAT_00808848 & 3) != 0) {
      if ((((uStack_a & 10) != 0) && (_DAT_008080dc == 0)) ||
         ((((uStack_a & 5) == 0 || (_DAT_008080de != 0)) && ((_DAT_00808646 & 0x20) != 0))))
      goto LAB_0001394c;
      uVar8 = _DAT_00808642 & 0xb9df;
    }
  }
  else {
LAB_0001394c:
    uVar8 = uVar8 | 0x20;
  }
  sVar3 = func_0x000aa540();
  if ((sVar3 == 0) && (uMem000532da < _DAT_00808686)) {
    func_0x0004e410(0x6248c);
    uVar2 = func_0x0004e1a8(&Discovered_2D_Engine_RPM_0x5F96E);
    if ((uint)_DAT_0080800c < (uVar2 & 0xffff) * 0x28) goto LAB_00013994;
  }
  else {
LAB_00013994:
    uVar8 = uVar8 & 0xfff7;
  }
  if ((DAT_00808c1a & 1) == 0) {
    if (uMem0005344c < _DAT_00808688) {
      DAT_00808c1a = DAT_00808c1a | 1;
    }
  }
  else if (_DAT_00808688 <= uMem0005344a) {
    DAT_00808c1a = DAT_00808c1a & 0xfe;
  }
  if ((_DAT_00808846 & 0x10) != 0) {
    if ((_DAT_0080878c & 0x20) == 0) {
      if (uMem00053b64 < _DAT_0080878a) {
        _DAT_0080878c = _DAT_0080878c | 0x20;
      }
    }
    else if (_DAT_0080878a <= uMem00053b66) {
      _DAT_0080878c = _DAT_0080878c & 0xffdf;
    }
    if ((_DAT_0080878c & 0x10) == 0) {
      if (uMem00053b68 < _DAT_0080878a) {
        _DAT_0080878c = _DAT_0080878c | 0x10;
      }
    }
    else if (_DAT_0080878a <= uMem00053b6a) {
      _DAT_0080878c = _DAT_0080878c & 0xffef;
    }
    if ((_DAT_0080878c & 8) == 0) {
      if (uMem00053b6e < _DAT_0080878a) {
        _DAT_0080878c = _DAT_0080878c | 8;
      }
    }
    else if (_DAT_0080878a <= uMem00053b6c) {
      _DAT_0080878c = _DAT_0080878c & 0xfff7;
    }
  }
  if ((_DAT_00808ce0 & 1) == 0) {
    if (uMem00054122 < _DAT_00808cd2) {
      _DAT_00808ce0 = _DAT_00808ce0 | 1;
    }
  }
  else if (_DAT_00808cd2 <= uMem00054124) {
    _DAT_00808ce0 = _DAT_00808ce0 & 0xfffe;
  }
  if ((_DAT_00808846 & 0x2000) != 0) {
    if ((_DAT_00808c2c & 0x1000) == 0) {
      if ((((_DAT_0080a490 & 1) == 0) || ((_DAT_00808548 == 0 && ((_DAT_0080a450 & 2) != 0)))) ||
         ((_DAT_0080854a == 0 && ((_DAT_0080a450 & 1) != 0)))) {
        uVar8 = uVar8 & 0xffef;
        _DAT_00808644 = _DAT_00808644 & 0xffef;
      }
      else {
        uVar8 = uVar8 | 0x10;
        _DAT_00808644 = _DAT_00808644 | 0x10;
      }
      if ((((_DAT_0080a490 & 0x800) != 0) && ((_DAT_00808548 != 0 || ((_DAT_0080a450 & 2) == 0))))
         && ((_DAT_0080854a != 0 || ((_DAT_0080a450 & 1) == 0)))) {
        uStack_a = uStack_a | 0x200;
        goto LAB_00013b30;
      }
    }
    else {
      uVar8 = uVar8 & 0xffef;
      _DAT_00808644 = _DAT_00808644 & 0xffef;
    }
    uStack_a = uStack_a & 0xfdff;
  }
LAB_00013b30:
  uVar9 = uMem000532d6;
  if (_DAT_0080868c < uMem000532d8) {
    uVar9 = uMem000532d4;
  }
  uVar4 = func_0x0004e490(uVar9,4);
  if ((((((_DAT_00808870 & 0x11) != 0) || (_DAT_0080800c < uVar4)) || ((DAT_00808c1a & 1) != 0)) ||
      (((_DAT_00808846 & 0x10) != 0 &&
       (((_DAT_0080878c & 0x20) != 0 || ((_DAT_0080878c & 0x10) == 0)))))) ||
     (((_DAT_00808ce0 & 1) != 0 && (((_DAT_00808848 & 3) != 0 && ((uStack_a & 4) != 0)))))) {
    uVar8 = uVar8 & 0xffef;
  }
  if ((_DAT_00808870 & 0x11) != 0) {
    uStack_a = uStack_a & 0xfdff;
  }
  uVar2 = uVar8;
  if ((_DAT_00808846 & 0x2000) != 0) {
    uVar2 = uVar8 & 0xfffe;
    uStack_8 = uStack_8 & 0xff9f;
    if ((uVar8 & 0x10) == 0) {
      uVar7 = uVar7 & 0xffff;
      if ((((uVar7 == 2) || (uVar7 == 1)) || (uVar7 == 0)) || ((uVar7 == 3 || (uVar7 == 4)))) {
        _DAT_00808548 = sMem00054062;
        _DAT_0080a450 = _DAT_0080a450 & 0xfffd;
      }
      else {
        _DAT_0080a450 = _DAT_0080a450 | 2;
      }
    }
    else {
      uVar7 = uVar7 & 0xffff;
      if (uVar7 == 2) {
        uStack_8 = uStack_8 | 0x20;
      }
      else {
        if (((uVar7 != 1) && (uVar7 != 0)) && ((uVar7 != 3 && (uVar7 != 4)))) {
          _DAT_0080a450 = _DAT_0080a450 | 2;
          uStack_8 = uStack_8 | 0x20;
          goto LAB_00013c8c;
        }
        uVar2 = uVar2 | 1;
      }
      _DAT_00808548 = sMem00054062;
      _DAT_0080a450 = _DAT_0080a450 & 0xfffd;
    }
  }
LAB_00013c8c:
  DAT_00808b90 = DAT_00808b90 & 0x7f;
  if (((uVar2 & 0x10) == 0) || ((uint)uMem000536a0 * 0x14 <= (uint)_DAT_0080800c)) {
    uStack_6 = uVar5 & 0xfeef;
    if ((_DAT_00808846 & 0x2000) != 0) {
      uStack_8 = uStack_8 & 0xcfff;
    }
    if ((uVar2 & 0x10) != 0) {
      if ((uVar2 & 1) != 0) goto LAB_00013ccc;
      if ((_DAT_00808846 & 0x2000) != 0) {
        if ((uStack_8 & 0x40) == 0) {
          if ((uStack_8 & 0x20) != 0) {
            uStack_8 = uStack_8 | 0x1000;
          }
        }
        else {
          uStack_8 = uStack_8 | 0x2000;
        }
      }
    }
  }
  else {
LAB_00013ccc:
    uStack_6 = uStack_6 | 0x100;
  }
  if (uMem000533d2 < _DAT_00808734) {
    _DAT_008084f0 = sMem000533dc;
  }
  uVar5 = func_0x0004debc(_DAT_00808c84);
  if ((DAT_00808878 & 0x20) == 0) {
    if (uMem000536c4 < uVar5) {
      DAT_00808878 = DAT_00808878 | 0x20;
    }
  }
  else if (uVar5 <= uMem000536c6) {
    DAT_00808878 = DAT_00808878 & 0xdf;
  }
  if ((DAT_00808bae & 4) == 0) {
    if (_Speed_Limiter_3 < _DAT_008086a2) {
      DAT_00808bae = DAT_00808bae | 4;
    }
  }
  else if (_DAT_008086a2 <= uMem000533d8) {
    DAT_00808bae = DAT_00808bae & 0xfb;
  }
  if ((uVar2 & 0x11) == 0x11) {
    if (((((DAT_00808bae & 4) == 0) && (_DAT_008084f0 != 0)) && (uMem000533da <= _DAT_00808686)) &&
       ((uint)uMem000533d4 * 0x14 <= (uint)_DAT_0080800c)) {
      DAT_00808bac = DAT_00808bac & 0x7f;
    }
    else {
      uVar2 = uVar2 & 0xfffe;
      DAT_00808bac = DAT_00808bac | 0x80;
      if ((_DAT_00808846 & 0x2000) != 0) {
        uStack_8 = uStack_8 | 0x20;
      }
    }
  }
  if (((_DAT_00808846 & 0x10) == 0) && ((uVar2 & 0x10) == 0)) {
    uVar2 = uVar2 & 0xfffe;
    uStack_6 = uStack_6 & 0xfeff;
    uStack_8 = uStack_8 & 0xcfff;
  }
  if (cMem00050351 != '\0') {
    uVar2 = uVar2 & 0xefff;
  }
  if ((_DAT_00808caa & 1) != 0) {
    uVar2 = uVar2 & 0xf7ff | 0x1000;
  }
  if ((_DAT_00808cac & 0x40) != 0) {
    uVar2 = uVar2 | 0x1800;
  }
  uVar2 = uVar2 & 0xfffb;
  if (_DAT_0080883e != 0) {
    uVar2 = uVar2 | 4;
  }
  if ((_DAT_00808846 & 8) == 0) goto LAB_00013eb4;
  if (((_DAT_00809670 & 6) == 0) || ((_DAT_00809670 & 0x18) == 0)) {
    bVar1 = false;
    if ((_DAT_0080450e & 1) != 0) goto LAB_00013e70;
    uVar2 = uVar2 & 0xff7f;
  }
  else {
    bVar1 = true;
LAB_00013e70:
    uVar2 = uVar2 | 0x80;
  }
  if ((_DAT_00808846 & 0x2000) != 0) {
    if (bVar1) {
      _DAT_0080a512 = _DAT_0080a512 | 1;
    }
    else {
      _DAT_0080a512 = _DAT_0080a512 & 0xfffe;
    }
    if (((uVar2 & 0x80) == 0) || ((_DAT_0080a512 & 1) != 0)) {
      DAT_0080a4a9 = DAT_0080a4a9 & 0xef;
    }
    else {
      DAT_0080a4a9 = DAT_0080a4a9 | 0x10;
    }
  }
LAB_00013eb4:
  if ((_DAT_00808846 & 0x2000) == 0) {
    uStack_6 = uStack_6 & 0xf7ff |
               ((_DAT_0080864e ^ _DAT_00808656) & _DAT_00808652 |
               ~(_DAT_0080864e ^ _DAT_00808656) & _DAT_00808656) & 0x800;
  }
  if ((_DAT_00808846 & 0x2000) != 0) {
    if ((_DAT_0080a49a & 0x40) == 0) {
      uStack_6 = uStack_6 & 0x7fff;
    }
    else {
      uStack_6 = uStack_6 | 0x8000;
    }
  }
  if ((_DAT_00808846 & 0x2000) != 0) {
    if ((_DAT_0080a49a & 0x100) == 0) {
      uStack_8 = uStack_8 & 0xff7f;
    }
    else {
      uStack_8 = uStack_8 | 0x80;
    }
  }
  if ((_DAT_008080b8 != 0) && ((_DAT_0080a51c & 0x10) != 0)) {
    uVar2 = func_0x00018eac(uVar2);
  }
  uVar5 = _DAT_0080a51c;
  _DAT_0080a51c = _DAT_0080a51c | 0x10;
  if ((_DAT_00808baa & 0x10) == 0) {
    if (uMem000546e8 < _DAT_00808838) {
      _DAT_00808baa = _DAT_00808baa | 0x10;
    }
  }
  else if (_DAT_00808838 <= uMem000546ea) {
    _DAT_00808baa = _DAT_00808baa & 0xffef;
  }
  if ((_DAT_00808baa & 0x2000) == 0) {
    if (uMem000546ec < _DAT_00808838) {
      _DAT_00808baa = _DAT_00808baa | 0x2000;
    }
  }
  else if (_DAT_00808838 <= uMem000546ee) {
    _DAT_00808baa = _DAT_00808baa & 0xdfff;
  }
  if (((_DAT_00808848 & 2) == 0) || ((_DAT_00808baa & 1) == 0)) {
    _DAT_00808baa = _DAT_00808baa & 0xfffd;
  }
  else {
    _DAT_00808baa = _DAT_00808baa | 2;
  }
  if (((((_DAT_00808848 & 2) == 0) || ((uVar2 & 0x20) != 0)) || ((_DAT_0080a3ee & 0x20) != 0)) ||
     (((uVar2 & 4) == 0 && ((uStack_6 & 0x800) != 0)))) {
    _DAT_00808baa = _DAT_00808baa & 0xfffe;
  }
  else if ((uStack_6 & 0x800) == 0) {
    _DAT_00808baa = _DAT_00808baa | 1;
  }
  if ((((_DAT_00808baa & 1) == 0) || ((_DAT_0080a49c & 0x20) == 0)) || ((_DAT_00808c2e & 0x40) != 0)
     ) {
    _DAT_00808baa = _DAT_00808baa & 0xfeff;
  }
  else {
    _DAT_00808baa = _DAT_00808baa | 0x100;
  }
  if ((((_DAT_00808baa & 1) == 0) || ((_DAT_00808baa & 0x2000) != 0)) ||
     ((_DAT_0080a496 & 0x3800) != 0x2000)) {
    _DAT_00808baa = _DAT_00808baa & 0xefff;
  }
  else {
    _DAT_00808baa = _DAT_00808baa | 0x1000;
  }
  if ((_DAT_00808d5e & 0x80) == 0) {
    if (uMem00054b2e < _DAT_0080879e) {
      _DAT_00808892 = _DAT_00808892 | 0x20;
    }
    else if ((_DAT_00808870 & 0x11) != 0) {
      _DAT_00808892 = _DAT_00808892 & 0xffdf;
    }
    if ((((uVar5 & 2) == 0) && ((_DAT_00808870 & 0x11) == 0)) &&
       ((uMem00054b30 < _DAT_00808012 && ((_DAT_00808892 & 0x20) != 0)))) {
      _DAT_00808892 = _DAT_00808892 | 0x40;
      uVar2 = uVar2 & 0xffbf;
    }
    else {
      _DAT_00808892 = _DAT_00808892 & 0xffbf;
    }
  }
  uVar9 = (undefined2)uVar2;
  if ((((_DAT_00808848 & 2) == 0) && ((uVar2 & 0x20) != 0)) ||
     (((_DAT_00808848 & 2) != 0 && ((_DAT_00808baa & 1) == 0)))) {
    func_0x00000310();
    DAT_0080a30a = DAT_0080a30a | 0x20;
  }
  else {
    func_0x00000310();
    DAT_0080a30a = DAT_0080a30a & 0xdf;
  }
  func_0x00000328();
  _DAT_00808646 = uVar9;
  _DAT_00808652 = uStack_6;
  _DAT_0080865e = uStack_8;
  _DAT_00808664 = uStack_a | 0x10;
  return;
}


