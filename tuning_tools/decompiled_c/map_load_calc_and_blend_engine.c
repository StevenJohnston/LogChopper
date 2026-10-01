/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: map_load_calc_and_blend_engine
 * Address:  0x2FDC4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void map_load_calc_and_blend_engine(short param_1,uint param_2)

{
  undefined2 uVar1;
  ushort uVar8;
  undefined4 uVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  undefined4 uVar5;
  ushort uVar9;
  int iVar6;
  short sVar10;
  int iVar7;
  uint uVar11;
  uint uVar12;
  byte bVar13;
  ushort uStack_e;
  ushort uStack_6;
  
  uVar8 = _DAT_008088d6;
  _DAT_008088d6 = _DAT_008088d6 & 0xefff;
  if ((_DAT_0080a816 & 8) == 0) {
    if (uMem0080504c < _DAT_00808de2) {
LAB_0002fe24:
      _DAT_008088d6 = _DAT_008088d6 | 0x400;
    }
    else {
LAB_0002fe0c:
      _DAT_008088d6 = uVar8 & 0xebff;
    }
  }
  else if ((uVar8 & 0x400) == 0) {
    if (uMem0080504e < _DAT_00808de2) goto LAB_0002fe24;
  }
  else if (_DAT_00808de2 <= uMem0080504c) goto LAB_0002fe0c;
  if (param_1 == 1) {
    if ((((_DAT_008088da & 0x80) == 0) || ((_DAT_008088d6 & 1) == 0)) ||
       ((_DAT_00808958 == 0 && ((_DAT_00808e0e & 2) != 0)))) {
      uVar11 = 2;
    }
    else {
      uVar11 = 0;
    }
    uVar12 = (uint)_DAT_008088ca;
    goto LAB_00030cd8;
  }
  if ((((_DAT_00808854 & 8) == 0) || (uVar8 = uMem00053c38, (_DAT_00808854 & 0x2000) == 0)) &&
     (uVar8 = 0, (_DAT_008088d6 & 0x400) == 0)) {
    _DAT_008088d6 = _DAT_008088d6 | 0x1000;
  }
  if ((_DAT_00808de2 < uVar8) || ((_DAT_008088d6 & 0x1000) != 0)) {
    _DAT_008088d6 = _DAT_008088d6 | 0x20;
  }
  else {
    _DAT_008088d6 = _DAT_008088d6 & 0xffdf;
  }
  if (_DAT_00808fd0 != 0) {
    _DAT_00808fd0 = _DAT_00808fd0 + -1;
  }
  if ((_DAT_0080887c & 0x40) == 0) {
    _DAT_00808fd0 = func_0x0004db80(uMem00053cac,1);
  }
  _DAT_00808fd2 = func_0x0004dfc0(_DAT_00808fc4,_DAT_00808fc8);
  _DAT_00808fc8 = 0;
  _DAT_00808fc4 = 0;
  if (((_DAT_008088d6 & 0x11) == 0) && (_DAT_00808fd0 != 0)) {
    _DAT_0080a60c = _DAT_00808fd4;
    uVar2 = func_0x0004db80(_DAT_0080a5fa,0x380);
    _DAT_00808fd4 = func_0x0004dcf4(_DAT_00808fd2,uVar2,0x400);
    _DAT_0080a60e = _DAT_00808fd4;
    _DAT_00808fd4 = func_0x0004dcf4(_DAT_0080a600,_DAT_00808fd4,0x1000);
  }
  else {
    _DAT_00808fd4 = _DAT_00808fee;
  }
  _DAT_00808fd8 = _DAT_00808fd6;
  if ((_DAT_008088d6 & 0x11) != 0) {
    _DAT_00808fd8 = _DAT_00808fd4;
  }
  _DAT_00808fd6 = func_0x0004e01c(_DAT_00808fd8,_DAT_00808fd4,_DAT_008087f8);
  func_0x0004de7c(_DAT_00808fd4,uMem00053cb0);
  _DAT_00808fdc = func_0x0004dd1c(_DAT_00808dfc,0x200);
  if (((_DAT_0080a8f4 & 2) == 0) && (_DAT_0080a8fa != 0)) {
    _DAT_0080a8fa = _DAT_0080a8fa + -1;
  }
  if ((_DAT_0080a8f4 & 1) == 0) {
    _DAT_0080a8f6 = 0;
    _DAT_0080a8f8 = sMem000546de;
  }
  else {
    if (_DAT_0080a8f8 != 0) {
      _DAT_0080a8f8 = _DAT_0080a8f8 + -1;
    }
    if (_DAT_0080a8f8 == 0) {
      uVar8 = func_0x0004db80(_DAT_0080a8f6,(uint)uMem000546e0 << 1);
      if (uVar8 < 0x100) {
        _DAT_0080a8f6 = func_0x0004db80(_DAT_0080a8f6,(uint)uMem000546e0 << 1);
      }
      else {
        _DAT_0080a8f6 = 0x100;
      }
    }
  }
  _DAT_00808fe4 = _DAT_00808fe0;
  if ((_DAT_008088d6 & 0x11) == 0) {
    uVar11 = func_0x0004e050(_DAT_00808fe0,_DAT_00808fdc,_DAT_008087f8);
  }
  else {
    uVar11 = (uint)_DAT_0080a818;
    _DAT_00808fe4 = uVar11;
  }
  if (((_DAT_0080952c & 1) == 0) || ((_DAT_00809530 & 1) == 0)) {
    _DAT_0080a902 = func_0x0004e500(_DAT_0080a902,(uint)uMem0005494e << 1);
  }
  else {
    _DAT_0080a902 = func_0x0004db80(_DAT_0080a902,(uint)uMem0005494e << 1);
    if (0xff < _DAT_0080a902) {
      _DAT_0080a902 = 0x100;
    }
  }
  uVar2 = func_0x0004e0d4(_DAT_0080a900,_DAT_0080a8fe,_DAT_008095b8);
  uVar2 = func_0x0004e01c(_DAT_0080a8fc,uVar2,_DAT_0080a902);
  _DAT_00808816 = (ushort)uVar2;
  uVar3 = func_0x0004de60(_DAT_0080a904);
  uVar4 = func_0x0004db80(0x100,uMem0005494c);
  uVar5 = func_0x0004db80(0x100,uMem00054a7e);
  uVar4 = func_0x0004e01c(uVar4,uVar5,_DAT_0080a8f6);
  func_0x0004de10(uVar2,uVar4);
  _RAM_MAPCalcs_Load = func_0x0004ddbc(_DAT_0080a906);
  _RAM_IMAPCalcs_Load = func_0x0004e01c(uVar3,_DAT_00808810,_DAT_0080a8f6);
  if (((_DAT_00808854 & 0x2000) == 0) && ((_DAT_00808d5e & 0x80) == 0)) {
    uVar11 = func_0x0004dc64(uVar11,_RAM_IMAPCalcs_Load,_RAM_MAPCalcs_Load);
  }
  _DAT_00808fe0 = uVar11;
  if ((_DAT_008088d6 & 0x11) == 0) {
    uVar11 = _DAT_00808fe4;
    uVar12 = _DAT_00808fdc;
    if (_DAT_00808fe4 < _DAT_00808fdc) {
      uVar11 = _DAT_00808fdc;
      uVar12 = _DAT_00808fe4;
    }
    func_0x0004e518(uVar11,uVar12);
    uVar2 = func_0x0004de7c(uMem00054ad2);
    uVar11 = _DAT_00808fe4;
    uVar12 = _DAT_00808fe0;
    if (_DAT_00808fe4 < _DAT_00808fe0) {
      uVar11 = _DAT_00808fe0;
      uVar12 = _DAT_00808fe4;
    }
    func_0x0004e518(uVar11,uVar12);
    uVar3 = func_0x0004de7c(uMem00054ad4);
    if (_DAT_00808fe4 < _DAT_00808fdc) {
      uVar2 = func_0x0004dba0(_DAT_0080aab4,uVar2);
    }
    else {
      uVar2 = func_0x0004e518(_DAT_0080aab4,uVar2);
    }
    if (_DAT_00808fe4 < _DAT_00808fe0) {
      _DAT_0080aab4 = func_0x0004e518(uVar2,uVar3);
    }
    else {
      _DAT_0080aab4 = func_0x0004dba0(uVar2,uVar3);
    }
    if (_DAT_0080aab4 < _DAT_0080aab8) {
      _DAT_0080aab4 = _DAT_0080aab8;
    }
  }
  else {
    _DAT_0080aab4 = (uint)uMem00054ace;
  }
  _DAT_00808806 = _DAT_008087fc;
  if (((_DAT_008088d6 & 0x11) == 0) && ((_DAT_00808854 & 8) != 0)) {
    uVar8 = 0x4000;
    if ((_DAT_00808854 & 0x2000) == 0) {
      uVar8 = _DAT_00808816;
    }
  }
  else {
    uVar8 = func_0x0004dc28(_DAT_00808fe0);
  }
  _DAT_008087fc = uVar8;
  if (uVar8 < _DAT_00808806) {
    uVar2 = func_0x0004e500(_DAT_00808806,uVar8);
    uVar9 = func_0x0004df9c(uMem00053cc4);
    if (_DAT_00808822 < uVar9) {
      _DAT_00808822 = func_0x0004df9c(uVar2,uMem00053cc4);
    }
  }
  else {
    uVar2 = func_0x0004e500(uVar8,_DAT_00808806);
    uVar9 = func_0x0004df9c(uMem00053cc4);
    if (_DAT_0080881e < uVar9) {
      _DAT_0080881e = func_0x0004df9c(uVar2,uMem00053cc4);
    }
  }
  _DAT_00808818 = func_0x0004df9c(uVar8,uMem00053cc4);
  uVar11 = func_0x0004df9c(_DAT_008087fc,uMem00053cc4);
  uVar9 = func_0x0004df9c(_DAT_00808806,uMem00053cc4);
  if (((uVar11 & 0xffff) < (uint)uMem00053cb2) && ((_DAT_0080a8f4 & 1) == 0)) {
    uVar1 = uMem000530ea;
    if ((_DAT_008089d6 & 0x80) != 0) {
      uVar1 = uMem000530e8;
    }
    func_0x0004dc84(uVar2,uVar1,uMem000530ec);
    uVar2 = func_0x0004df9c(uMem00053cc4);
    if ((uVar11 & 0xffff) < (uint)uVar9) {
      _DAT_00808824 = func_0x0004e500(uVar11,uVar2);
    }
    else {
      _DAT_00808824 = func_0x0004db80(uVar11 & 0xffff,uVar2);
    }
    if (uMem00053cb2 <= _DAT_00808824) {
      _DAT_00808824 = uMem00053cb2;
    }
  }
  else {
    _DAT_00808824 = (ushort)uVar11;
  }
  if ((DAT_00808888 & 0x10) != 0) {
    _DAT_0080a808 = func_0x0004dba0(_DAT_0080a808,_DAT_008087fc);
  }
  _DAT_00808804 = uVar8;
  uVar11 = func_0x0004db80(_DAT_008087e4,_DAT_008087e6);
  uVar11 = uVar11 & 0xffff;
  if (uVar11 != 0) {
    iVar6 = func_0x0004db94(_DAT_008087e8,_DAT_008087ea);
    _DAT_008087de = func_0x0004df68(iVar6 << 6,uVar11);
    _DAT_008087da = _DAT_008087de >> 6;
  }
  _DAT_008087e6 = _DAT_008087e4;
  _DAT_008087e4 = 0;
  _DAT_008087ea = _DAT_008087e8;
  _DAT_008087e8 = 0;
  uVar11 = 1;
  uVar8 = _DAT_00808990;
  if ((_DAT_00808990 == 0) ||
     (uVar8 = func_0x0004de10(_DAT_00808990,_DAT_008089a2),
     (uint)uMem000536b6 < (uint)_DAT_00808990 - (uint)uVar8)) {
LAB_000304c0:
    _DAT_00808990 = uVar8;
    if ((uVar11 & 0xff) != 0) {
      if (uMem000530fa < _DAT_00808686) {
        _DAT_008089b4 = sMem000530fc;
      }
      else if (uMem00053100 < _DAT_00808686) {
        _DAT_008089b4 = sMem000530fe;
      }
      else {
        _DAT_008089b4 = sMem00053102;
      }
    }
  }
  else if (_DAT_008089b4 == 0) {
    uVar8 = func_0x0004e500(_DAT_00808990,1);
    goto LAB_000304c0;
  }
  if (_DAT_008089b4 != 0) {
    _DAT_008089b4 = _DAT_008089b4 + -1;
  }
  if (_DAT_008089b8 != 0) {
    _DAT_008089b8 = _DAT_008089b8 + -1;
  }
  if (_DAT_008087fc < _DAT_00808994) {
    _DAT_008089b8 = _Load_Accel_IPW_Enrichment_Countdown;
  }
  _DAT_00808992 = 0;
  if (((_DAT_008088d6 & 0x11) == 0) && ((_DAT_00808854 & 8) == 0)) {
    sVar10 = func_0x0000b6f0();
    if (((sVar10 != 0) && ((_DAT_008088d6 & 0x28) == 0)) && ((_DAT_008088da & 0x40) == 0)) {
      if (_DAT_008087fc < _DAT_00808806) {
        if (_DAT_008087fc < _DAT_00808996) {
          func_0x0004e500(_DAT_00808806,_DAT_008087fc);
          uVar8 = func_0x0004df9c(uMem00053cc4);
          if (_DAT_008089b2 <= uVar8) {
            uVar8 = _DAT_008089b2;
          }
          uVar9 = _DAT_008089a8;
          if (_DAT_0080836e != 0) {
            uVar9 = _DAT_008089ac;
          }
          if (uVar9 < uVar8) {
            if (_DAT_00808992 <= uVar8) {
              _DAT_00808992 = uVar8;
            }
            _DAT_00808990 = 0;
          }
        }
      }
      else if (_DAT_008089b8 != 0) {
        func_0x0004e500(_DAT_008087fc,_DAT_00808806);
        uVar8 = func_0x0004df9c(uMem00053cc4);
        if (_DAT_008089b0 <= uVar8) {
          uVar8 = _DAT_008089b0;
        }
        uVar9 = _DAT_008089a6;
        if (_DAT_0080836e != 0) {
          uVar9 = _DAT_008089aa;
        }
        if (uVar9 < uVar8) {
          if (_DAT_00808990 <= uVar8) {
            _DAT_00808990 = uVar8;
          }
          _DAT_00808992 = 0;
        }
      }
      if (((((_DAT_00808846 & 8) != 0) && ((_DAT_0080450e & 1) != 0)) ||
          (((_DAT_00808846 & 8) == 0 && ((_DAT_00808668 & 0x80) != 0)))) && (_DAT_00808120 != 0)) {
        _DAT_00808990 = 0;
      }
      if (_DAT_0080811a != 0) goto LAB_000306c4;
      goto LAB_000306cc;
    }
    _DAT_00808990 = 0;
LAB_000306f0:
    _DAT_008088d2 = 0;
  }
  else {
    _DAT_00808990 = 0;
LAB_000306c4:
    _DAT_00808992 = 0;
LAB_000306cc:
    if (_DAT_00808990 == 0) goto LAB_000306f0;
    func_0x0004dca8(_DAT_0080899c,_DAT_00808990,0x400);
    _DAT_008088d2 = func_0x0004dc28();
  }
  if (_DAT_00808992 == 0) {
    _DAT_008088d4 = 0;
  }
  else {
    _DAT_008088d4 = func_0x0004dc84(_DAT_00808992,_DAT_008089a0,0x400);
  }
  if ((_DAT_00808d5e & 0x80) != 0) {
    _DAT_008088d2 = 0;
    _DAT_008088d4 = 0;
  }
  sVar10 = func_0x0000b6f0();
  if (((sVar10 == 0) || ((_DAT_008088d6 & 0x38) != 0)) || ((_DAT_00809d34 & 1) != 0)) {
    uVar12 = 0;
    if ((((_DAT_008088d6 & 0x28) == 0) && ((_DAT_00809d34 & 1) == 0)) ||
       ((uMem00054234 < _DAT_008089f0 && (uMem00054236 < _DAT_008089fe)))) {
      func_0x00031704(0);
      uVar2 = 0;
      goto LAB_00030b28;
    }
    _DAT_008089fc = 0;
    _DAT_008089fa = 0;
    _DAT_008089f8 = 0;
    _DAT_008089f6 = 0;
    _DAT_008089f4 = 0;
    _DAT_008089f2 = 0;
    _DAT_008089f0 = 0;
    _DAT_00808a0a = 0;
    _DAT_00808a08 = 0;
    _DAT_00808a06 = 0;
    _DAT_00808a04 = 0;
    _DAT_00808a02 = 0;
    _DAT_00808a00 = 0;
    _DAT_008089fe = 0;
    _DAT_00808a14 = 0;
    _DAT_00808a12 = 0;
    _DAT_00808a10 = 0;
    _DAT_00808a0c = 0;
    _DAT_00808a0e = 0;
    _DAT_00808a18 = 0;
    _DAT_00808a16 = 0;
  }
  else if (((_DAT_008088d6 & 1) == 0) && ((_DAT_008088d6 & 3) == 0)) {
    uVar11 = (uint)_DAT_00808824;
    sVar10 = func_0x0004debc(_RAM_STFT);
    _DAT_0080a752 = sVar10 * 2 + _DAT_00808906 + _DAT_008088fe;
    func_0x0004dc84(_DAT_008088e6,uVar11,0x800);
    uVar2 = func_0x0004e490(2);
    if ((_DAT_00808d5e & 0x80) == 0) {
      uVar2 = func_0x0004dd6c(**(undefined2 **)((uint)_DAT_00808e08 * 4 + 0x9664));
    }
    if ((_DAT_008088d6 & 0x80) == 0) {
      func_0x0004e4a4(uVar2,_DAT_0080a730);
      uVar3 = func_0x0004dec4();
      uVar2 = func_0x0004db80(uVar2,uVar3);
    }
    uVar8 = uMem000547f4;
    if ((_DAT_00808646 & 0x80) != 0) {
      uVar8 = uMem000547f6;
    }
    if (((_DAT_0080a9e2 & 1) != 0) && ((_DAT_0080a9e2 & 0x20) == 0)) {
      if (_DAT_0080a9c6 < _DAT_0080a9ce) {
        _DAT_0080a9e2 = _DAT_0080a9e2 | 2;
        _DAT_0080a9c2 = _DAT_0080a9ca;
      }
      else if (((_DAT_0080a9e2 & 4) == 0) ||
              ((((((_DAT_0080a9e6 & 4) != 0 && (_DAT_0080a9c6 < uVar8)) &&
                 ((cMem000503b3 != '\x01' || (_DAT_008086b8 <= uMem00054802)))) ||
                (((_DAT_0080a9e6 & 4) == 0 && (_DAT_0080a9c6 < uMem000547f8)))) &&
               ((_DAT_0080a9e2 & 8) == 0)))) {
        _DAT_0080a9e2 = _DAT_0080a9e2 | 4;
        _DAT_0080a9c2 = _DAT_0080a9d2;
      }
      else {
        _DAT_0080a9e2 = _DAT_0080a9e2 | 8;
        _DAT_0080a9c2 = func_0x0004e500(_DAT_0080a9c2,_DAT_0080a9da);
      }
      uVar11 = func_0x0004db80(_DAT_0080a9c2,0x100);
      if ((((uint)_DAT_00808952 << 1 & 0xffff) < (uVar11 & 0xffff)) &&
         ((_DAT_00808952 & 0x7fff) != 0)) {
        uVar2 = func_0x0004dc84(uVar2,uVar11 & 0xffff,(uint)_DAT_00808952 << 1);
      }
      if (_DAT_0080a9c2 == 0) {
        _DAT_0080a9e2 = _DAT_0080a9e2 & 0xffb0;
      }
    }
    func_0x0004dc84(uVar2,0x80,(uint)_DAT_00808974 * 2 + 0x80);
    func_0x0004dc84(0x100,_DAT_00808c02 + 0x80);
    _DAT_00809c88 = func_0x00031704();
    func_0x0004dd6c((uint)_DAT_00808974 * 2 + 0x80);
    func_0x0004de10(_DAT_00808c02 + 0x80);
    uVar12 = func_0x0004dc84(_DAT_0080a752,0x200);
    if (_DAT_008088d2 != 0) {
      uVar12 = func_0x0004db80(_DAT_008088d2);
    }
    if (_DAT_008088d4 != 0) {
      uVar12 = func_0x0004e500(uVar12,_DAT_008088d4);
      uVar12 = uVar12 & 0xffff;
      if (uVar12 == 0) {
        uVar12 = 1;
      }
    }
    func_0x0003116c(uVar12);
    _DAT_00808a22 = func_0x0004e500(uVar12);
    if ((_DAT_0080aa0e & 1) == 0) {
      if (uMem00053004 < _DAT_0080879e) {
        uVar2 = 0;
        goto LAB_00030b28;
      }
      uVar11 = (uint)_Minimum_IPW_SHLL0 << 5;
    }
    else {
      uVar11 = (uint)_DAT_00808a24;
    }
    uVar2 = func_0x0004e500(uVar11,_DAT_00808a22);
LAB_00030b28:
    func_0x00031860(_DAT_00808a16,uVar2);
  }
  else {
    uVar12 = (uint)_DAT_00808986;
    _DAT_008089fc = _DAT_00808986;
    _DAT_008089fa = _DAT_00808986;
    _DAT_008089f8 = _DAT_00808986;
    _DAT_008089f6 = _DAT_00808986;
    _DAT_008089f4 = _DAT_00808986;
    _DAT_008089f2 = _DAT_00808986;
    _DAT_008089f0 = _DAT_00808986;
    _DAT_00808a0a = _DAT_00808986;
    _DAT_00808a08 = _DAT_00808986;
    _DAT_00808a06 = _DAT_00808986;
    _DAT_00808a04 = _DAT_00808986;
    _DAT_00808a02 = _DAT_00808986;
    _DAT_00808a00 = _DAT_00808986;
    _DAT_008089fe = _DAT_00808986;
    _DAT_00808a14 = _DAT_00808986;
    _DAT_00808a12 = _DAT_00808986;
    _DAT_00808a10 = _DAT_00808986;
    _DAT_00808a0c = _DAT_00808986;
    _DAT_00808a0e = _DAT_00808986;
    _DAT_00808a18 = _DAT_00808986;
    _DAT_00808a16 = _DAT_00808986;
    _DAT_008085da = _DAT_0080868c;
    func_0x0004e410(0x6280e);
    _DAT_008083bc = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC612_0x5BDB8);
    _DAT_008083ba = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC612_0x57274);
    _DAT_00808978 = 4;
  }
  if ((_DAT_008088da & 0x40) == 0) {
LAB_00030b6c:
    _DAT_00808956 = 0;
  }
  else {
    if (*(char *)(_DAT_00808956 + 0x5582c) == '\0') {
      uVar12 = 0;
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
    if ((_DAT_008088d6 & 0x2000) != 0) {
      uVar11 = 2;
      if (_DAT_00808a2a != 0) {
        _DAT_00808a2a = _DAT_00808a2a + -1;
      }
      goto joined_m0x00030c04;
    }
    if ((((_DAT_008088da & 0x80) == 0) || ((_DAT_008088d6 & 1) == 0)) ||
       ((_DAT_00808958 == 0 && ((_DAT_00808e0e & 2) != 0)))) {
      if ((_DAT_008088d6 & 0x8000) == 0) {
        if (((_DAT_00808e0e & 2) == 0) && ((_DAT_00808e0e & 6) == 0)) {
          uVar11 = 2;
          uVar12 = func_0x0004df48(uVar12,4);
        }
        else {
          uVar11 = 1;
        }
      }
      else {
        uVar11 = 2;
      }
    }
    else {
      uVar11 = 0;
    }
  }
  else {
    uVar11 = 3;
    if (_DAT_00808a2a != 0) {
      _DAT_00808a2a = _DAT_00808a2a + -1;
    }
joined_m0x00030c04:
    uVar12 = (uint)_DAT_00808a2e;
    if (_DAT_00808a2a == 0) {
      uVar12 = (uint)_DAT_00808a2e;
      _DAT_008088d6 = _DAT_008088d6 & 0xdfff;
    }
  }
  if (_DAT_00808958 != 0) {
    _DAT_00808958 = _DAT_00808958 + -1;
  }
  uVar2 = func_0x0004db80(_DAT_0080aaae,0x180);
  uVar12 = func_0x0004dcf4(uVar12,uVar2,0x200);
  _DAT_008088ca = (ushort)uVar12;
  func_0x0000ae38(0x809f6c,uVar12 & 0xffff);
LAB_00030cd8:
  if (((uVar11 & 0xff) == 0) || ((uVar12 & 0xffff) == 0)) {
    _DAT_008088d0 = 0;
    if ((DAT_0080886c & 8) == 0) {
      DAT_0080886c = DAT_0080886c | 8;
    }
    func_0x00031004();
  }
  else {
    DAT_0080a9f7 = DAT_0080a9f7 | 1;
    if ((_DAT_0080aa0e & 1) == 0) {
      uStack_6 = 0;
      if (_DAT_0080879e <= uMem00053004) {
        uStack_6 = _Minimum_IPW_SHLL0 << 5;
      }
    }
    else {
      uStack_6 = _DAT_00808a24;
    }
    func_0x0003116c(uVar12 & 0xffff);
    uVar2 = func_0x0004dc38(65000,uStack_6);
    _DAT_008088cc = (undefined2)uVar2;
    _DAT_008088d0 = _DAT_008088cc;
    _RAM_Injector_Pulse_Width_IPW = func_0x0004e490(8);
    if ((cMem000503ba != '\0') && ((_DAT_0080936c == 6 || (_DAT_0080936c == 9)))) {
      _DAT_0080936c = _DAT_0080936c + 1;
    }
    _DAT_008088ce = (undefined2)uVar2;
    _DAT_0080ab82 = func_0x0004e490(uVar2,8);
    if ((uVar11 & 0xff) == 1) {
      uVar8 = *(ushort *)((uint)*(ushort *)((uint)_DAT_00808e08 * 2 + 0x855e) * 2 + 0x95fa);
      _DAT_008099fa = ~uVar8 & _DAT_008099fa;
      if ((_DAT_008088d6 & 1) != 0) {
        uVar8 = 0xf;
      }
      func_0x000312ec(uVar2,uVar8);
      if ((param_2 & 0xffff) == 0) {
        iVar6 = 0x2b;
        uStack_e = 0x19;
        uVar12 = 7;
      }
      else {
        iVar6 = 0x36;
        uStack_e = 0x24;
        uVar12 = 0x12;
      }
      _DAT_008099f8 = func_0x0004dc38(_DAT_008099f6,iVar6,0x12);
      uVar11 = (uint)*(ushort *)((uint)*(ushort *)((uint)_DAT_00808e08 * 2 + 0x855e) * 2 + 0x95fa);
      func_0x000310bc(uVar11,-((uint)_DAT_008099f8 - (iVar6 + 1)));
      if ((uint)_DAT_008099f8 <= (uint)uStack_e) {
        uVar11 = (uint)*(ushort *)((uint)*(ushort *)((uint)_DAT_00808e08 * 2 + 0x8568) * 2 + 0x95fa)
        ;
        func_0x000310bc(uVar11,-((uint)_DAT_008099f8 - (uStack_e + 1)));
      }
      if ((uint)_DAT_008099f8 <= (uVar12 & 0xffff)) {
        uVar11 = (uint)*(ushort *)((uint)*(ushort *)((uint)_DAT_00808e08 * 2 + 0x8572) * 2 + 0x95fa)
        ;
        func_0x000310bc(uVar11,-((uint)_DAT_008099f8 - (uVar12 + 1)));
      }
    }
    else {
      if ((((uVar11 & 0xff) == 3) && ((_DAT_0080888a & 0x40) == 0)) && ((DAT_0080886c & 4) == 0)) {
        DAT_0080886c = DAT_0080886c | 4;
      }
      uVar11 = 0xf;
      func_0x000311b8(uVar2,0xf);
    }
    if ((DAT_0080886c & 8) == 0) {
      DAT_0080886c = DAT_0080886c | 8;
    }
    iVar6 = 0;
    for (uVar12 = 0; bVar13 = (uVar12 & 0xffff) < 4, (bool)bVar13; uVar12 = uVar12 + 1) {
      if ((uVar11 & 0xffff & 1 << (uVar12 & 0x1f)) != 0) {
        iVar6 = iVar6 + 1;
      }
    }
    iVar7 = func_0x0004e4a4(iVar6,_DAT_008088ca);
    _DAT_008089dc = func_0x0004dba0(_DAT_008089dc,iVar7 << 1);
    iVar7 = func_0x0004e4a4(iVar6,_DAT_008088ca);
    _DAT_0080a514 = func_0x0004dba0(_DAT_0080a514,iVar7 << 1);
    uVar12 = (uint)_DAT_00808848 * 0x40000;
    uVar11 = (uint)_DAT_00808848 * 0x80000;
    if ((!CARRY4(uVar12,uVar12) && !CARRY4(uVar11,uVar11 + (bVar13 & 1))) ||
       ((_DAT_0080ab42 & 1) != 0)) {
      iVar7 = func_0x0004e4a4(iVar6,_DAT_008088ca);
      _DAT_00809198 = func_0x0004dba0(_DAT_00809198,iVar7 << 1);
    }
    if (((cMem000503b9 != '\0') && ((_DAT_00808848 & 0x2000) != 0)) && ((_DAT_0080ab42 & 2) != 0)) {
      iVar6 = func_0x0004e4a4(iVar6,_DAT_008088ca);
      _DAT_00809428 = func_0x0004dba0(_DAT_00809428,iVar6 << 1);
    }
  }
  return;
}


