/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: ipw_minimum_clamp_pipeline
 * Address:  0x30B2C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void ipw_minimum_clamp_pipeline(void)

{
  undefined4 uVar1;
  uint uVar2;
  ushort uVar4;
  int iVar3;
  uint in_R8;
  int iVar5;
  uint uVar6;
  uint in_R10;
  byte bVar7;
  ushort uStack00000016;
  uint uStack00000018;
  short sStack0000001e;
  
  if ((_DAT_008088da & 0x40) == 0) {
LAB_00030b6c:
    _DAT_00808956 = 0;
  }
  else {
    if (*(char *)(_DAT_00808956 + 0x5582c) == '\0') {
      in_R10 = 0;
    }
    if (_DAT_00808956 != 0xffff) {
      _DAT_00808956 = _DAT_00808956 + 1;
    }
    if (3 < _DAT_00808956) goto LAB_00030b6c;
  }
  if (_DAT_00808e14 != 0xffff) {
    _DAT_00808e14 = _DAT_00808e14 + 1;
  }
  if (1 < _DAT_00808e14) {
    _DAT_00808e14 = 0;
  }
  if ((_DAT_00808e0e & 2) != 0) {
    _DAT_00808e14 = 1;
  }
  if ((_DAT_008088d6 & 0x2000) == 0) {
    if ((_DAT_008088d6 & 0x2000) == 0) {
      if ((((_DAT_008088da & 0x80) == 0) || ((_DAT_008088d6 & 1) == 0)) ||
         ((_DAT_00808958 == 0 && ((_DAT_00808e0e & 2) != 0)))) {
        if ((_DAT_008088d6 & 0x8000) == 0) {
          if (((_DAT_00808e0e & 2) == 0) && ((_DAT_00808e0e & 6) == 0)) {
            uVar6 = 2;
            in_R10 = func_0x0004df48(in_R10,4);
          }
          else {
            uVar6 = 1;
          }
        }
        else {
          uVar6 = 2;
        }
      }
      else {
        uVar6 = 0;
      }
      goto LAB_00030c68;
    }
    uVar6 = 2;
    if (_DAT_00808a2a != 0) {
      _DAT_00808a2a = _DAT_00808a2a + -1;
    }
  }
  else {
    uVar6 = 3;
    if (_DAT_00808a2a != 0) {
      _DAT_00808a2a = _DAT_00808a2a + -1;
    }
  }
  in_R10 = (uint)_DAT_00808a2e;
  if (_DAT_00808a2a == 0) {
    in_R10 = (uint)_DAT_00808a2e;
    _DAT_008088d6 = _DAT_008088d6 & 0xdfff;
  }
LAB_00030c68:
  if (_DAT_00808958 != 0) {
    _DAT_00808958 = _DAT_00808958 + -1;
  }
  uVar1 = func_0x0004db80(_DAT_0080aaae,0x180);
  uVar2 = func_0x0004dcf4(in_R10,uVar1,0x200);
  _DAT_008088ca = (undefined2)uVar2;
  func_0x0000ae38(0x809f6c,uVar2 & 0xffff);
  if (((uVar6 & 0xff) == 0) || ((uVar2 & 0xffff) == 0)) {
    _DAT_008088d0 = 0;
    if ((DAT_0080886c & 8) == 0) {
      DAT_0080886c = DAT_0080886c | 8;
    }
    func_0x00031004();
  }
  else {
    DAT_0080a9f7 = DAT_0080a9f7 | 1;
    if ((_DAT_0080aa0e & 1) == 0) {
      sStack0000001e = 0;
      if (_DAT_0080879e <= uMem00053004) {
        sStack0000001e = _Minimum_IPW_SHLL0 << 5;
      }
    }
    else {
      sStack0000001e = _DAT_00808a24;
    }
    func_0x0003116c(uVar2 & 0xffff);
    uVar1 = func_0x0004dc38(65000,sStack0000001e);
    _DAT_008088cc = (undefined2)uVar1;
    _DAT_008088d0 = _DAT_008088cc;
    _RAM_Injector_Pulse_Width_IPW = func_0x0004e490(8);
    if ((cMem000503ba != '\0') && ((_DAT_0080936c == 6 || (_DAT_0080936c == 9)))) {
      _DAT_0080936c = _DAT_0080936c + 1;
    }
    _DAT_008088ce = (undefined2)uVar1;
    _DAT_0080ab82 = func_0x0004e490(uVar1,8);
    uStack00000018 = uVar6 & 0xff;
    if (uStack00000018 == 1) {
      uVar4 = *(ushort *)((uint)*(ushort *)((uint)_DAT_00808e08 * 2 + 0x855e) * 2 + 0x95fa);
      _DAT_008099fa = ~uVar4 & _DAT_008099fa;
      if ((_DAT_008088d6 & 1) != 0) {
        uVar4 = 0xf;
      }
      func_0x000312ec(uVar1,uVar4);
      if ((in_R8 & 0xffff) == 0) {
        iVar5 = 0x2b;
        uStack00000016 = 0x19;
        uVar2 = 7;
      }
      else {
        iVar5 = 0x36;
        uStack00000016 = 0x24;
        uVar2 = 0x12;
      }
      _DAT_008099f8 = func_0x0004dc38(_DAT_008099f6,iVar5,0x12);
      uVar6 = (uint)*(ushort *)((uint)*(ushort *)((uint)_DAT_00808e08 * 2 + 0x855e) * 2 + 0x95fa);
      func_0x000310bc(uVar6,-((uint)_DAT_008099f8 - (iVar5 + 1)));
      if ((uint)_DAT_008099f8 <= (uint)uStack00000016) {
        uVar6 = (uint)*(ushort *)((uint)*(ushort *)((uint)_DAT_00808e08 * 2 + 0x8568) * 2 + 0x95fa);
        func_0x000310bc(uVar6,-((uint)_DAT_008099f8 - (uStack00000016 + 1)));
      }
      if ((uint)_DAT_008099f8 <= (uVar2 & 0xffff)) {
        uVar6 = (uint)*(ushort *)((uint)*(ushort *)((uint)_DAT_00808e08 * 2 + 0x8572) * 2 + 0x95fa);
        func_0x000310bc(uVar6,-((uint)_DAT_008099f8 - (uVar2 + 1)));
      }
    }
    else {
      if (((uStack00000018 == 3) && ((_DAT_0080888a & 0x40) == 0)) && ((DAT_0080886c & 4) == 0)) {
        DAT_0080886c = DAT_0080886c | 4;
      }
      uVar6 = 0xf;
      func_0x000311b8(uVar1,0xf);
    }
    if ((DAT_0080886c & 8) == 0) {
      DAT_0080886c = DAT_0080886c | 8;
    }
    iVar5 = 0;
    for (uVar2 = 0; bVar7 = (uVar2 & 0xffff) < 4, (bool)bVar7; uVar2 = uVar2 + 1) {
      if ((uVar6 & 0xffff & 1 << (uVar2 & 0x1f)) != 0) {
        iVar5 = iVar5 + 1;
      }
    }
    iVar3 = func_0x0004e4a4(iVar5,_DAT_008088ca);
    _DAT_008089dc = func_0x0004dba0(_DAT_008089dc,iVar3 << 1);
    iVar3 = func_0x0004e4a4(iVar5,_DAT_008088ca);
    _DAT_0080a514 = func_0x0004dba0(_DAT_0080a514,iVar3 << 1);
    uVar2 = (uint)_DAT_00808848 * 0x40000;
    uVar6 = (uint)_DAT_00808848 * 0x80000;
    if ((!CARRY4(uVar2,uVar2) && !CARRY4(uVar6,uVar6 + (bVar7 & 1))) || ((_DAT_0080ab42 & 1) != 0))
    {
      iVar3 = func_0x0004e4a4(iVar5,_DAT_008088ca);
      _DAT_00809198 = func_0x0004dba0(_DAT_00809198,iVar3 << 1);
    }
    if (((cMem000503b9 != '\0') && ((_DAT_00808848 & 0x2000) != 0)) && ((_DAT_0080ab42 & 2) != 0)) {
      iVar5 = func_0x0004e4a4(iVar5,_DAT_008088ca);
      _DAT_00809428 = func_0x0004dba0(_DAT_00809428,iVar5 << 1);
    }
  }
  return;
}


