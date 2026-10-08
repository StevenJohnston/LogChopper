/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: idle_subsystem_dispatcher_0x2e8c4
 * Address:  0x2E8C4
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void idle_subsystem_dispatcher_0x2e8c4(void)

{
  undefined2 uVar1;
  short sVar4;
  ushort uVar5;
  int iVar2;
  undefined4 uVar3;
  ushort uVar7;
  short *psVar6;
  uint uVar8;
  uint uVar9;
  uint uVar10;
  
  uVar10 = 0xffff;
  func_0x00000310();
  func_0x0000c700();
  uVar5 = _DAT_00809798;
  if ((_DAT_00808e0e & 1) != 0) {
    uVar5 = _DAT_00808e06;
  }
  if ((DAT_0080886c & 0x10) == 0) {
    _DAT_00808a9c = 0;
    _DAT_00808a9a = 0;
    DAT_0080886c = DAT_0080886c | 0x10;
  }
  else {
    _DAT_00808a9a = *(short *)((uint)uVar5 * 2 + 0x8554);
    _DAT_00808a9c = *(undefined2 *)((uint)uVar5 * 2 + 0x8556);
  }
  _DAT_00808aee = _DAT_00808aee << 1;
  sVar4 = func_0x0000b74c();
  if (sVar4 != 0) {
    _DAT_00808aee = _DAT_00808aee | 1;
  }
  _DAT_00808a88 = _DAT_00808df8;
  uVar9 = (uint)_DAT_00808df8;
  uVar7 = (_DAT_00808ae8 & 5) << 1;
  uVar5 = uVar7 | 0x35;
  if ((_DAT_00808a32 & 0x80) != 0) {
    uVar5 = uVar7 | 0x75;
  }
  if (uMem000531d2 <= uVar9) {
    uVar7 = 0xffdf;
    if (0x1080 < uVar9) {
      uVar7 = 0xffdb;
    }
    uVar5 = uVar5 & uVar7;
    if (0x1305 < uVar9) {
      uVar5 = uVar5 & 0xffef;
    }
    uVar8 = 25000;
    if ((_DAT_00808ae8 & 1) != 0) {
      uVar8 = 30000;
    }
    if (uVar8 <= uVar9) {
      uVar5 = uVar5 & 0xfffe;
    }
  }
  DAT_00808aeb = DAT_00808aeb & 0xfe;
  if (_DAT_008080ea == 0) {
    _DAT_00808ae8 = 0;
    func_0x0002f668(0);
    _DAT_00809962 = 2;
    _DAT_00808a90 = _DAT_0080995e + 0x27;
    _DAT_00808a92 = _DAT_00808a90;
    func_0x000376fc(_DAT_00808a90);
    _DAT_00808a5e = func_0x0004e500(0x27);
    goto LAB_0002eb50;
  }
  if ((DAT_0080995c & 0x40) == 0) {
    if (uMem00053d94 < _DAT_0080879e) {
      DAT_0080995c = DAT_0080995c | 0x40;
    }
  }
  else if (_DAT_0080879e <= uMem00053d96) {
    DAT_0080995c = DAT_0080995c & 0xbf;
  }
  if (_DAT_00809968 != 0) {
    _DAT_00809968 = _DAT_00809968 + -1;
  }
  _DAT_00808ae8 = uVar5;
  if (((_DAT_00808646 & 0x40) == 0) || ((DAT_0080995c & 0x40) != 0)) {
    if ((uVar5 & 1) == 0) {
      _DAT_00809962 = 1;
      sVar4 = func_0x0002f620();
      if (sVar4 != 0) {
        _DAT_00809968 = 2;
      }
    }
    else {
      if ((uVar9 < 0x186b) || (sVar4 = func_0x0002f620(), sVar4 == 0)) {
        if (_DAT_00809968 == 0) {
          _DAT_00809962 = 8;
          goto LAB_0002eb30;
        }
      }
      else {
        _DAT_00809968 = 2;
      }
      _DAT_00809962 = 4;
    }
LAB_0002eb30:
    func_0x0002f6a8();
  }
  else {
    _DAT_00809962 = 2;
    _DAT_00808a90 = _DAT_0080995e + 0x27;
    _DAT_00808a92 = _DAT_00808a90;
    func_0x000376fc(_DAT_00808a90);
    _DAT_00808a5e = func_0x0004e500(0x27);
    sVar4 = _DAT_00809a12 + 1;
    if (_DAT_00809a12 == -1) {
      sVar4 = _DAT_00809a12;
    }
    _DAT_00809a12 = sVar4;
    sVar4 = func_0x0002f620();
    if (sVar4 != 0) {
      _DAT_00809968 = 2;
    }
  }
  _DAT_00808a8e = func_0x0002fa00(uVar9,_DAT_00808a8c);
  _DAT_00809966 = func_0x0002fab0(_DAT_00808a8e);
LAB_0002eb50:
  _DAT_00808a8c = _DAT_00808a88;
  _DAT_00808a98 = _DAT_00808a88 >> 7;
  func_0x00036a20();
  func_0x000378e4();
  func_0x00000328();
  if (((((_DAT_00808a32 & 1) == 0) || ((_DAT_00808aee & 0xf) == 0)) || ((DAT_00808aef & 0xf) == 0xf)
      ) || ((_DAT_00808e0e & 1) == 0)) {
    if (_DAT_00808af2 != 0) {
      _DAT_00808af2 = sMem0005326a;
    }
    if (_DAT_00808af4 != 0) {
      _DAT_00808af4 = sMem0005326a;
    }
    if (_DAT_00808af6 != 0) {
      _DAT_00808af6 = sMem0005326a;
    }
  }
  else {
    if (_DAT_00808a9a == 1) {
      psVar6 = (short *)&DAT_00808af4;
    }
    else {
      psVar6 = (short *)&DAT_00808af2;
    }
    if (((DAT_00808aef & 3) == 2) || ((DAT_00808aef & 3) == 1)) {
      *psVar6 = sMem0005326a;
    }
    else if (*psVar6 != 0) {
      *psVar6 = *psVar6 + -1;
    }
    uVar9 = uVar10;
    if (_DAT_00808af2 == 0) {
      uVar9 = ~(uint)uMem00009646 & uVar10;
    }
    if (_DAT_00808af4 == 0) {
      uVar9 = uVar9 & ~(uint)uMem00009648;
    }
    if (_DAT_00808af6 == 0) {
      uVar9 = uVar9 & ~(uint)uMem0000964a;
    }
    _DAT_00808afe = (undefined2)uVar9;
    if ((uVar9 & 0xf) == 0xf) {
      DAT_00808a37 = DAT_00808a37 & 0xfe;
    }
    else {
      DAT_00808a37 = DAT_00808a37 | 1;
    }
  }
  _DAT_00808de8 = _DAT_00808de6;
  _DAT_00808de6 = _DAT_00808de4;
  _DAT_00808de4 = _DAT_00808de2;
  _DAT_00808de2 = _DAT_00808a88;
  iVar2 = func_0x0004dfc0(0x1d4c000,_DAT_00808a88);
  if ((_DAT_008088d6 & 1) == 0) {
    _DAT_008087a6 = func_0x0004e01c(_DAT_008087a6,iVar2,_DAT_008087ae);
    _DAT_008087aa = func_0x0004e01c(_DAT_008087aa,iVar2,uMem0005327e);
    _DAT_008087ac = func_0x0004e01c(_DAT_008087ac,iVar2,uMem00053b70);
  }
  else {
    _DAT_008087a6 = (undefined2)iVar2;
    _DAT_008087aa = _DAT_008087a6;
    _DAT_008087ac = _DAT_008087a6;
  }
  if ((_DAT_00808a32 & 0x4000) == 0) {
    uVar5 = _DAT_00808b44;
    if (_DAT_00808b44 <= uMem00054b1e) {
      uVar5 = uMem00054b1e;
    }
    _DAT_008087a8 = uVar5 << 5;
  }
  else {
    if ((_DAT_00808a32 & 0x2000) != 0) {
      iVar2 = (uint)_DAT_00808b44 << 5;
    }
    uVar1 = uMem00054b24;
    if ((_DAT_00808646 & 4) != 0) {
      uVar1 = uMem00054b26;
    }
    _DAT_008087a8 = func_0x0004e01c(_DAT_008087a8,iVar2,uVar1);
  }
  if (_DAT_00808a62 != 0) {
    _DAT_00808a62 = _DAT_00808a62 + -1;
  }
  if (_DAT_00808a62 == 0) {
    _DAT_00808a60 = 0;
  }
  _DAT_00808a70 = func_0x0004e500(_DAT_00808a70,uMem000534b2);
  if (_DAT_00808a6a != 0) {
    _DAT_00808a6a = _DAT_00808a6a + -1;
  }
  if (_DAT_00808a6c != 0) {
    _DAT_00808a6c = _DAT_00808a6c + -1;
  }
  if ((_DAT_00808a6a == 0) && (_DAT_00808a6c == 0)) {
    if (_DAT_00808a68 < 0x80) {
      _DAT_00808a68 = _DAT_00808a68 + sMem000532cc;
    }
    _DAT_00808a6c = sMem000532c4;
  }
  _DAT_0080898a = _DAT_00808988;
  _DAT_00808988 = 0x3c0;
  sVar4 = _DAT_0080895c + 1;
  if (_DAT_0080895c == -1) {
    sVar4 = _DAT_0080895c;
  }
  _DAT_0080895c = sVar4;
  sVar4 = _DAT_00809540 + 1;
  if (_DAT_00809540 == -1) {
    sVar4 = _DAT_00809540;
  }
  _DAT_00809540 = sVar4;
  sVar4 = _DAT_00809542 + 1;
  if (_DAT_00809542 == -1) {
    sVar4 = _DAT_00809542;
  }
  _DAT_00809542 = sVar4;
  if (_DAT_0080aa26 != 0) {
    _DAT_0080aa26 = _DAT_0080aa26 + -1;
  }
  if ((_DAT_008088d6 & 0x800) != 0) {
    if ((_DAT_0080887e & 0x40) == 0) {
      if ((DAT_008047d8 & 1) == 0) {
        iVar2 = (uint)_DAT_008088e2 << 2;
      }
      else if ((cMem0005035d == '\x01') || (cMem0005035d == '\x04')) {
        iVar2 = (uint)_DAT_008088e2 << 1;
      }
      else {
        iVar2 = func_0x0004df48((uint)_DAT_008088e2 << 7,uMem00053c2c);
      }
      uVar3 = func_0x0004db80(_RAM_STFT,iVar2);
    }
    else {
      if ((DAT_008047d8 & 1) == 0) {
        iVar2 = (uint)_DAT_008088e0 << 2;
      }
      else if (cMem0005035d == '\x01') {
        iVar2 = (uint)_DAT_008088e0 << 1;
      }
      else {
        iVar2 = func_0x0004df48((uint)_DAT_008088e0 << 7,uMem00053c2c);
      }
      uVar3 = func_0x0004e500(_RAM_STFT,iVar2);
    }
    _RAM_STFT = func_0x0004dc38(uVar3,_DAT_008088f4,_DAT_008088f8);
  }
  if ((DAT_0080886c & 8) == 0) {
    func_0x00031118();
  }
  if (((_DAT_00808870 & 1) != 0) && ((DAT_0080886c & 8) == 0)) {
    func_0x0002fdc4(0);
  }
  func_0x00037240();
  _DAT_00808c8a = (_DAT_00808df8 >> 3) + _DAT_00808c8a;
  if (_DAT_00808c8e != 0) {
    _DAT_00808c8e = _DAT_00808c8e + -1;
  }
  if (_DAT_00808c8e == 0) {
    _DAT_00808c80 = func_0x0000d928();
    uVar9 = func_0x0004dcf4(_DAT_00808c80,0x800,_DAT_00808c8a);
    if (0xfe < (uVar9 & 0xffff)) {
      uVar9 = 0xff;
    }
    _DAT_00808c82 = (undefined2)uVar9;
    if ((_DAT_008088d6 & 1) == 0) {
      _DAT_00808c84 = func_0x0004e01c(_DAT_00808c84,uVar9 << 8,_DAT_00808c88);
      _DAT_00808c86 = func_0x0004ded4();
    }
    else {
      _DAT_00808c84 = (undefined2)(uVar9 << 8);
      _DAT_00808c86 = _DAT_00808c82;
    }
    _DAT_00808c8a = 0;
    _DAT_00808c8e = _DAT_00808c8c;
  }
  if (_DAT_00808c78 < 0xff) {
    uVar10 = func_0x0004e4a4(_DAT_00808c78,_DAT_00808df8);
    uVar10 = func_0x0004dfc0(uVar10 >> 1,40000);
  }
  if ((uVar10 & 0xffff) == 0) {
    _DAT_00808c90 = 1;
  }
  else {
    _DAT_00808c90 = (undefined2)uVar10;
  }
  DAT_0080863b = DAT_0080863b | 1;
  func_0x0000c038();
  func_0x000a78a4();
  func_0x0003190c(0x8df8,_DAT_00808df8);
  func_0x000320ec(0x8df8);
  func_0x00031d18(_DAT_00808df8);
  func_0x00032b74();
  DAT_0080a285 = DAT_0080a285 | 2;
  uVar10 = _DAT_00809f48 + 1 & 0xffff;
  if (uVar10 == 0) {
    uVar10 = 0xffffffff;
  }
  func_0x0000ae38(&DAT_00809f48,uVar10);
  return;
}


