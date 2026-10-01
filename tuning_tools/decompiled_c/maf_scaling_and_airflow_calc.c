/**
 * Mitsubishi Lancer Evolution X (4B11T) ECU Decompiled Routine
 * Function: maf_scaling_and_airflow_calc
 * Address:  0x3860C
 * Description: Custom Specified Routine
 * Microcontroller: Renesas M32186F8 (M32R Architecture)
 * Generated via Ghidra Decompiler Pipeline
 */

#include <stdint.h>
#include <stdbool.h>


/* WARNING: Removing unreachable block (mem,0x0003be40) */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void maf_scaling_and_airflow_calc(void)

{
  bool bVar1;
  short sVar2;
  undefined2 uVar3;
  uint uVar4;
  uint uVar5;
  ushort *puVar6;
  undefined4 uVar7;
  ushort uVar10;
  undefined4 uVar8;
  undefined2 uVar11;
  short sVar12;
  ushort uVar13;
  ushort uVar14;
  undefined *puVar9;
  undefined2 uVar15;
  undefined2 uVar16;
  int iVar17;
  ushort uVar18;
  uint uVar19;
  uint uVar20;
  int iVar21;
  short sVar22;
  ushort uVar23;
  byte in_PSW;
  byte bVar24;
  bool bVar25;
  ushort uStack_1c;
  undefined2 uStack_a;
  
  func_0x00000310();
  _DAT_00808fae = _DAT_00808fae + 1;
  if (_DAT_00808988 != 0) {
    _DAT_00808988 = _DAT_00808988 + -1;
  }
  _DAT_0080866c = _DAT_0080866a;
  _DAT_0080866a = _DAT_00808668;
  _DAT_00809608 = _DAT_00809606;
  _DAT_00808670 = _DAT_0080866e;
  func_0x0000b5a4();
  uVar4 = (uint)((_DAT_0080866a ^ _DAT_00808668) & _DAT_00808668);
  uVar5 = uVar4 * 0x200000;
  uVar4 = uVar4 * 0x400000;
  if (CARRY4(uVar5,uVar5) || CARRY4(uVar4,uVar4 + (in_PSW & 1))) {
    DAT_0080919f = DAT_0080919f | 1;
  }
  bVar24 = (byte)_DAT_0080866e;
  if ((((byte)_DAT_00808670 ^ bVar24) & bVar24 & 1) != 0) {
    DAT_0080919f = DAT_0080919f | 4;
  }
  if ((((byte)_DAT_00808670 ^ bVar24) & bVar24 & 2) != 0) {
    DAT_0080919f = DAT_0080919f | 8;
  }
  if ((_DAT_00808d5e & 0x80) == 0) {
    if (((_DAT_00809630 & 0x20) != 0) || ((_DAT_008080b8 == 0 && (_DAT_008080ca < 0x28))))
    goto LAB_000386f0;
LAB_000386f8:
    _DAT_00808638 = _DAT_00808638 | 0x1000;
  }
  else {
    if ((_DAT_00808646 & 0x40) == 0) goto LAB_000386f8;
LAB_000386f0:
    _DAT_00808638 = _DAT_00808638 & 0xefff;
  }
  func_0x00000328();
  if (_DAT_0080aef0 == 0) {
    func_0x000100c8();
  }
  func_0x0003cda0();
  if ((_DAT_00808846 & 0x4000) != 0) {
    func_0x00087e9c();
  }
  func_0x00000310();
  if (_DAT_00808c90 == 0) {
    _DAT_0080863a = _DAT_0080863a & 0xfffe;
  }
  else {
    _DAT_0080863a = _DAT_0080863a | 1;
  }
  func_0x0000c038();
  if (_DAT_00808c90 != 0) {
    _DAT_00808c90 = _DAT_00808c90 + -1;
  }
  func_0x00000328();
  func_0x0000b9dc();
  puVar6 = (ushort *)((_DAT_00808fca & 0xfffffffe) + _DAT_00805054);
  uVar19 = (uint)puVar6[1];
  uVar4 = _RAM_MAF_Voltage_ADC & 7;
  uVar5 = uVar19;
  uVar20 = (uint)*puVar6;
  if (uVar19 < *puVar6) {
    uVar5 = (uint)*puVar6;
    uVar4 = -(uVar4 - 8);
    uVar20 = uVar19;
  }
  uVar20 = (((uVar5 - uVar20) * uVar4 + 4 & 0xffff) >> 3) + uVar20;
  _DAT_00808fc0 = (undefined2)uVar20;
  if ((_DAT_00808646 & 0x40) == 0) {
    uVar18 = func_0x0004e500(uVar20 & 0xffff,_DAT_00808fc2);
    if (_DAT_00804d92 <= uVar18) {
      _DAT_00804d92 = uVar18;
    }
    uVar18 = func_0x0004e500(_DAT_00808fc2,_DAT_00808fc0);
    if (_DAT_00804d94 <= uVar18) {
      _DAT_00804d94 = uVar18;
    }
  }
  else {
    _DAT_00804d92 = 0;
    _DAT_00804d94 = 0;
  }
  _DAT_00808fc2 = _DAT_00808fc0;
  uVar5 = (uint)_DAT_00808fbe;
  uVar4 = func_0x0004db80(uVar5,uMem00054a7a);
  uVar5 = func_0x0004e500(uVar5,uMem00054a7c);
  if ((uVar20 & 0xffff) < (uVar5 & 0xffff)) {
    uVar20 = uVar5;
  }
  if ((uVar4 & 0xffff) <= (uVar20 & 0xffff)) {
    uVar20 = uVar4;
  }
  _DAT_00808fbe = (ushort)uVar20;
  uVar20 = uVar20 & 0xffff;
  if (_DAT_00808fc8 != -1) {
    func_0x00000310();
    sVar22 = _DAT_00808fc8 + 1;
    if (_DAT_00808fc8 == -1) {
      sVar22 = _DAT_00808fc8;
    }
    _DAT_00808fc8 = sVar22;
    _DAT_00808fc4 = func_0x0004dba0(_DAT_00808fc4,uVar20);
    func_0x00000328();
  }
  func_0x00094f04();
  func_0x00000310();
  if (_DAT_008080b8 == 0) {
    _DAT_00808fa6 = 0;
    _DAT_00808fa4 = 0;
    _DAT_00808fa2 = 0;
    _DAT_00808fac = 0;
    _DAT_00808faa = 0;
    _DAT_00808fa8 = 0;
    uMem00808f9e = uMem00808f9e & 0xe38f;
    uMem00808fa0 = uMem00808fa0 & 0xe38f;
  }
  func_0x00000328();
  if ((_DAT_00808846 & 0x2000) == 0) {
    uVar18 = _DAT_008098b0 & 8;
    uVar4 = _DAT_008098b0 & 8;
    _DAT_008098b0 = _DAT_008098b0 & 0xfff7;
    if (_DAT_00809a94 != 0) {
      _DAT_00809a94 = _DAT_00809a94 + -1;
    }
    if (_DAT_0080a6c8 != 0) {
      _DAT_0080a6c8 = _DAT_0080a6c8 + -1;
    }
    if (((((byte)_DAT_0080866a ^ (byte)_DAT_00808668) & (byte)_DAT_0080866a & 2) != 0) ||
       (uVar18 != 0)) {
      _DAT_00809a94 = sMem000544f4;
      _DAT_0080883e = uMem000531b6;
      _DAT_0080a6c8 = func_0x0004dcf4(uMem000544f2,4,0x271);
    }
    if (_DAT_008080b8 == 0) {
      _DAT_008098b0 = _DAT_008098b0 & 0xfffb;
    }
    else if (((((byte)_DAT_0080866a ^ (byte)_DAT_00808668) & (byte)_DAT_0080866a & 2) != 0) ||
            ((uVar4 & 0xffff) != 0)) {
      _DAT_008098b0 = _DAT_008098b0 | 4;
    }
    if (_DAT_00809a94 == 0) {
      _DAT_008098c0 = 0xffffffff;
      _DAT_008098bc = 0xffffffff;
      _DAT_008098b8 = 0xffffffff;
      _DAT_008098b4 = 0xffffffff;
      _DAT_008098b0 = _DAT_008098b0 & 0xffec;
    }
    else {
      _DAT_008098b0 = _DAT_008098b0 | 0x10;
    }
    if (((cMem00050013 == '\x01') && (sMem00050014 != 0)) || ((_DAT_008098b0 & 0x10) != 0)) {
      _DAT_0080883e = uMem000531b6;
    }
    else {
      _DAT_0080883e = 0;
    }
    uVar7 = func_0x0004dba0(_DAT_008098c0,_DAT_008098bc);
    uVar7 = func_0x0004dba0(_DAT_008098b8,uVar7);
    func_0x0004dba0(_DAT_008098b4,uVar7);
    uVar4 = func_0x0004dff4(8);
    if (_DAT_0080a6c8 == 0) {
      uVar4 = (uint)uMem000544f2;
    }
    else if (uMem000544f2 <= uVar4) {
      uVar4 = (uint)uMem000544f2;
    }
    uVar7 = func_0x0004dc28(uVar4);
    _DAT_0080a6c6 = (undefined2)uVar7;
    if ((_DAT_008098b0 & 0x10) == 0) {
      _DAT_008098a0 = 0;
    }
    else {
      func_0x0004e4a4(0x1c2,_DAT_00804f64);
      func_0x0004dd1c(uMem000544ee,uMem000544f0);
      _DAT_008098a0 = func_0x0004dfc0(uVar7);
    }
    if (((_DAT_00808846 & 0x4000) != 0) && ((_DAT_00808848 & 3) == 0)) {
      if (_DAT_0080a3c4 != 0) {
        _DAT_0080a3c4 = _DAT_0080a3c4 + -1;
      }
      if (_DAT_0080a3c4 == 0) {
        if (_DAT_0080a3c8 < uMem000544f0) {
          _DAT_008098e2 = 0;
          _DAT_0080a3c6 = 0;
          _DAT_0080a3cc = 0;
        }
        else {
          func_0x0004df68(_DAT_0080a3d0,_DAT_0080a3c8);
          uVar7 = func_0x0004df9c(2);
          func_0x0004e4a4(0x1c2,_DAT_00804f64);
          func_0x0004dd1c(uMem000544ee,uMem000544f0);
          func_0x0004dff4(uVar7);
          _DAT_008098e2 = func_0x0004dfc0(4);
        }
        _DAT_0080a3c8 = 0;
        _DAT_0080a3d0 = 0;
        _DAT_0080a3c4 = 0xd0;
      }
    }
  }
  func_0x0003e338();
  if (_DAT_00808d5c != -1) {
    _DAT_00808d5c = _DAT_00808d5c + 1;
  }
  func_0x00076204();
  sVar22 = _TMS1CT;
  if ((_DAT_00808fae & 1) == 0) {
    func_0x0007c97c();
    DAT_00809d2d = DAT_00809d2d | 4;
    if (_DAT_00808840 != 0) {
      _DAT_00808840 = _DAT_00808840 + -1;
    }
    bVar24 = (_DAT_00808846 & 0x2000) != 0;
    if ((bool)bVar24) {
      uVar18 = 0;
      if ((_DAT_00808c2c & 0x4000) == 0) {
        uVar4 = (uint)_DAT_0080a4ea;
        if (uVar4 == 0xffff) {
          uVar18 = 0x20;
        }
        _DAT_00809c8a = _DAT_00809c8c;
        if (_DAT_00809c8c == 0x3fff) {
          _DAT_00809c8a = 0;
        }
        _DAT_00809c90 = _DAT_00809c92;
        if (_DAT_00809c92 == 0x3fff) {
          _DAT_00809c90 = 0;
        }
        _DAT_0080a7ee = _DAT_0080a7f0;
        if (_DAT_0080a7f0 == -1) {
          _DAT_0080a7ee = 0;
        }
        if (uVar4 == 0xffff) {
          uVar4 = 0;
        }
        _DAT_00809c22 = (ushort)(uVar4 >> 5);
        _DAT_0080a89c = (ushort)uVar4;
        _DAT_0080a4e8 = _DAT_0080a89c;
        if (0xfffd < uVar4) {
          _DAT_0080a4e8 = 0xfffe;
        }
        if (uVar4 < uMem000546fa) {
          _DAT_0080a89c = 0;
        }
        bVar24 = (_DAT_00808846 & 0x4000) != 0;
        sVar12 = _DAT_00809c8a;
        sVar2 = _DAT_00809c90;
        if ((bool)bVar24) {
          if (_DAT_0080a6ae != 0) {
            _DAT_0080a6ae = _DAT_0080a6ae + -1;
          }
          _DAT_00809c8e = _DAT_00809c8a;
          _DAT_00809c96 = _DAT_00809c90;
          _DAT_0080a6b4 = func_0x0004dba0(uVar4,_DAT_0080a6b4);
          sVar12 = _DAT_0080a6b8 + 1;
          if (_DAT_0080a6b8 == -1) {
            sVar12 = _DAT_0080a6b8;
          }
          _DAT_0080a6b8 = sVar12;
          sVar12 = _DAT_00809c8e;
          sVar2 = _DAT_00809c96;
          if (_DAT_0080a6ae == 0) {
            _DAT_0080a6bc = func_0x0004dfc0(_DAT_0080a6b4,_DAT_0080a6b8);
            _DAT_008098e2 = func_0x0004df9c(_DAT_0080a6bc,4);
            _DAT_0080a6b4 = 0;
            _DAT_0080a6ae = 0x68;
            _DAT_0080a6b8 = 0;
            sVar12 = _DAT_00809c8e;
            sVar2 = _DAT_00809c96;
          }
        }
      }
      else {
        _DAT_00809c8a = 0;
        _DAT_00809c90 = 0;
        _DAT_0080a7ee = 0;
        _DAT_00809c8e = 0;
        _DAT_00809c96 = 0;
        _DAT_00809c22 = 0;
        _DAT_0080a4e8 = 0xffff;
        uVar18 = 0x20;
        _DAT_0080a89c = 0;
        bVar24 = (_DAT_00808846 & 0x4000) != 0;
        sVar12 = 0;
        sVar2 = 0;
        if ((bool)bVar24) {
          _DAT_008098e2 = 0;
          _DAT_0080a6ae = 0x68;
          _DAT_0080a6b8 = 0;
          _DAT_0080a6b4 = 0;
          sVar12 = _DAT_00809c8e;
          sVar2 = _DAT_00809c96;
        }
      }
      _DAT_00809c96 = sVar2;
      _DAT_00809c8e = sVar12;
      if (((cMem00050013 == '\x01') && (sMem00050014 != 0)) ||
         (bVar24 = _DAT_00809c22 < uMem00054254, !(bool)bVar24)) {
        _DAT_0080883e = uMem000531b6;
      }
      else {
        _DAT_0080883e = 0;
      }
      if (_DAT_00808840 == 0) {
        _DAT_00808840 = 0x11b;
        _DAT_0080883c = _DAT_0080883a;
        if (cMem00050013 == '\x01') {
          _DAT_0080883a = sMem00050014;
        }
        else {
          _DAT_0080883a = func_0x0004dc14(_DAT_00809c22 >> 3);
        }
        DAT_0080886a = DAT_0080886a | 1;
        _DAT_008098a2 = _DAT_008098a2 + _DAT_0080883a;
        uVar5 = (uint)_DAT_00809010 * 0x400000;
        uVar4 = (uint)_DAT_00809010 * 0x800000;
        if (CARRY4(uVar5,uVar5) || CARRY4(uVar4,uVar4 + (bVar24 & 1))) {
          _DAT_00804d68 = func_0x0004db80(_DAT_00804d68,_DAT_0080883a);
          if (_DAT_00804d6a != 0) {
            _DAT_00804d6a = _DAT_00804d6a + -1;
          }
          if (_DAT_00804d6a == 0) {
            _DAT_0080a7b6 = func_0x0004df9c(_DAT_00804d68,sMem000545b8);
            _DAT_00804d68 = 0;
            _DAT_00804d64 = func_0x0004db80(_DAT_00804d64,_DAT_0080a7b6);
            if (uMem000545ba <= _DAT_00804d64) {
              _DAT_00804d64 = func_0x0004e500(_DAT_00804d64,uMem000545ba);
              sVar12 = _DAT_00804d66 + 1;
              if (_DAT_00804d66 == -1) {
                sVar12 = _DAT_00804d66;
              }
              _DAT_00804d66 = sVar12;
              uVar7 = func_0x0004df48(_DAT_00804d66,4);
              _DAT_00804d6c = func_0x0004dc14(_DAT_00804d66);
              _DAT_00804d6e = func_0x0004dc14(uVar7);
            }
            _DAT_00804d6a = sMem000545b8;
          }
        }
        _DAT_00804a06 = func_0x0004db80(_DAT_00804a06,_DAT_0080883a);
        if (_DAT_00804a08 != 0) {
          _DAT_00804a08 = _DAT_00804a08 + -1;
        }
        if (_DAT_00804a08 == 0) {
          _DAT_0080a7a6 = func_0x0004df9c(_DAT_00804a06,sMem000545b8);
          _DAT_00804a06 = 0;
          _DAT_00804a02 = func_0x0004db80(_DAT_00804a02,_DAT_0080a7a6);
          sVar12 = _DAT_00804a04;
          if (uMem000545ba <= _DAT_00804a02) {
            _DAT_00804a02 = func_0x0004e500(_DAT_00804a02,uMem000545ba);
            sVar12 = _DAT_00804a04 + 1;
            if (_DAT_00804a04 == -1) {
              sVar12 = _DAT_00804a04;
            }
          }
          _DAT_00804a04 = sVar12;
          _DAT_00804a08 = sMem000545b8;
        }
      }
      _DAT_0080a3ee = _DAT_0080a3ee & 0xffdf | uVar18 & 0x20;
    }
    else {
      if (_DAT_00808840 == 0) {
        _DAT_00808840 = 0x11b;
        _DAT_0080883c = _DAT_0080883a;
        if (cMem00050013 == '\x01') {
          _DAT_0080883a = sMem00050014;
        }
        else {
          _DAT_0080883a = func_0x0004df9c(_DAT_008098a0,0x100);
        }
        DAT_0080886a = DAT_0080886a | 1;
        uVar5 = (uint)_DAT_00809010 * 0x400000;
        uVar4 = (uint)_DAT_00809010 * 0x800000;
        if (CARRY4(uVar5,uVar5) || CARRY4(uVar4,uVar4 + (bVar24 & 1))) {
          _DAT_00804d68 = func_0x0004db80(_DAT_00804d68,_DAT_0080883a);
          if (_DAT_00804d6a != 0) {
            _DAT_00804d6a = _DAT_00804d6a + -1;
          }
          if (_DAT_00804d6a == 0) {
            _DAT_0080a7b6 = func_0x0004df9c(_DAT_00804d68,sMem000545b8);
            _DAT_00804d68 = 0;
            _DAT_00804d64 = func_0x0004db80(_DAT_00804d64,_DAT_0080a7b6);
            if (uMem000545ba <= _DAT_00804d64) {
              _DAT_00804d64 = func_0x0004e500(_DAT_00804d64,uMem000545ba);
              sVar12 = _DAT_00804d66 + 1;
              if (_DAT_00804d66 == -1) {
                sVar12 = _DAT_00804d66;
              }
              _DAT_00804d66 = sVar12;
              uVar7 = func_0x0004df48(_DAT_00804d66,4);
              _DAT_00804d6c = func_0x0004dc14(_DAT_00804d66);
              _DAT_00804d6e = func_0x0004dc14(uVar7);
            }
            _DAT_00804d6a = sMem000545b8;
          }
        }
        _DAT_00804a06 = func_0x0004db80(_DAT_00804a06,_DAT_0080883a);
        if (_DAT_00804a08 != 0) {
          _DAT_00804a08 = _DAT_00804a08 + -1;
        }
        if (_DAT_00804a08 == 0) {
          _DAT_0080a7a6 = func_0x0004df9c(_DAT_00804a06,sMem000545b8);
          _DAT_00804a06 = 0;
          _DAT_00804a02 = func_0x0004db80(_DAT_00804a02,_DAT_0080a7a6);
          sVar12 = _DAT_00804a04;
          if (uMem000545ba <= _DAT_00804a02) {
            _DAT_00804a02 = func_0x0004e500(_DAT_00804a02,uMem000545ba);
            sVar12 = _DAT_00804a04 + 1;
            if (_DAT_00804a04 == -1) {
              sVar12 = _DAT_00804a04;
            }
          }
          _DAT_00804a04 = sVar12;
          _DAT_00804a08 = sMem000545b8;
        }
      }
      if ((_DAT_00808846 & 0x2000) != 0) {
        if (_DAT_008098a0 < 0xfffe) {
          _DAT_0080a4e8 = _DAT_008098a0;
        }
        else {
          _DAT_0080a4e8 = 0xfffe;
        }
      }
      if (_DAT_008098a0 < uMem000546fa) {
        _DAT_0080a89c = 0;
      }
      else {
        _DAT_0080a89c = _DAT_008098a0;
      }
    }
    if (_DAT_00808d58 != -1) {
      _DAT_00808d58 = _DAT_00808d58 + 1;
    }
    if (_DAT_00808d5a != -1) {
      _DAT_00808d5a = _DAT_00808d5a + 1;
    }
    if (_DAT_00808d62 != 0) {
      _DAT_00808d62 = _DAT_00808d62 + -1;
    }
    if (((_DAT_00804ae0 & 2) == 0) && ((_DAT_00808844 & 8) == 0)) {
      func_0x0007d454();
    }
    else {
      func_0x0007d41c();
    }
    if ((_DAT_00808844 & 8) != 0) {
      func_0x0007cd44();
    }
    func_0x00040328();
    uVar23 = _DAT_008096ac;
    uVar18 = _DAT_00809688;
    uStack_1c = _DAT_00808668 & 0x80;
    if ((_DAT_00808846 & 0x8000) != 0) {
      uStack_1c = _DAT_0080450e & 1;
    }
    iVar21 = 0xe66;
    uVar4 = (uint)_DAT_0080969c << 2;
    if ((((_DAT_00809630 & 0x200) != 0) && ((_DAT_00809630 & 0x10) == 0)) &&
       ((_DAT_00808652 & 0x800) != 0)) {
      iVar21 = (uint)uMem00053cf2 << 1;
    }
    if (((_DAT_008098d0 & 0x80) == 0) && ((_DAT_0080450e & 1) != 0)) {
      uVar4 = 0;
    }
    _DAT_008096aa = (undefined2)uVar4;
    if ((_DAT_0080aa28 & 1) != 0) {
      if (_DAT_008096b0 != 0) {
        _DAT_008096b0 = _DAT_008096b0 + -1;
      }
      if (_DAT_008096b0 == 0) {
        if (((_DAT_0080aa28 & 2) == 0) && ((_DAT_0080aa28 & 4) == 0)) {
          uVar10 = func_0x0004efe0(0x600fc,_DAT_00808796);
          if (_DAT_008096ae < uVar10) {
            sVar12 = sMem00054928;
            if ((_DAT_00808646 & 0x80) != 0) {
              sVar12 = sMem0005492c;
            }
          }
          else {
            sVar12 = sMem00054926;
            if ((_DAT_00808646 & 0x80) != 0) {
              sVar12 = sMem0005492a;
            }
          }
        }
        else {
          uVar10 = func_0x0004efe0(0x6011c,_DAT_00808796);
          if (_DAT_008096ae < uVar10) {
            sVar12 = sMem00054930;
            if ((_DAT_00808646 & 0x80) != 0) {
              sVar12 = sMem00054934;
            }
          }
          else {
            sVar12 = sMem0005492e;
            if ((_DAT_00808646 & 0x80) != 0) {
              sVar12 = sMem00054932;
            }
          }
        }
        if (sVar12 == 0) {
          sVar12 = 1;
        }
        _DAT_008096ae = func_0x0004e500(_DAT_008096ae,sVar12);
        uVar10 = uMem00054942;
        if (_DAT_00808092 != 0) {
          uVar10 = uMem00054940;
        }
        if (uVar10 < _DAT_008096ae) {
          _DAT_008096ae = 0;
        }
        _DAT_008096b0 = func_0x0004e490(uMem00054944,2);
      }
      uVar5 = (uint)_DAT_008096ae << 2;
      if ((uint)uVar23 < (_DAT_008096ae & 0x3fff) << 2) {
        uVar5 = (uint)uVar23;
      }
      if ((uVar4 & 0xffff) < (uVar5 & 0xffff)) {
        uVar4 = uVar5;
      }
    }
    _DAT_008096ac = (ushort)uVar4;
    func_0x00073b64();
    _DAT_008096a2 = func_0x0004db80(uVar4,uVar18);
    _DAT_008096b6 = _DAT_008096a2;
    if ((cMem00050385 != '\0') && ((_DAT_00808848 & 1) != 0)) {
      _DAT_0080a5a4 = _DAT_0080a5a2;
      _DAT_0080a560 = _DAT_0080a55e;
      _DAT_0080a562 = func_0x0003d7bc();
    }
    _DAT_00809a9e = _DAT_008096c0;
    if (_DAT_0080a6da <= _DAT_008096c0) {
      _DAT_00809a9e = _DAT_0080a6da;
    }
    if ((((((_DAT_008045d2 & 0x40) != 0) || ((_DAT_00809670 & 0x1a6) != 0)) ||
         ((_DAT_00809670 & 0x38) != 0)) ||
        (((DAT_00808ce8 & 0x20) != 0 || ((_DAT_00809660 & 0x1c) != 0)))) ||
       (((_DAT_00808cc8 & 1) != 0 || (((_DAT_00808cc6 & 1) != 0 || ((_DAT_0080965e & 1) != 0)))))) {
      uVar18 = _DAT_0080864e;
      if ((_DAT_00808846 & 0x2000) != 0) {
        uVar18 = _DAT_00808652;
      }
      if ((uVar18 & 0x800) == 0) {
        if ((_DAT_00809670 & 0x20) == 0) {
          uVar4 = (uint)uMem00053cf2;
        }
        else {
          uVar4 = (uint)uMem00053eea;
        }
      }
      else {
        uVar4 = (uint)uMem00053ee8;
      }
      iVar21 = uVar4 << 1;
    }
    func_0x0004db80(_DAT_00809a9e,0x198);
    func_0x000aa560();
    uVar7 = func_0x0004dc38(iVar21,0x198);
    _DAT_0080a3f6 = (undefined2)uVar7;
    func_0x0000ae38(&DAT_00809648,uVar7);
    uVar4 = (uint)uMem00053d54;
    uVar5 = (uint)uMem00053d56;
    uVar7 = func_0x0004dc38(_DAT_00804510,uVar4,uVar5);
    _DAT_0080a3fa = (undefined2)uVar7;
    func_0x0000ae38(&DAT_00804510,uVar7);
    uVar7 = func_0x0004dc38(_DAT_00804518,uVar4,uVar5);
    _DAT_0080a3fc = (undefined2)uVar7;
    func_0x0000ae38(&DAT_00804518,uVar7);
    uVar4 = (uint)uMem00053d58;
    uVar5 = (uint)uMem00053d5a;
    uVar7 = func_0x0004dc38(_DAT_00804514,uVar4,uVar5);
    _DAT_0080a3fe = (undefined2)uVar7;
    func_0x0000ae38(&DAT_00804514,uVar7);
    uVar7 = func_0x0004dc38(_DAT_0080451c,uVar4,uVar5);
    _DAT_0080a400 = (undefined2)uVar7;
    func_0x0000ae38(&DAT_0080451c,uVar7);
    _DAT_00804a8c = func_0x0004dc38(_DAT_00804a8c,uMem00053f14,uMem00053f0e);
    uVar18 = _DAT_00804514;
    uVar23 = _DAT_00804510;
    if ((_DAT_00809660 & 8) != 0) {
      uVar18 = _DAT_0080451c;
      uVar23 = _DAT_00804518;
    }
    iVar21 = (uint)uVar18 << 2;
    iVar17 = (uint)uVar23 << 2;
    uVar18 = sMem00065f3a << 2;
    uVar4 = (uint)uMem00053d3e;
    uVar7 = func_0x0004e500(iVar21);
    uVar5 = func_0x0004dcf4(_DAT_00809648 - 0x198,uVar7,uVar4);
    uVar4 = func_0x0004e500(iVar21,(uint)uVar18 + iVar17);
    if ((uVar5 & 0xffff) < (uVar4 & 0xffff)) {
      uVar4 = uVar5;
    }
    uVar4 = uVar4 + iVar17;
    if (0xffe < (uVar4 & 0xffff)) {
      uVar4 = 0xfff;
    }
    uVar5 = (uint)uMem00053d3a;
    if ((_DAT_00809aba & 0x80) == 0) {
      if ((_DAT_00808646 & 0x20) == 0) {
        uVar20 = (uint)uMem000540be;
      }
      else {
        uVar20 = (uint)uMem000540bc;
      }
    }
    else if ((_DAT_00808646 & 0x20) == 0) {
      uVar20 = (uint)uMem000540ba;
    }
    else {
      uVar20 = (uint)uMem000540b8;
    }
    _DAT_00809c4e = _DAT_00809a0e;
    uVar19 = uVar20;
    uVar7 = func_0x0004e4a4(_DAT_00809a0e,uMem00053d3c);
    uVar8 = func_0x0004e500(_DAT_00808746,_DAT_0080450c);
    func_0x0004ddd4(uVar7,uVar8);
    uVar5 = func_0x0004df68(uVar5);
    if (((_DAT_0080aa28 & 1) != 0) && ((uVar5 & 0xffff) < (uint)uMem00053ef2)) {
      uVar5 = (uint)uMem00053ef2;
    }
    uVar5 = func_0x0004db80(uVar5,uVar19);
    _DAT_0080a68c = (undefined2)uVar5;
    uVar19 = uVar5 << 2;
    if ((_DAT_008096e0 & 0xe000) == 0xc000) {
      if ((uint)_DAT_008096c4 <= (uVar19 & 0xffff)) goto LAB_00039738;
LAB_0003972c:
      _DAT_0080a690 = _DAT_008096c4;
    }
    else {
      if (((_DAT_008096e0 & 0xe000) == 0xa000) && ((uint)_DAT_008096c4 <= (uVar19 & 0xffff)))
      goto LAB_0003972c;
LAB_00039738:
      _DAT_0080a690 = (ushort)uVar19;
    }
    if ((_DAT_00808848 & 1) == 0) {
      if ((_DAT_00808848 & 2) != 0) {
        if ((_DAT_008096ea & 0x8080) == 0x8080) {
          _DAT_0080a692 = _DAT_008096d0;
          goto LAB_000397cc;
        }
        if (((_DAT_008096ea & 0x8000) != 0) && ((_DAT_008096ea & 0x800) != 0))
        goto joined_m0x000397a2;
        if (((_DAT_008096ea & 0x8000) != 0) && ((_DAT_008096ee & 0x80) != 0)) goto LAB_000397b8;
      }
LAB_000397c4:
      _DAT_0080a692 = _DAT_0080a690;
    }
    else {
      if ((_DAT_008096ea & 0xa000) != 0xa000) goto LAB_000397c4;
joined_m0x000397a2:
      if (_DAT_0080a690 < _DAT_008096ca) goto LAB_000397c4;
LAB_000397b8:
      _DAT_0080a692 = _DAT_008096ca;
    }
LAB_000397cc:
    if (((_DAT_00808890 & 0x10) != 0) && ((uVar5 & 0xffff) < (uint)uMem00053ef4)) {
      uVar5 = (uint)uMem00053ef4;
    }
    if (((DAT_008088da & 2) != 0) && ((uVar5 & 0xffff) < (uint)uMem00053ef6)) {
      uVar5 = (uint)uMem00053ef6;
    }
    uVar5 = func_0x0004e490(uVar5,4);
    if ((uVar5 & 0xffff) < (uint)_DAT_0080a692) {
      uVar5 = (uint)_DAT_0080a692;
    }
    _DAT_0080a68e = (undefined2)uVar5;
    func_0x0004db80((uint)_DAT_00804510 << 2,uVar5);
    _DAT_00808ce2 = func_0x0004dc38((uint)_DAT_00804514 << 2,(uint)_DAT_00804510 << 2);
    if ((((((_DAT_00808646 & 2) == 0) || ((_DAT_00809660 & 0x10) != 0)) ||
         ((_DAT_00809670 & 0x1e7) != 0)) || ((_DAT_00809670 & 0x18) != 0)) ||
       ((((_DAT_008098d0 & 0x80) != 0 && (((DAT_0080ad5a & 4) == 0 || ((DAT_0080ad5a & 8) == 0))))
        || (uMem00053ef0 <= _DAT_00809602)))) {
      _DAT_00809aba = _DAT_00809aba & 0xffbf;
    }
    else {
      _DAT_00809aba = _DAT_00809aba | 0x40;
      if ((uint)_DAT_00808ce2 <= (uVar4 & 0xffff)) {
        uVar4 = (uint)_DAT_00808ce2;
      }
    }
    if ((((_DAT_00808646 & 2) != 0) && ((_DAT_00809670 & 0x1e7) == 0)) &&
       (((_DAT_00809660 & 0x10) == 0 &&
        ((((_DAT_008098d0 & 0x80) != 0 && ((_DAT_00809872 & 2) == 0)) &&
         (_DAT_00809776 < uMem00054076)))))) {
      iVar21 = func_0x0004e500(_DAT_00809776,uMem00053d20);
      func_0x0004db80((uint)_DAT_00804510 << 2,(iVar21 + uVar20) * 4);
      uVar5 = func_0x0004dc38((uint)_DAT_00804514 << 2,(uint)_DAT_00804510 << 2);
      if ((uVar5 & 0xffff) <= (uVar4 & 0xffff)) {
        uVar4 = uVar5 & 0xffff;
      }
    }
    if (_DAT_00809766 < _DAT_00809768) {
      uVar5 = (uint)_DAT_00809768 - (uint)_DAT_00809766;
    }
    else {
      uVar5 = (uint)_DAT_00809766 - (uint)_DAT_00809768;
    }
    if ((((uStack_1c == 0) || ((uMem000549da < _DAT_00809766 && (uMem000549dc < _DAT_00809768)))) ||
        ((_DAT_00809766 <= uMem000549de ||
         ((uMem000549e0 <= _DAT_00809766 || (_DAT_00809768 <= uMem000549e2)))))) ||
       ((uMem000549e4 <= _DAT_00809768 ||
        (((((_DAT_00809660 & 0x1c) != 0 || ((_DAT_00809630 & 1) == 0)) || ((_DAT_0080965e & 1) != 0)
          ) || ((uint)_DAT_00809762 != (uVar4 & 0xffff))))))) {
      _DAT_0080a694 = 0;
      _DAT_0080a696 = 0;
      uVar20 = func_0x0004db80(_DAT_0080a698,uMem000549d4);
      if ((uVar5 & 0xffff) <= (uVar20 & 0xffff)) goto LAB_00039b08;
    }
    else {
      uVar18 = _DAT_0080a694 + 1;
      if (_DAT_0080a694 == 0xffff) {
        uVar18 = _DAT_0080a694;
      }
      _DAT_0080a694 = uVar18;
      if (_DAT_0080a694 == uMem000549d8) {
        _DAT_0080a698 = (undefined2)uVar5;
      }
      if (uMem000549d8 < _DAT_0080a694) {
        uVar20 = func_0x0004db80(_DAT_0080a698,uMem000549d6);
        if ((uVar20 & 0xffff) < (uVar5 & 0xffff)) {
          uVar18 = _DAT_0080a696 + 1;
          if (_DAT_0080a696 == 0xffff) {
            uVar18 = _DAT_0080a696;
          }
          _DAT_0080a696 = uVar18;
          if (uMem000549e6 < _DAT_0080a696) {
            _DAT_00808cc6 = _DAT_00808cc6 | 0x80;
            uVar7 = 2;
          }
          else {
            if (_DAT_0080a696 == 0) goto LAB_00039b0c;
            uVar7 = 0;
          }
          func_0x0009ea4c(0x20,8,uVar7);
        }
        else {
          _DAT_0080a696 = 0;
LAB_00039b08:
          _DAT_00808cc6 = _DAT_00808cc6 & 0xff7f;
        }
      }
      else {
        _DAT_0080a696 = 0;
        uVar20 = func_0x0004db80(_DAT_0080a698,uMem000549d4);
        if ((uVar5 & 0xffff) <= (uVar20 & 0xffff)) goto LAB_00039b08;
      }
    }
LAB_00039b0c:
    if ((_DAT_00808cc6 & 0x80) == 0) {
      _DAT_0080a69a = 0;
      sVar12 = _DAT_0080a69a;
    }
    else {
      sVar12 = _DAT_0080a69a + 1;
      if (_DAT_0080a69a == -1) {
        sVar12 = _DAT_0080a69a;
      }
    }
    _DAT_0080a69a = sVar12;
    _DAT_00809762 = (ushort)uVar4;
    uVar5 = (uVar4 & 0xffff) >> 8 & 0xf;
    if ((uVar4 & 1) != 0) {
      uVar5 = uVar5 | 0x80;
    }
    func_0x0000ae38(&DAT_00809634,uVar5);
    func_0x0000ae38(&DAT_00809638,(uVar4 & 0xffff) >> 1 & 0xff | 0x80);
    if (cMem00050361 != '\0') {
      if ((_DAT_00808668 & 0x80) == 0) {
        _DAT_0080a3f8 = _DAT_00809634 & 0xffdf;
      }
      else {
        _DAT_0080a3f8 = _DAT_00809634 | 0x20;
      }
      func_0x0000ae38(&DAT_00809634,_DAT_0080a3f8);
    }
    if (cMem00050361 == '\0') {
      _DAT_00809650 = _DAT_00808686;
    }
    else if ((((_DAT_0080450e & 0x20) == 0) || ((_DAT_00809660 & 0x10) != 0)) ||
            (((_DAT_00809630 & 0x80) != 0 || ((_DAT_00809670 & 0x1ff) != 0)))) {
      _DAT_00809650 = 0;
      _DAT_00809652 = _DAT_00809652 & 0xfffb;
      _DAT_00809652 = _DAT_00809652 | 2;
      _DAT_00809678 = 3;
    }
    else {
      if ((_DAT_00809678 & 3) == 0) {
        _DAT_00809650 = _DAT_00804a92 >> 2;
      }
      else {
        _DAT_00809650 = **(ushort **)((_DAT_00809678 & 3) * 4 + 0x8628);
      }
      _DAT_00809652 = _DAT_00809652 & 0xfff9 | (ushort)((_DAT_00809678 & 3) << 1);
    }
    if ((_DAT_00808d5e & 0x80) == 0) {
      _DAT_00809652 = _DAT_00809652 & 0xff7f;
    }
    else {
      _DAT_00809652 = _DAT_00809652 | 0x80;
      _DAT_00809650 = 0xf8;
    }
    if ((_DAT_00809756 & 0x20) == 0) {
      _DAT_00809652 = _DAT_00809652 & 0xffdf;
    }
    else {
      _DAT_00809652 = _DAT_00809652 | 0x20;
    }
    if ((_DAT_00809aba & 0x40) == 0) {
      DAT_00808cdf = DAT_00808cdf & 0x7f | 0x40;
    }
    else {
      DAT_00808cdf = DAT_00808cdf | 0xc0;
    }
    if ((_DAT_00808848 & 3) == 0) {
      if ((_DAT_00808658 & 1) != 0) goto LAB_00039cc4;
LAB_00039ccc:
      DAT_00808cdf = DAT_00808cdf & 0xdf;
    }
    else {
      if ((_DAT_00808646 & 0x20) == 0) goto LAB_00039ccc;
LAB_00039cc4:
      DAT_00808cdf = DAT_00808cdf | 0x20;
    }
    func_0x0003d0b8();
    uVar18 = _DAT_00809766;
    _DAT_00809658 = (ushort)DAT_0080aeb5;
    _DAT_0080965a = (ushort)DAT_0080aeb4;
    if (_DAT_00808ce6 == DAT_0080aeb3) {
      _DAT_0080965e = (ushort)DAT_0080aeb3;
    }
    _DAT_00808ce6 = (ushort)DAT_0080aeb3;
    if ((_DAT_00809662 == DAT_0080aeb2) &&
       (_DAT_00809660 = _DAT_00809660 | DAT_0080aeb2, _DAT_00809660 == 0)) {
      _DAT_00809652 = _DAT_00809652 & 0xfffe;
    }
    _DAT_00809662 = (ushort)DAT_0080aeb2;
    _DAT_00809664 = (ushort)DAT_0080aeb1;
    if ((((DAT_0080ad57 & 0x80) == 0) && ((_DAT_0080aed8 & 0x30) == 0)) &&
       ((_DAT_0080afaa & 0x80) == 0)) {
      _DAT_00809630 = _DAT_00809630 & 0xbfff;
    }
    else {
      _DAT_00809630 = _DAT_00809630 | 0x4000;
    }
    uVar11 = func_0x0004e490(_DAT_0080976c,4);
    sVar12 = func_0x0000b6f0();
    uVar10 = uMem00053d56;
    uVar23 = uMem00053d54;
    if (((sVar12 == 0) && ((_DAT_00809660 & 4) == 0)) &&
       (((_DAT_00809630 & 1) != 0 && ((_DAT_00808cc6 & 1) == 0)))) {
      if ((_DAT_00809658 & 0x40) == 0) {
        if (((_DAT_00804a8a & 4) != 0) && ((_DAT_0080aad2 & 1) != 0)) {
          if (_DAT_00804510 < _DAT_00808cce) {
            iVar21 = (uint)_DAT_00808cce - (uint)_DAT_00804510;
          }
          else {
            iVar21 = (uint)_DAT_00804510 - (uint)_DAT_00808cce;
          }
          uVar7 = func_0x0004e490(uMem00054ba6,iVar21);
          if (_DAT_00808cce < _DAT_00804510) {
            uVar7 = func_0x0004db80(0x8000,uVar7);
          }
          else {
            uVar7 = func_0x0004e500(0x8000,uVar7);
          }
          _DAT_0080aad0 = func_0x0004dc38(uVar7,uMem00054baa,uMem00054ba8);
          _DAT_0080aad2 = _DAT_0080aad2 | 2;
        }
        _DAT_0080aad2 = _DAT_0080aad2 & 0xfffe;
        if ((_DAT_00804a8a & 1) != 0) {
          _DAT_00804a8a = _DAT_00804a8a | 4;
        }
        _DAT_00808cce = _DAT_00804510;
        _DAT_00808cd0 = _DAT_00804518;
      }
      else if (((_DAT_00804a8a & 4) == 0) || ((_DAT_00809632 & 3) == 3)) {
        if ((_DAT_00804a8a & 4) == 0) {
          uStack_a = 0x3ff;
          uVar13 = uMem00053f10;
        }
        else {
          uStack_a = uMem00053f06;
          uVar13 = uMem00053f04;
        }
        uVar5 = (uint)uVar13;
        uVar4 = func_0x0004db80(_DAT_00808cce,uVar13);
        uVar5 = func_0x0004db80(_DAT_00808cd0,uVar5);
        uVar13 = func_0x0004e500(_DAT_00808cce,uStack_a);
        uVar14 = func_0x0004e500(_DAT_00808cd0,uStack_a);
        if ((_DAT_00809660 & 8) == 0) {
          uVar20 = func_0x0004dc38(uVar18,uVar23,uVar10);
          if ((uVar4 & 0xffff) <= (uVar20 & 0xffff)) {
            uVar20 = uVar4;
          }
          if ((uVar20 & 0xffff) < (uint)uVar13) {
            uVar20 = (uint)uVar13;
          }
          func_0x0000ae38(&DAT_00804510,uVar20);
          _DAT_0080aad2 = _DAT_0080aad2 | 1;
        }
        if ((_DAT_00809660 & 0x10) == 0) {
          uVar4 = func_0x0004dc38(uVar11,uVar23,uVar10);
          if ((uVar5 & 0xffff) <= (uVar4 & 0xffff)) {
            uVar4 = uVar5;
          }
          if ((uVar4 & 0xffff) < (uint)uVar14) {
            uVar4 = (uint)uVar14;
          }
          func_0x0000ae38(&DAT_00804518,uVar4);
        }
        _DAT_00804a8a = _DAT_00804a8a | 1;
      }
      if ((_DAT_00809658 & 0x20) != 0) {
        uVar4 = (uint)uMem00053d58;
        uVar5 = (uint)uMem00053d5a;
        if ((_DAT_00809660 & 8) == 0) {
          uVar7 = func_0x0004dc38(uVar18,uVar4,uVar5);
          func_0x0000ae38(&DAT_00804514,uVar7);
        }
        if ((_DAT_00809660 & 0x10) == 0) {
          uVar7 = func_0x0004dc38(uVar11,uVar4,uVar5);
          func_0x0000ae38(&DAT_0080451c,uVar7);
        }
        _DAT_00804a8a = _DAT_00804a8a | 2;
      }
    }
    else {
      _DAT_0080aad2 = _DAT_0080aad2 & 0xfffe;
    }
    _DAT_00808cc0 = uVar18;
    _DAT_00809764 = uVar18 >> 2;
    _DAT_00808cc4 = _DAT_0080adae;
    _DAT_0080a262 = _DAT_0080adae >> 4;
    iVar21 = (uint)_DAT_00804514 << 2;
    iVar17 = (uint)_DAT_00804510 << 2;
    uVar4 = (uint)uMem00053d3e;
    uVar7 = func_0x0004e500(_DAT_0080adae,iVar17,iVar21);
    uVar8 = func_0x0004e500(iVar21,iVar17);
    _DAT_0080a288 = func_0x0004dcf4(uVar7,uVar4,uVar8);
    _DAT_0080a288 = _DAT_0080a288 + 0x1a0;
    _DAT_0080967a = func_0x0004e500(_DAT_00809764 + 0x1a,_DAT_00804510 >> 2);
    _DAT_0080967c = func_0x0004e500(_DAT_0080976c + 0x1a,_DAT_00804518 >> 2);
    _DAT_00809630 = _DAT_00809630 & 0xfe7f;
    if (_DAT_00809672 != 0) {
      _DAT_00809672 = _DAT_00809672 + -1;
    }
    if ((_DAT_0080966a < uMem00053cd4) || (sVar12 = func_0x000aa3f0(), sVar12 != 0)) {
      _DAT_00809672 = sMem00053cd6;
    }
    if (_DAT_00809672 == 0) {
      _DAT_00809670 = _DAT_00809670 | 1;
    }
    uVar4 = (uint)_DAT_0080966e;
    uVar18 = func_0x0004e500(uVar4,_DAT_0080966c);
    if (uVar18 < uMem00053cda) {
LAB_0003a140:
      _SUB_00808288 = uMem00053eb0;
    }
    else {
      if (_DAT_0080963c < _DAT_00809686) {
        uVar18 = _DAT_00809686 - _DAT_0080963c;
      }
      else {
        uVar18 = _DAT_0080963c - _DAT_00809686;
      }
      if (uMem00053ce2 <= uVar18) goto LAB_0003a140;
    }
    uVar18 = func_0x0004e500(_DAT_0080966c,uVar4);
    if (uVar18 < uMem00053cda) {
LAB_0003a19c:
      _DAT_0080826a = uMem00053cde;
    }
    else {
      if (_DAT_0080963c < _DAT_00809686) {
        uVar18 = _DAT_00809686 - _DAT_0080963c;
      }
      else {
        uVar18 = _DAT_0080963c - _DAT_00809686;
      }
      if (uMem00053ce2 <= uVar18) goto LAB_0003a19c;
    }
    if (_DAT_00808cc2 < _DAT_00808cd2) {
      uVar4 = (uint)_DAT_00808cd2 - (uint)_DAT_00808cc2;
    }
    else {
      uVar4 = (uint)_DAT_00808cc2 - (uint)_DAT_00808cd2;
    }
    if (((uVar4 & 0xffff) < (uint)uMem00053ef8 << 2) || (uMem00053f08 <= _DAT_0080963c)) {
LAB_0003a230:
      _DAT_0080827a = uMem00053cde;
    }
    else {
      if (_DAT_0080963c < _DAT_00809686) {
        uVar18 = _DAT_00809686 - _DAT_0080963c;
      }
      else {
        uVar18 = _DAT_0080963c - _DAT_00809686;
      }
      if ((uMem00053f0a <= uVar18) || (uMem00053f12 <= _DAT_0080aad6)) goto LAB_0003a230;
    }
    _DAT_00809670 = _DAT_00809670 & 0x7fff;
    if ((_DAT_00809652 & 1) != 0) {
      _DAT_00809660 = 0;
    }
    if ((_DAT_00809630 & 0x20) == 0) {
      _DAT_008082ea = sMem000540cc;
      _DAT_00809630 = _DAT_00809630 & 0xffef;
    }
    else {
      func_0x0004db80(_DAT_00804a8c,uMem00053efa);
      if (((_DAT_00808854 & 8) == 0) && ((_DAT_00809d30 & 0x10) == 0)) {
        if (uMem000540d2 < _DAT_0080882e) {
          if (_DAT_008082ea == 0) {
            _DAT_00809630 = _DAT_00809630 | 0x10;
          }
        }
        else {
          _DAT_008082ea = sMem000540cc;
        }
      }
    }
    if (((((_DAT_00809670 & 0x1df) != 0) || (_DAT_008080b8 == 0)) || ((_DAT_00808646 & 0x40) != 0))
       || ((((_DAT_00809630 & 8) == 0 || (_DAT_0080963c < uMem00053cd8)) ||
           ((uMem00053cd4 <= _DAT_0080963c ||
            ((_DAT_0080966a < uMem00053cd8 || (uMem00053cd4 <= _DAT_0080966a)))))))) {
      _DAT_0080975e = 4;
    }
    if ((_DAT_00808846 & 0x2000) == 0) {
      _DAT_00808c2c = _DAT_00808c2c & 0x3ff;
    }
    else {
      func_0x0007a2dc();
      func_0x00077be0();
      _DAT_00808c2c = _DAT_00808c2c & 0xff3f;
      uVar18 = _DAT_008096e4 & 0x400;
      if ((((_DAT_008096e2 & 0x400) == 0) || (uVar18 != 0)) &&
         (((_DAT_008096e2 & 0x400) != 0 || (uVar18 == 0)))) {
        if (_DAT_00809cfe != 0) {
          _DAT_00809cfe = _DAT_00809cfe + -1;
        }
      }
      else {
        _DAT_00809cfe = sMem000503ee;
      }
      if (uVar18 == 0) {
        _DAT_008096e2 = _DAT_008096e2 & 0xfbff;
      }
      else {
        _DAT_008096e2 = _DAT_008096e2 | 0x400;
      }
      func_0x0006de5c();
      uVar18 = _DAT_008096e4 & 0x800;
      if ((((_DAT_008096e2 & 0x800) == 0) || (uVar18 != 0)) &&
         (((_DAT_008096e2 & 0x800) != 0 || (uVar18 == 0)))) {
        if (_DAT_00809d00 != 0) {
          _DAT_00809d00 = _DAT_00809d00 + -1;
        }
      }
      else {
        _DAT_00809d00 = sMem000503f0;
      }
      if (uVar18 == 0) {
        _DAT_008096e2 = _DAT_008096e2 & 0xf7ff;
      }
      else {
        _DAT_008096e2 = _DAT_008096e2 | 0x800;
      }
      func_0x0006e4a4();
      uVar18 = _DAT_008096e4 & 0x1000;
      if ((((_DAT_008096e2 & 0x1000) == 0) || (uVar18 != 0)) &&
         (((_DAT_008096e2 & 0x1000) != 0 || (uVar18 == 0)))) {
        if (_DAT_0080a7fc != 0) {
          _DAT_0080a7fc = _DAT_0080a7fc + -1;
        }
      }
      else {
        _DAT_0080a7fc = sMem000503f2;
      }
      if (uVar18 == 0) {
        _DAT_008096e2 = _DAT_008096e2 & 0xefff;
      }
      else {
        _DAT_008096e2 = _DAT_008096e2 | 0x1000;
      }
      uVar18 = _DAT_00809cea;
      if (_DAT_00809cf4 == 0) {
        _DAT_00809cf4 = 10;
        if ((_DAT_00809cea <= uMem000503e2) && (uVar18 = _DAT_00809cea + 1, _DAT_00809cea == 0xffff)
           ) {
          uVar18 = _DAT_00809cea;
        }
      }
      else {
        _DAT_00809cf4 = _DAT_00809cf4 + -1;
      }
      _DAT_00809cea = uVar18;
      func_0x0006defc();
      uVar18 = _DAT_00809cec;
      if (_DAT_00809cf6 == 0) {
        _DAT_00809cf6 = 10;
        if ((_DAT_00809cec <= uMem000503e2) && (uVar18 = _DAT_00809cec + 1, _DAT_00809cec == 0xffff)
           ) {
          uVar18 = _DAT_00809cec;
        }
      }
      else {
        _DAT_00809cf6 = _DAT_00809cf6 + -1;
      }
      _DAT_00809cec = uVar18;
      func_0x0006ddc4();
      if ((_DAT_00808848 & 3) == 0) {
        DAT_00809d2d = DAT_00809d2d | 0x80;
        uVar18 = _DAT_00809cf2;
      }
      else {
        uVar18 = _DAT_00809cee;
        if (_DAT_00809cf8 == 0) {
          _DAT_00809cf8 = 6;
          if ((_DAT_00809cee <= uMem000503e4) &&
             (uVar18 = _DAT_00809cee + 1, _DAT_00809cee == 0xffff)) {
            uVar18 = _DAT_00809cee;
          }
        }
        else {
          _DAT_00809cf8 = _DAT_00809cf8 + -1;
        }
        _DAT_00809cee = uVar18;
        func_0x0006e40c();
        uVar18 = _DAT_00809cf0;
        if (_DAT_00809cfa == 0) {
          _DAT_00809cfa = 0x12;
          if ((_DAT_00809cf0 <= uMem000503e4) &&
             (uVar18 = _DAT_00809cf0 + 1, _DAT_00809cf0 == 0xffff)) {
            uVar18 = _DAT_00809cf0;
          }
        }
        else {
          _DAT_00809cfa = _DAT_00809cfa + -1;
        }
        _DAT_00809cf0 = uVar18;
        uVar18 = _DAT_00809cf2;
        if ((_DAT_00808848 & 2) != 0) {
          if (_DAT_00809cfc == 0) {
            _DAT_00809cfc = 6;
            if ((_DAT_00809cf2 <= uMem000503e4) &&
               (uVar18 = _DAT_00809cf2 + 1, _DAT_00809cf2 == 0xffff)) {
              uVar18 = _DAT_00809cf2;
            }
          }
          else {
            _DAT_00809cfc = _DAT_00809cfc + -1;
          }
        }
      }
      _DAT_00809cf2 = uVar18;
      func_0x000795e4();
      func_0x00079d48();
    }
    _DAT_00808626 = _TMS1CT - sVar22;
  }
  sVar22 = _TMS1CT;
  if ((_DAT_00808fae & 3) == 0) {
    _DAT_00809686 = _DAT_00808cdc;
    _DAT_00808cdc = _DAT_00808cda;
    _DAT_00808cda = _DAT_00808cd8;
    _DAT_00808cd8 = _DAT_00808cd6;
    _DAT_00808cd6 = _DAT_0080963c;
    func_0x0000bb44();
    func_0x00070f64();
    if ((_DAT_00809d26 & 8) == 0) {
      func_0x0000ae38(0x809da4,0x32);
    }
    else {
      DAT_00809d2d = DAT_00809d2d | 8;
    }
    func_0x0000ae38(0x809f2c,_DAT_00809f34);
    _DAT_0080966a = _DAT_00809644;
    _DAT_0080874c = _DAT_0080874a;
    func_0x0004e500((uint)_DAT_00808748 + (uint)_DAT_00804506,0x80);
    _DAT_0080874a = func_0x0004dc14();
    func_0x0004db80(_DAT_00809768,0x66);
    _DAT_00808cca = func_0x0004e500(_DAT_00804518);
    if (0x3fe < _DAT_00808cca) {
      _DAT_00808cca = 0x3ff;
    }
    if (_DAT_00808ce4 == 0) {
      uVar18 = (ushort)((uint)_DAT_0080966a - (uint)_DAT_0080963c);
      _DAT_00808ce4 = 4;
      if (_DAT_0080975e != 0) {
        _DAT_0080975e = _DAT_0080975e + -1;
      }
      if (_DAT_00809760 != 0) {
        _DAT_00809760 = _DAT_00809760 + -1;
      }
      if (_DAT_0080963c < _DAT_00809686) {
        uVar23 = _DAT_00809686 - _DAT_0080963c;
      }
      else {
        uVar23 = _DAT_0080963c - _DAT_00809686;
      }
      if (uVar23 < uMem00053d10) {
        if (((_DAT_0080975e != 0) ||
            (uVar4 = (((uint)_DAT_00809758 - (uint)_DAT_0080975a) -
                     ((uint)_DAT_00809758 - ((uint)_DAT_0080966a - (uint)_DAT_0080963c))) +
                     ((uint)_DAT_0080975a - (uint)_DAT_0080975c),
            CARRY4(uVar4 * 0x10000,uVar4 * 0x10000) || CARRY4(uVar4 * 0x20000,uVar4 * 0x20000 + 1)))
           || ((uVar4 & 0xffff) <= (uint)uMem00053d12)) goto LAB_0003a810;
        if (_DAT_00809760 == 0) {
          _DAT_00809670 = _DAT_00809670 | 0x100;
          uVar7 = 2;
        }
        else {
          uVar7 = 0;
        }
        func_0x0009ea4c(0x400,9,uVar7);
      }
      else {
        _DAT_0080975e = 3;
LAB_0003a810:
        _DAT_00809760 = 3;
      }
      _DAT_0080975c = _DAT_0080975a;
      _DAT_0080975a = _DAT_00809758;
      _DAT_00809758 = uVar18;
    }
    else if (_DAT_00808ce4 != 0) {
      _DAT_00808ce4 = _DAT_00808ce4 + -1;
    }
    uVar11 = uMem00053d3c;
    uVar23 = uMem00053d3a;
    uVar18 = uMem00053d28;
    uVar20 = (uint)uMem00053d26;
    uVar10 = _DAT_00809630;
    func_0x0004db80(_DAT_00808746,_DAT_0080450a);
    uVar4 = func_0x0004e500(0x80);
    func_0x0004db80(_DAT_00808740,_DAT_00804a90);
    func_0x0004e500(0x80);
    uVar5 = func_0x0004db80(uMem000540c4);
    _DAT_0080a3f2 = (undefined2)uVar5;
    _DAT_0080a3f4 = (undefined2)uVar4;
    func_0x0004db80(0x8000,_DAT_0080450c);
    _DAT_00809c4c = func_0x0004e500(_DAT_00804a92);
    if ((uVar5 & 0xffff) < (uVar4 & 0xffff)) {
      func_0x0004db80(_DAT_00808740,_DAT_00809c4c);
      func_0x0004e500(0x8000);
      uVar4 = func_0x0004db80(uMem000540c4);
    }
    else {
      uVar4 = (uint)_DAT_00808746;
    }
    _DAT_00809c4a = (undefined2)uVar4;
    uVar10 = uVar10 & 0xf7ff;
    DAT_00809d4b = DAT_00809d4b & 0xfd;
    if (_DAT_00809684 != 0) {
      _DAT_00809684 = _DAT_00809684 + -1;
    }
    if (((_DAT_00809644 < uMem00053ce0) || ((_DAT_00808846 & 0x8000) != 0)) ||
       (((_DAT_00808668 & 0x80) == 0 || (sVar12 = func_0x000aa3f0(), sVar12 != 0)))) {
      _DAT_00809670 = _DAT_00809670 & 0xbfff;
    }
    else {
      _DAT_00809670 = _DAT_00809670 | 0x4000;
    }
    if ((_DAT_00809670 & 0x4000) == 0) {
      _DAT_00809684 = sMem00053ce4;
    }
    if (_DAT_00809684 == 0) {
      _DAT_00809670 = _DAT_00809670 | 0x40;
    }
    if ((((_DAT_00808668 & 0x80) != 0) && (_DAT_00809644 < uMem00053ce0)) ||
       (sVar12 = func_0x000aa3f0(), sVar12 != 0)) {
      _DAT_00809670 = _DAT_00809670 & 0xffbf;
    }
    if (((_DAT_0080965e & 1) != 0) || ((_DAT_00809660 & 0x18) != 0)) {
      func_0x0004ddbc(_DAT_00808746,uMem00053efc);
      uVar4 = func_0x0004db80(uMem00053f0c);
      uVar10 = uVar10 | 0x800;
      DAT_00809d4b = DAT_00809d4b | 2;
    }
    if ((_DAT_00809ab2 & 0x20) != 0) {
      func_0x0004ddbc(_DAT_00808746,uMem00053efc);
      uVar4 = func_0x0004db80(uMem00053f0c);
      uVar10 = uVar10 | 0x800;
      DAT_00809d4b = DAT_00809d4b | 2;
    }
    if ((_DAT_00809670 & 0x20) != 0) {
      func_0x0004db80(_DAT_00808740,_DAT_00808746);
      uVar4 = func_0x0004ddbc(uMem00054016);
      uVar10 = uVar10 | 0x800;
      DAT_00809d4b = DAT_00809d4b | 2;
    }
    if (((_DAT_00809670 & 0x8000) != 0) && ((_DAT_00809630 & 0x800) == 0)) {
      func_0x0004db80(_DAT_00808cc2,_DAT_00808cd2);
      uVar4 = func_0x0004df48(uMem00053cea);
      DAT_00809d4b = DAT_00809d4b | 2;
    }
    if ((_DAT_00809670 & 0x18) != 0) {
      func_0x0004ddbc(_DAT_00808746,uMem00053efc);
      uVar4 = func_0x0004db80(uMem00053f0c);
      uVar10 = uVar10 | 0x800;
      DAT_00809d4b = DAT_00809d4b | 2;
    }
    if ((_DAT_00809670 & 0x41) != 0) {
      uVar4 = (uint)_DAT_00808740;
      DAT_00809d4b = DAT_00809d4b | 2;
    }
    if ((_DAT_00809670 & 0x186) != 0) {
      func_0x0004ddbc(_DAT_00808740,uMem00053efc);
      uVar4 = func_0x0004db80(uMem00053f0c);
      uVar10 = uVar10 | 0x800;
      DAT_00809d4b = DAT_00809d4b | 2;
    }
    if ((_DAT_00809630 & 0x100) != 0) {
      uVar10 = uVar10 | 0x800;
      DAT_00809d4b = DAT_00809d4b | 2;
    }
    if (((_DAT_00809630 & 0x80) != 0) || ((DAT_00808ce8 & 0x20) != 0)) {
      func_0x0004ddbc(_DAT_00808746,uMem00053efc);
      uVar4 = func_0x0004db80(uMem00053f0c);
      uVar10 = uVar10 | 0x800;
      DAT_00809d4b = DAT_00809d4b | 2;
    }
    if ((uVar10 & 0x20) != 0) {
      uVar10 = 0;
    }
    if (((_DAT_008080b8 != 0) && ((_DAT_00808646 & 0x40) != 0)) && ((_DAT_00809630 & 8) == 0)) {
      uVar4 = (uint)_DAT_0080450c;
    }
    uVar5 = (uint)_DAT_00809674 + (uint)uMem00053d14;
    if ((uVar4 & 0xffff) <= ((uint)_DAT_00809674 + (uint)uMem00053d14 & 0xffff)) {
      uVar5 = uVar4;
    }
    _DAT_00809674 = (ushort)uVar5;
    _DAT_00809630 = _DAT_00809630 & 0xf7ff | uVar10 & 0x800;
    func_0x0000ae38(&DAT_00809ea0,uVar5);
    func_0x0004db80(_DAT_00809674,_DAT_0080450a);
    _DAT_00809600 = func_0x0004e500(0x80);
    _DAT_00809602 = _DAT_0080ab0a;
    if (_DAT_00809600 < _DAT_0080ab0a) {
      _DAT_00809602 = _DAT_00809600;
    }
    if (0x3fe < _DAT_00809602) {
      _DAT_00809602 = 0x3ff;
    }
    if ((_DAT_00809630 & 0x100) != 0) {
      func_0x0004ddbc(_DAT_00808746,uMem00053efc);
      func_0x0004db80(uMem00053f0c);
      func_0x0004db80(_DAT_0080450a);
      _DAT_00809abc = func_0x0004e500(0x80);
      if (0x3fe < _DAT_00809abc) {
        _DAT_00809abc = 0x3ff;
      }
    }
    func_0x0004db80(_DAT_00808746,_DAT_0080450a);
    _DAT_00808cd2 = func_0x0004e500(0x80);
    if (0x3fe < _DAT_00808cd2) {
      _DAT_00808cd2 = 0x3ff;
    }
    func_0x0004db80(_DAT_00808740,_DAT_00804a90);
    _DAT_00808cc2 = func_0x0004e500(0x80);
    if (0x3fe < _DAT_00808cc2) {
      _DAT_00808cc2 = 0x3ff;
    }
    if ((_DAT_00809660 & 8) != 0) {
      _DAT_00808ccc = _DAT_00808ccc | 2;
    }
    if (((_DAT_008080b8 == 0) && (_DAT_008080ca < 0x28)) &&
       (((_DAT_00809630 & 1) != 0 && (((_DAT_00808638 & 0x1000) == 0 && ((_DAT_00808ccc & 2) == 0)))
        ))) {
      _DAT_00804a8e = _DAT_00808748;
      if ((uMem00053f0e < _DAT_00808748) && (_DAT_00808748 < uMem00053f14)) {
        _DAT_00804a8c = _DAT_00808748;
      }
    }
    if ((_DAT_00809750 & 4) == 0) {
      if (uMem00053d24 < _DAT_00808686) {
        _DAT_00809750 = _DAT_00809750 | 4;
      }
    }
    else if (_DAT_00808686 <= uMem00053d22) {
      _DAT_00809750 = _DAT_00809750 & 0xfffb;
    }
    if ((_DAT_00809750 & 8) == 0) {
      if (uVar18 < _DAT_00809602) {
        _DAT_00809750 = _DAT_00809750 | 8;
      }
    }
    else if ((uint)_DAT_00809602 <= (uVar20 & 0xffff)) {
      _DAT_00809750 = _DAT_00809750 & 0xfff7;
    }
    if ((_DAT_00809750 & 0x10) == 0) {
      if (uMem00053d2c < _DAT_00808734) {
        _DAT_00809750 = _DAT_00809750 | 0x10;
      }
    }
    else if (_DAT_00808734 <= uMem00053d2a) {
      _DAT_00809750 = _DAT_00809750 & 0xffef;
    }
    _DAT_0080974a = _DAT_00809602 << 4;
    _DAT_00809604 = func_0x0004e01c(_DAT_00809604,_DAT_00809602,uMem00053cf4);
    uVar4 = (uint)_DAT_00809604;
    if (((_DAT_00809660 & 8) == 0) || ((_DAT_00809660 & 0x10) == 0)) {
      if ((_DAT_00809660 & 4) != 0) {
        func_0x0004e500(_DAT_00804a8c,uMem00054014);
        goto LAB_0003ae0c;
      }
      if ((_DAT_00809660 & 0x10) == 0) {
        func_0x0004e490(_DAT_0080976a,4);
        uVar8 = func_0x0004e500(_DAT_00804518);
        uVar7 = func_0x0004e490(0x1a,4);
      }
      else {
        func_0x0004e490(_DAT_00809764,4);
        uVar8 = func_0x0004e500(_DAT_00804510);
        uVar7 = func_0x0004e490(0x1a,4);
      }
      uVar5 = func_0x0004db80(uVar8,uVar7);
    }
    else {
      func_0x0004e500(_DAT_00804a8c,uMem00054014);
LAB_0003ae0c:
      uVar5 = func_0x0004e490(4);
    }
    _DAT_00809682 = (undefined2)((uVar5 & 0xffff) >> 2);
    _DAT_0080a688 = _DAT_0080a686;
    _DAT_0080a686 = _DAT_0080a684;
    _DAT_0080a684 = _DAT_0080a682;
    _DAT_0080a682 = _DAT_00809690;
    _DAT_00809692 = func_0x0004e500(uVar4,uMem00053d20);
    uVar4 = (uint)_DAT_0080969a;
    if ((_DAT_008088d6 & 0x11) == 0) {
      if (_DAT_00809692 <= uVar4) {
        _DAT_00808094 = func_0x0004e490(uMem00054946,2);
        goto LAB_0003af44;
      }
      if (_DAT_00808094 != 0) goto LAB_0003af44;
      if (_DAT_00808096 == 0) {
        uVar4 = uVar4 + 1 & 0xffff;
        if (uVar4 == 0) {
          uVar4 = 0xffffffff;
        }
        goto LAB_0003af44;
      }
    }
    else {
      uVar4 = (uint)uVar23;
      _DAT_00808094 = func_0x0004e490(uMem00054946,2);
LAB_0003af44:
      _DAT_00808096 = func_0x0004e490(uMem00054948,2);
    }
    uVar7 = func_0x0004db80(uVar23,uMem0005494a);
    _DAT_0080969a = func_0x0004dc38(uVar4,uVar23,uVar7);
    func_0x0004e4a4(_DAT_00809692,uVar23);
    _DAT_00809690 = func_0x0004dfc0(_DAT_0080969a);
    _DAT_00809694 = func_0x0004e500(_DAT_00809776,uMem00053d20);
    uVar11 = func_0x0004e500(uVar11,_DAT_00809688 >> 2);
    if ((_DAT_00808848 & 3) != 0) {
      func_0x0004dcf4(_DAT_00809c96,0x100,_DAT_00809c8e);
      _DAT_0080a564 = func_0x0004dc38(uMem00054418,uMem0005441a);
      if (cMem00050385 != '\0') {
        _DAT_0080a56a = func_0x0004e500(_DAT_00808746,_DAT_0080450c);
      }
    }
    _DAT_0080a3f0 = _DAT_0080a3ee;
    if ((_DAT_00808848 & 1) == 0) {
      if ((_DAT_00808848 & 2) == 0) {
        if ((_DAT_0080a3ee & 2) == 0) {
          if (uMem000544ac < _DAT_008088c2) goto LAB_0003b078;
        }
        else if (_DAT_008088c2 <= uMem000544b0) goto LAB_0003b060;
      }
    }
    else if ((_DAT_0080a3ee & 2) == 0) {
      if (uMem000544a8 < _DAT_0080a564) {
LAB_0003b078:
        _DAT_0080a3ee = _DAT_0080a3ee | 2;
      }
    }
    else if (_DAT_0080a564 <= uMem000544aa) {
LAB_0003b060:
      _DAT_0080a3ee = _DAT_0080a3ee & 0xfffd;
    }
    if (((_DAT_0080a3ee & 2) == 0) && (((_DAT_00808848 & 3) == 0 || ((_DAT_00808664 & 10) == 0)))) {
      _DAT_0080a3ee = _DAT_0080a3ee & 0xfffb;
    }
    else {
      _DAT_0080a3ee = _DAT_0080a3ee | 4;
    }
    func_0x0004e410(0x62254);
    func_0x0004e410(0x622cc);
    if ((_DAT_00808664 & 4) == 0) {
      if ((_DAT_00808848 & 2) == 0) {
        uVar15 = func_0x0004e1a8(0x5a6b8);
        _DAT_0080a34c = func_0x0004e1a8(0x58638);
        if (((_DAT_00808666 & 4) == 0) && ((((byte)_DAT_0080a3f0 ^ (byte)_DAT_0080a3ee) & 4) != 0))
        {
          _DAT_0080a3ee = _DAT_0080a3ee | 0x41;
          _DAT_008080d4 = 0;
          _DAT_008080d6 = 0;
        }
        _DAT_0080a350 = uVar15;
        if ((_DAT_0080a3ee & 4) == 0) {
          if ((_DAT_0080a3ee & 1) == 0) {
            _DAT_0080a344 = 0xff;
          }
          else {
            if ((_DAT_008080d4 == 0) && (_DAT_0080a344 != 0xff)) {
              func_0x0004db80(_DAT_0080a344,uMem00053ff8);
              _DAT_0080a344 = func_0x0004dc14();
              _DAT_008080d4 = sMem00054008;
            }
            if (_DAT_0080a344 == 0xff) goto LAB_0003b3b4;
          }
        }
        else if ((_DAT_0080a3ee & 1) == 0) {
          _DAT_0080a344 = 0;
        }
        else {
          if ((_DAT_008080d4 == 0) && (_DAT_0080a344 != 0)) {
            _DAT_0080a344 = func_0x0004e500(_DAT_0080a344,uMem00053ffe);
            _DAT_008080d4 = sMem00054008;
          }
          if (_DAT_0080a344 == 0) {
LAB_0003b3b4:
            _DAT_0080a3ee = _DAT_0080a3ee & 0xfffe;
          }
        }
        _DAT_0080a346 = 0;
        _DAT_008080d6 = 0;
        _DAT_0080a3ee = _DAT_0080a3ee & 0xffbf;
        _DAT_0080a342 = _DAT_0080a344;
        uVar3 = _DAT_0080a356;
        uVar18 = _DAT_0080a344;
        uVar15 = _DAT_0080a350;
        uVar16 = _DAT_0080a34c;
      }
      else {
        bVar25 = (_DAT_0080a3ee & 1) != 0;
        if (bVar25) {
          if ((((byte)_DAT_0080a7e0 ^ (byte)_DAT_0080a7e2) & 4) == 0) {
            if (((_DAT_0080a7e0 & 4) != 0) ||
               ((((uVar15 = uMem00054004, (_DAT_0080a7e0 & 0x2000) == 0 &&
                  ((_DAT_0080a7e2 & 0x2000) == 0)) &&
                 ((uVar15 = uMem00054006, (_DAT_0080a7e0 & 0x1000) == 0 ||
                  ((_DAT_0080a7e2 & 0x4000) == 0)))) &&
                (((_DAT_0080a7e0 & 0x4000) == 0 || ((_DAT_0080a7e2 & 0x1000) == 0)))))) {
              _DAT_0080a348 = 0xff;
              uVar15 = 0;
            }
          }
          else {
            uVar15 = uMem00053ff8;
            if ((_DAT_0080a7e0 & 4) != 0) {
              uVar15 = uMem00053ffe;
            }
          }
          if (_DAT_008080d4 == 0) {
            func_0x0004db80(_DAT_0080a348,uVar15);
            _DAT_0080a348 = func_0x0004dc14();
            _DAT_008080d4 = sMem00054008;
          }
        }
        else {
          _DAT_0080a348 = 0;
          _DAT_008080d4 = sMem00054008;
          if ((_DAT_0080a7d8 == _DAT_0080a7de) ||
             (uVar5 = (uint)(_DAT_0080a7d8 ^ _DAT_0080a7de) * 0x10000,
             uVar4 = (uint)(_DAT_0080a7d8 ^ _DAT_0080a7de) * 0x20000,
             CARRY4(uVar5,uVar5) || CARRY4(uVar4,uVar4 + bVar25))) {
            _DAT_0080a3ee = _DAT_0080a3ee & 0xfffe;
          }
          else {
            _DAT_0080a3ee = _DAT_0080a3ee | 1;
          }
          _DAT_0080a7e0 = _DAT_0080a7d8;
          _DAT_0080a7e2 = _DAT_0080a7de;
        }
        if (0xfe < _DAT_0080a348) {
          _DAT_0080a3ee = _DAT_0080a3ee & 0xfffe;
        }
        _DAT_0080a7de = _DAT_0080a7e0;
        if ((_DAT_0080a7e2 & 0x8000) == 0) {
          if ((_DAT_0080a7e2 & 4) != 0) {
            puVar9 = (undefined *)0x5a6b8;
            goto LAB_0003b24c;
          }
          if ((_DAT_0080a7e2 & 0x1000) != 0) {
            puVar9 = (undefined *)0x58638;
            goto LAB_0003b24c;
          }
          if ((_DAT_0080a7e2 & 0x2000) != 0) {
            puVar9 = (undefined *)0x58784;
            goto LAB_0003b24c;
          }
          uVar15 = _DAT_0080a356;
          if ((_DAT_0080a7e2 & 0x4000) != 0) {
            puVar9 = (undefined *)0x588d0;
            goto LAB_0003b24c;
          }
        }
        else {
          puVar9 = &Discovered_2D_Unknown_RAM_0xC60E_0x57D48;
LAB_0003b24c:
          uVar15 = func_0x0004e1a8(puVar9);
        }
        if ((_DAT_0080a7e0 & 0x8000) == 0) {
          if ((_DAT_0080a7e0 & 4) == 0) {
            if ((_DAT_0080a7e0 & 0x1000) == 0) {
              if ((_DAT_0080a7e0 & 0x2000) == 0) {
                uVar3 = uVar15;
                uVar18 = _DAT_0080a348;
                uVar16 = _DAT_0080a354;
                if ((_DAT_0080a7e0 & 0x4000) == 0) goto LAB_0003b3e8;
                puVar9 = (undefined *)0x588d0;
              }
              else {
                puVar9 = (undefined *)0x58784;
              }
            }
            else {
              puVar9 = (undefined *)0x58638;
            }
          }
          else {
            puVar9 = (undefined *)0x5a6b8;
          }
        }
        else {
          puVar9 = &Discovered_2D_Unknown_RAM_0xC60E_0x57D48;
        }
        _DAT_0080a354 = func_0x0004e1a8(puVar9);
        uVar3 = uVar15;
        uVar18 = _DAT_0080a348;
        uVar16 = _DAT_0080a354;
      }
LAB_0003b3e8:
      _DAT_0080a356 = uVar3;
      uVar4 = func_0x0004e0d4(uVar16,uVar15,uVar18);
    }
    else {
      uVar4 = func_0x0004e1a8(&Discovered_2D_Unknown_RAM_0xC60E_0x57D48);
      _DAT_0080a3ee = _DAT_0080a3ee & 0xffbe;
    }
    if ((uint)_DAT_0080a468 <= (uVar4 & 0xffff)) {
      uVar4 = (uint)_DAT_0080a468;
    }
    _DAT_00809a0e = (undefined2)uVar4;
    func_0x0000ae38(&DAT_00809ea4,uVar4);
    func_0x0004e4a4(_DAT_00809690,uVar11);
    func_0x0004dfc0(uVar23);
    uVar4 = func_0x0004ddbc(_DAT_00809a0e);
    _DAT_00809bd6 = (undefined2)uVar4;
    func_0x0004e4a4(_DAT_00809694,uVar11);
    uVar7 = func_0x0004dfc0(uVar23);
    if ((_DAT_00808848 & 2) == 0) {
      if ((_DAT_0080a3ee & 0x200) == 0) {
        if (uMem000544ae < _DAT_008088c2) goto LAB_0003b494;
      }
      else if (_DAT_008088c2 <= uMem000544b2) goto LAB_0003b47c;
    }
    else if ((_DAT_0080a7d8 & 8) == 0) {
LAB_0003b47c:
      _DAT_0080a3ee = _DAT_0080a3ee & 0xfdff;
    }
    else {
LAB_0003b494:
      _DAT_0080a3ee = _DAT_0080a3ee | 0x200;
    }
    func_0x0004e410(0x62290);
    func_0x0004e410(0x622cc);
    _DAT_0080a352 = func_0x0004e1a8(0x5a950);
    _DAT_0080a34e = func_0x0004e1a8(0x58b68);
    bVar25 = (_DAT_00808848 & 2) != 0;
    if ((bVar25) && (bVar25 = (_DAT_00808664 & 4) != 0, bVar25)) {
      _DAT_0080a34a = 0;
      _DAT_008080d8 = 0;
LAB_0003b5a0:
      _DAT_0080a3ee = _DAT_0080a3ee & 0xfeff;
    }
    else {
      uVar20 = (uint)(_DAT_0080a3f0 ^ _DAT_0080a3ee) * 0x400000;
      uVar5 = (uint)(_DAT_0080a3f0 ^ _DAT_0080a3ee) * 0x800000;
      if (CARRY4(uVar20,uVar20) || CARRY4(uVar5,uVar5 + bVar25)) {
        _DAT_008080d8 = 0;
        _DAT_0080a3ee = _DAT_0080a3ee | 0x100;
      }
      if ((_DAT_0080a3ee & 0x200) == 0) {
        if ((_DAT_0080a3ee & 0x100) == 0) {
          _DAT_0080a34a = 0xff;
        }
        else {
          if ((_DAT_008080d8 == 0) && (_DAT_0080a34a < 0xff)) {
            func_0x0004db80(_DAT_0080a34a,uMem00053ffc);
            _DAT_0080a34a = func_0x0004dc14();
            _DAT_008080d8 = sMem0005400a;
          }
          if (0xfe < _DAT_0080a34a) goto LAB_0003b5a0;
        }
      }
      else if ((_DAT_0080a3ee & 0x100) == 0) {
        _DAT_0080a34a = 0;
      }
      else {
        if ((_DAT_008080d8 == 0) && (_DAT_0080a34a != 0)) {
          _DAT_0080a34a = func_0x0004e500(_DAT_0080a34a,uMem00054002);
          _DAT_008080d8 = sMem0005400a;
        }
        if (_DAT_0080a34a == 0) goto LAB_0003b5a0;
      }
    }
    uVar8 = func_0x0004e0d4(_DAT_0080a34e,_DAT_0080a352,_DAT_0080a34a);
    _DAT_00809a10 = (undefined2)uVar8;
    func_0x0000ae38(&DAT_00809ea8,uVar8);
    _DAT_00809bd4 = func_0x0004ddbc(uVar7,_DAT_00809a10);
    if ((uVar4 & 0xffff) < (uint)_DAT_00809bd4) {
      uVar4 = (uint)_DAT_00809bd4;
    }
    _DAT_008096a0 = func_0x0004ddbc(uVar4,_DAT_0080a340);
    _DAT_0080969c = _DAT_008096a0;
    if (((_DAT_0080a836 & 1) != 0) && (uMem00054698 <= _DAT_008096a0)) {
      _DAT_0080969c = uMem00054698;
    }
    if (_DAT_0080aa6a <= _DAT_0080969c) {
      _DAT_0080969c = _DAT_0080aa6a;
    }
    func_0x00070934();
    if ((_DAT_00809d26 & 1) == 0) {
      func_0x0000ae38(0x809da4,0x2d);
    }
    else {
      DAT_00809d2d = DAT_00809d2d | 1;
    }
    uVar18 = _DAT_00808740;
    if ((_DAT_00808846 & 8) != 0) {
      uVar4 = (uint)_DAT_00808746;
      if (uMem00053674 < uVar4) {
        _DAT_0080450e = _DAT_0080450e & 0xfcfb;
        _DAT_008080c2 = sMem00053d40;
      }
      if (((((((_DAT_008088d6 & 0x11) == 0) && (uMem0005367c < _DAT_0080800c)) &&
            (uMem0005367a < _DAT_0080873e)) && ((uMem00053676 <= uVar4 && (uVar4 <= uMem00053674))))
          && (_DAT_008080c2 == 0)) && ((_DAT_00808646 & 4) == 0)) {
        bVar25 = true;
        if (((_DAT_0080450e & 2) == 0) && ((_DAT_00808fae & 0x7f) == 0)) {
          if ((uVar4 <= _DAT_0080450c) &&
             (uVar5 = uVar4, _DAT_0080450c = func_0x0004e500(_DAT_0080450c,uMem00053680),
             bVar1 = _DAT_0080450c < uVar4, uVar4 = uVar5, bVar1)) {
            _DAT_0080450c = (ushort)uVar5;
          }
          if ((_DAT_00809670 & 0x18) == 0) {
            uVar5 = (uint)uVar18;
            if (_DAT_00804a92 < uVar5) {
              _DAT_00804a92 = func_0x0004db80(_DAT_00804a92,uMem00053680);
              if (uVar5 <= _DAT_00804a92) goto LAB_0003b7ac;
            }
            else {
              _DAT_00804a92 = func_0x0004e500(_DAT_00804a92,uMem00053680);
              if (_DAT_00804a92 < uVar5) {
LAB_0003b7ac:
                _DAT_00804a92 = uVar18;
              }
            }
          }
        }
      }
      else {
        bVar25 = false;
      }
      uVar5 = func_0x0004db80(_DAT_00808786,uMem0005367e);
      uVar23 = (ushort)uVar4;
      if (((bVar25) && ((uint)_DAT_00808786 <= (uVar4 & 0xffff))) &&
         ((uVar4 & 0xffff) <= (uVar5 & 0xffff))) {
        if (_DAT_008080cc == 0) {
          _DAT_008080cc = sMem00053678;
          if (_DAT_0080450c < _DAT_00808786) {
            if ((_DAT_0080450e & 0x100) == 0) {
              _DAT_0080450e = _DAT_0080450e | 6;
              _DAT_0080450c = func_0x0004db80(_DAT_0080450c,4);
              if (_DAT_00808786 <= _DAT_0080450c) {
                _DAT_0080450c = _DAT_00808786;
              }
LAB_0003b8a0:
              _DAT_00808786 = uVar23;
              _DAT_0080450e = _DAT_0080450e | 0x100;
            }
          }
          else {
            uVar18 = func_0x0004db80(_DAT_00808786,uMem00053f16);
            if ((uVar18 <= _DAT_0080450c) && ((_DAT_0080450e & 0x100) == 0)) {
              _DAT_0080450e = _DAT_0080450e | 2;
              _DAT_0080450c = func_0x0004e500(_DAT_0080450c,4);
              uVar23 = _DAT_00808786;
              if (_DAT_0080450c < _DAT_00808786) {
                _DAT_0080450c = _DAT_00808786;
              }
              goto LAB_0003b8a0;
            }
            _DAT_0080450e = _DAT_0080450e | 0x102;
          }
          if (((_DAT_0080450e & 0x200) == 0) && ((_DAT_00809670 & 0x18) == 0)) {
            if (_DAT_00804a92 < _DAT_0080964e) {
              _DAT_0080450e = _DAT_0080450e | 0x220;
              _DAT_00804a92 = func_0x0004db80(_DAT_00804a92,4);
              if (_DAT_0080964e <= _DAT_00804a92) {
LAB_0003b954:
                _DAT_00804a92 = _DAT_0080964e;
              }
            }
            else {
              uVar18 = func_0x0004db80(_DAT_0080964e,uMem00053f16);
              if (_DAT_00804a92 < uVar18) {
                _DAT_0080450e = _DAT_0080450e | 0x220;
              }
              else {
                _DAT_0080450e = _DAT_0080450e | 0x220;
                _DAT_00804a92 = func_0x0004e500(_DAT_00804a92,4);
                if (_DAT_00804a92 < _DAT_0080964e) goto LAB_0003b954;
              }
            }
          }
        }
      }
      else {
        _DAT_008080cc = sMem00053678;
        _DAT_00808786 = uVar23;
        _DAT_0080964e = uVar18;
      }
      if ((_DAT_00808846 & 0x4000) == 0) {
        uVar18 = _DAT_00809602;
        if (_DAT_00809602 <= _DAT_00809776) {
          uVar18 = _DAT_00809776;
        }
        if ((_DAT_0080450e & 0x8000) == 0) {
          if (uMem00053d34 < uVar18) {
            _DAT_0080450e = _DAT_0080450e | 0x8000;
          }
        }
        else if (uVar18 <= uMem00053d36) {
          _DAT_0080450e = _DAT_0080450e & 0x7fff;
        }
        if ((_DAT_0080450e & 0x8000) != 0) goto LAB_0003ba68;
LAB_0003ba60:
        _DAT_0080450e = _DAT_0080450e | 1;
      }
      else {
        if ((_DAT_0080450e & 0x8000) == 0) {
          if (uMem00053d34 < _DAT_00809602) {
            _DAT_0080450e = _DAT_0080450e | 0x8000;
          }
        }
        else if (_DAT_00809602 <= uMem00053d36) {
          _DAT_0080450e = _DAT_0080450e & 0x7fff;
        }
        if ((_DAT_0080450e & 0x4000) == 0) {
          if (uMem000544c4 < _DAT_00809776) {
            _DAT_0080450e = _DAT_0080450e | 0x4000;
          }
        }
        else if (_DAT_00809776 <= uMem000544c6) {
          _DAT_0080450e = _DAT_0080450e & 0xbfff;
        }
        if (((_DAT_0080450e & 0x8000) == 0) && ((_DAT_0080450e & 0x4000) == 0)) goto LAB_0003ba60;
LAB_0003ba68:
        _DAT_0080450e = _DAT_0080450e & 0xfffe;
      }
      if ((_DAT_0080450e & 1) == 0) {
        _DAT_00808638 = _DAT_00808638 & 0xfbff;
      }
      else {
        _DAT_00808638 = _DAT_00808638 | 0x400;
      }
    }
    uVar4 = (uint)_DAT_0080963c;
    uVar5 = (uint)(_DAT_00804a92 >> 2);
    uVar20 = func_0x0004db80(uVar5,uMem00053f18);
    uVar18 = func_0x0004e500(uMem00053f1a);
    uVar19 = func_0x0004e500(_DAT_00809776,uMem00053d20);
    uVar5 = func_0x0004db80((uVar19 & 0xffff) >> 2,uVar5);
    if ((uVar4 & 0xffff) < (uVar5 & 0xffff)) {
      uVar4 = uVar5;
    }
    if ((_DAT_0080450e & 0x80) == 0) {
      if ((uVar20 & 0xffff) < (uVar4 & 0xffff)) {
        _DAT_0080450e = _DAT_0080450e | 0x80;
      }
    }
    else if ((uVar4 & 0xffff) <= (uint)uVar18) {
      _DAT_0080450e = _DAT_0080450e & 0xff7f;
    }
    if ((_DAT_0080450e & 0x80) == 0) {
      _DAT_0080450e = _DAT_0080450e | 0x10;
    }
    else {
      _DAT_0080450e = _DAT_0080450e & 0xffef;
    }
    _DAT_0080450c = func_0x0004dc38(_DAT_0080450c,uMem00053676,uMem00053674);
    _DAT_00804a92 = func_0x0004dc38(_DAT_00804a92,uMem00053676,uMem00053674);
    func_0x0004dbe8(&SUB_00808000,&DAT_0080800c);
    func_0x0004dbc0(&DAT_00808080,&DAT_008080b8);
    bVar24 = DAT_0080886b;
    if (_DAT_0080809c == 0) {
      _DAT_0080809c = 5;
      _DAT_00808fb0 = _DAT_00808fb0 + 1;
      DAT_0080886b = DAT_0080886b | 1;
      sVar12 = _DAT_00808fb4 + 1;
      if (_DAT_00808fb4 == -1) {
        sVar12 = _DAT_00808fb4;
      }
      _DAT_00808fb4 = sVar12;
      if ((_DAT_00808fb0 & 1) == 0) {
        DAT_0080886b = bVar24 | 3;
      }
      if ((_DAT_00808fb0 & 3) == 0) {
        DAT_0080886b = DAT_0080886b | 4;
      }
      if ((_DAT_00808fb0 & 7) == 0) {
        DAT_0080886b = DAT_0080886b | 0x40;
      }
    }
    if (_DAT_0080809e == 0) {
      _DAT_0080809e = 6;
      DAT_0080a88f = DAT_0080a88f | 1;
    }
    if (_DAT_008080a0 == 0) {
      _DAT_008080a0 = 8;
      DAT_0080886b = DAT_0080886b | 0x80;
    }
    if (_DAT_008080a4 == 0) {
      _DAT_008080a4 = 0x14;
      func_0x00000310();
      uVar7 = _DAT_0080a514;
      _DAT_0080a514 = 0;
      func_0x00000328();
      func_0x0004dd1c(uVar7,(uint)_MPG_Display * 0x15,(uint)_DAT_0080501e << 6);
      _DAT_0080a518 = func_0x0004dc28();
    }
    bVar24 = DAT_0080886b;
    if (_DAT_008080a2 == 0) {
      _DAT_008080a2 = 100;
      _DAT_00808fb2 = _DAT_00808fb2 + 1;
      DAT_0080886b = DAT_0080886b | 8;
      if ((_DAT_00808fb2 & 1) == 0) {
        DAT_0080886b = bVar24 | 0x18;
      }
      if ((_DAT_00808fb2 & 3) == 0) {
        DAT_0080886b = DAT_0080886b | 0x20;
      }
      func_0x00000310();
      _DAT_008089e0 = _DAT_008089dc;
      _DAT_008089dc = 0;
      func_0x00000328();
    }
    if (_DAT_008080ca == 0) {
      _DAT_00804b24 = _DAT_0080a72a;
      if ((_DAT_008080b0 == 0) || (sVar12 = func_0x000001d4(), sVar12 == 0)) {
        func_0x00000160(0x5a5a);
        _DAT_00804500 = func_0x000889d4();
        _DAT_00804502 = 0x55aa;
        func_0x00000310();
        _DAT_00804de0 = 0x5555;
        _DAT_00804e08 = 0;
        func_0x00000468();
      }
    }
    else {
      _DAT_008080b0 = 3000;
    }
    if (_DAT_00808080 != 0) {
      if (((cMem0005037c != '\0') && (_DAT_00809d0a != 0x55aa)) &&
         (sVar12 = func_0x0000c100(), sVar12 == 1)) {
        sVar12 = _DAT_00804df4 + 1;
        if (_DAT_00804df4 == -1) {
          sVar12 = _DAT_00804df4;
        }
        _DAT_00804df4 = sVar12;
        DAT_00804dd1 = DAT_00804dd1 & 0xfe;
        func_0x0000c130();
      }
      func_0x0000c064();
    }
    if ((_DAT_00808844 & 0x80) != 0) {
      if (_DAT_00808090 == 0) {
        func_0x00000310();
        if (_DAT_00808a9e != 0) {
          _DAT_00808a9e = _DAT_00808a9e + -1;
        }
        func_0x00000328();
      }
      uVar18 = uMem00053216;
      if (_DAT_0080813a != 0) {
        uVar18 = uMem00053218;
      }
      if ((_DAT_00808aa0 & 0x80) == 0) {
        uVar18 = 2;
      }
      if ((_DAT_00808090 == 0) || (uVar18 < _DAT_00808090)) {
        _DAT_00808090 = uVar18;
      }
    }
    if ((_DAT_00808b20 & 0x80) == 0) {
      if (uMem000533c2 < _DAT_0080873e) {
        _DAT_00808b20 = _DAT_00808b20 | 0x80;
      }
    }
    else if (_DAT_0080873e <= uMem000533c0) {
      _DAT_00808b20 = _DAT_00808b20 & 0xff7f;
    }
    if ((_DAT_00808846 & 0x2000) != 0) {
      _DAT_00808c56 = 0;
      _DAT_00808c58 = 0;
      _DAT_00808c50 = _DAT_00808c4e;
      _DAT_00808c54 = _DAT_00808c52;
    }
    uVar18 = _DAT_00809aae + 1;
    if (_DAT_00809aae == 0xffff) {
      uVar18 = _DAT_00809aae;
    }
    _DAT_00809aae = uVar18;
    uVar18 = func_0x0004e490(uMem00053e78,5);
    if (uVar18 <= _DAT_00809aae) {
      if (_DAT_00808746 < _DAT_00809aac) {
        _DAT_00809aac = _DAT_00809aac - _DAT_00808746;
      }
      else {
        _DAT_00809aac = _DAT_00808746 - _DAT_00809aac;
      }
      uVar11 = uMem00053e7c;
      uVar18 = uMem00053e7a;
      if ((_DAT_00808646 & 0x20) == 0) {
        uVar11 = uMem00053e80;
        uVar18 = uMem00053e7e;
      }
      if (uVar18 < _DAT_00809aac) {
        _DAT_008082de = uVar11;
      }
      _DAT_00809aae = 0;
      _DAT_00809aac = _DAT_00808746;
    }
    func_0x000acd44(0x8df8);
    func_0x000ad0a4();
    if (((cMem00050387 != '\0') && (((_DAT_00808668 & 0x40) != 0 || ((_DAT_00808646 & 0x40) != 0))))
       && (_DAT_00809aa2 <= _DAT_0080a620)) {
      _DAT_0080a620 = _DAT_00809aa2;
    }
    _DAT_00808628 = _TMS1CT - sVar22;
  }
  sVar22 = _TMS1CT;
  if ((_DAT_00808fae & 7) == 0) {
    if ((_DAT_00808848 & 2) != 0) {
      func_0x0003e4b8();
    }
    if ((_DAT_00808848 & 2) != 0) {
      func_0x0003e35c();
    }
    if (cMem00050358 != '\0') {
      if ((_DAT_00808c72 & 0x10) == 0) {
        _DAT_00808c70 = 0;
      }
      else if (_DAT_00808c70 != 0) {
        _DAT_00808c70 = _DAT_00808c70 + -1;
      }
      if ((_DAT_00808c72 & 0x13) == 0) {
        _DAT_00808638 = _DAT_00808638 & 0xfffd;
      }
      else if ((_DAT_00808c72 & 2) == 0) {
        if (_DAT_00808c70 == 0) {
          if ((_DAT_00808638 & 2) == 0) {
            _DAT_00808638 = _DAT_00808638 | 2;
          }
          else {
            _DAT_00808638 = _DAT_00808638 & 0xfffd;
          }
          if ((_DAT_00808c72 & 0x10) != 0) {
            _DAT_00808c70 = 3;
          }
        }
      }
      else {
        _DAT_00808638 = _DAT_00808638 | 2;
      }
    }
    if ((_DAT_00808844 & 0x80) != 0) {
      func_0x00000310();
      iVar21 = func_0x0004e4a4(_DAT_00808aaa,7);
      _DAT_00808aaa = func_0x0004dfc0(iVar21 + (uint)_DAT_00808aa8,8);
      if ((_DAT_0080863a & 2) == 0) {
        if (_DAT_0080813a == 0) {
          func_0x0004e410(0x624de);
          uVar7 = 0x5a034;
        }
        else {
          func_0x0004e410(0x624de);
          uVar7 = 0x60278;
        }
      }
      else if (_DAT_0080813a == 0) {
        func_0x0004e410(0x624de);
        uVar7 = 0x5a020;
      }
      else {
        func_0x0004e410(0x624de);
        uVar7 = 0x6028c;
      }
      func_0x0004e1a8(uVar7);
      iVar21 = func_0x000a9e54();
      func_0x0004e410(0x624de);
      func_0x0004e1a8(0x5a048);
      iVar17 = func_0x000a9e38();
      func_0x0004e4a4(_DAT_00808aaa,iVar17 << 5);
      iVar17 = func_0x0004def8();
      _DAT_00808aa6 = func_0x0004dc38(iVar17 + iVar21,0xff,1);
      func_0x00000328();
    }
    if (_DAT_00808748 < _DAT_0080874e) {
      uVar18 = _DAT_0080874e - _DAT_00808748;
      if (_DAT_0080875e < uVar18) {
        _DAT_0080875e = uVar18;
      }
      uVar23 = 0;
    }
    else {
      uVar23 = _DAT_00808748 - _DAT_0080874e;
      if (_DAT_0080875a < uVar23) {
        _DAT_0080875a = uVar23;
      }
      uVar18 = 0;
    }
    if (uMem0005321a <= uVar23) {
      _DAT_0080813a = sMem0005321e;
    }
    if (uMem00053220 <= uVar18) {
      _DAT_0080813c = uMem00053224;
    }
    if ((((_DAT_00808a32 & 0x40) == 0) && (uMem000531d8 <= uVar23)) && (_DAT_00808a60 <= uVar23)) {
      _DAT_00808a62 = uMem000531dc;
      _DAT_00808a60 = uVar23;
    }
    DAT_0080886a = DAT_0080886a & 0xf7;
    if (_DAT_00808756 < _DAT_00808748) {
      _DAT_00808756 = _DAT_00808748 - _DAT_00808756;
    }
    else {
      _DAT_00808756 = _DAT_00808756 - _DAT_00808748;
    }
    if (uMem000531a6 <= _DAT_00808756) {
      _DAT_0080836e = uMem000531a8;
    }
    _DAT_00808756 = _DAT_00808754;
    _DAT_00808754 = _DAT_00808752;
    _DAT_00808752 = _DAT_00808750;
    _DAT_00808750 = _DAT_0080874e;
    _DAT_0080874e = _DAT_00808748;
    _DAT_00809772 = _DAT_00809770;
    _DAT_00809770 = _DAT_0080976e;
    _DAT_0080976e = _DAT_0080976c;
    if (_DAT_00808746 >> 2 < _DAT_008095f6) {
      uVar4 = (uint)_DAT_008095f6 - (uint)(_DAT_00808746 >> 2);
      if ((uint)_DAT_008095fe < (uVar4 & 0xffff)) {
        _DAT_008095fe = (ushort)uVar4;
      }
      uVar5 = 0;
    }
    else {
      uVar5 = -((uint)_DAT_008095f6 - (uint)(_DAT_00808746 >> 2));
      if ((uint)_DAT_008095fa < (uVar5 & 0xffff)) {
        _DAT_008095fa = (ushort)uVar5;
      }
      uVar4 = 0;
    }
    uVar11 = func_0x0004e500(_DAT_0080a854,1);
    if (cMem00063b24 == '\0') {
      uVar18 = func_0x0004e500(_DAT_00808746,_DAT_0080a866);
      if (((uMem00054a24 < uVar18) && ((_DAT_00808646 & 0x80) != 0)) &&
         (_DAT_0080879e <= uMem00054a26)) goto LAB_0003c2b4;
    }
    else if ((((byte)_DAT_00808648 ^ (byte)_DAT_00808646) & (byte)_DAT_00808648 & 0x80) != 0) {
LAB_0003c2b4:
      uVar11 = uMem00054a20;
    }
    _DAT_0080a866 = _DAT_00808746;
    if (_DAT_0080974c != 0) {
      _DAT_0080974c = _DAT_0080974c + -1;
    }
    if (_DAT_00809748 != 0) {
      _DAT_00809748 = _DAT_00809748 + -1;
      _DAT_0080974c = sMem00053d2e;
    }
    if ((uint)uMem00053d32 < (uVar5 & 0xffff)) {
      _DAT_00809748 = sMem00053d30;
    }
    else if ((uint)uMem00053d32 < (uVar4 & 0xffff)) {
      _DAT_00809748 = 0;
    }
    _DAT_0080a854 = uVar11;
    uVar18 = func_0x0004e500(_DAT_00809604,(uint)uMem00053d38 << 2);
    if (_DAT_00809602 < uVar18) {
      _DAT_00809748 = 0;
    }
    _DAT_008095f6 = _DAT_00808746 >> 2;
    func_0x0003ce10();
    func_0x0003ce68();
    func_0x0003cf40();
    func_0x0003cf8c();
    func_0x0003cfd8();
    func_0x0003d024();
    func_0x0003d070();
    if ((_DAT_00809630 & 8) == 0) {
      if (uMem00053eae < _DAT_0080873e) {
        _DAT_00809630 = _DAT_00809630 | 8;
      }
    }
    else if (_DAT_0080873e <= uMem00053eac) {
      _DAT_00809630 = _DAT_00809630 & 0xfff7;
    }
    if ((_DAT_00809630 & 1) == 0) {
      if (uMem00053cf0 < _DAT_0080873e) {
        _DAT_00809630 = _DAT_00809630 | 1;
      }
    }
    else if (_DAT_0080873e <= uMem00053cee) {
      _DAT_00809630 = _DAT_00809630 & 0xfffe;
    }
    if ((_DAT_00809630 & 0x2000) == 0) {
      if (uMem000540d6 < _DAT_0080873e) {
        _DAT_00809630 = _DAT_00809630 | 0x2000;
      }
    }
    else if (_DAT_0080873e <= uMem000540d8) {
      _DAT_00809630 = _DAT_00809630 & 0xdfff;
    }
    uVar18 = uMem0008319e;
    if ((cMem00050385 != '\0') && ((_DAT_00808848 & 1) != 0)) {
      uVar18 = func_0x0003d124();
    }
    if ((((_DAT_00808846 & 0x4000) == 0) || ((_DAT_008098d0 & 0x80) == 0)) ||
       ((_DAT_00809872 & 2) != 0)) {
      _DAT_0080a5a2 = _DAT_0080a5a2 & 0xf7ff;
      _DAT_0080a576 = uVar18;
    }
    else {
      _DAT_0080a576 = func_0x0004de60(_DAT_0080a6c0,_DAT_0080a6ba);
      _DAT_0080a5a2 = _DAT_0080a5a2 | 0x800;
    }
    if (7999 < _DAT_0080a576) {
      _DAT_0080a576 = 8000;
    }
    if ((_DAT_00808846 & 0x2000) != 0) {
      func_0x00079470();
    }
    _DAT_0080862c = _TMS1CT - sVar22;
  }
  if (_DAT_0080808e == 0) {
    _DAT_008089c8 = 0;
  }
  if ((_DAT_00808fae & 7) == 0) {
    sVar22 = _TMS1CT;
    _DAT_008089ce = func_0x0004e500(_DAT_00808748,_DAT_008089d0);
    DAT_0080886a = DAT_0080886a & 0xdf;
    _DAT_008089d4 = _DAT_008089d4 + 1;
    if (uMem0005310c <= _DAT_008089ce) {
      if ((((uMem0005310c <= _DAT_008089ce) && (_DAT_008089d0 < _DAT_008089cc)) &&
          ((_DAT_008089c8 < _DAT_008089c6 && ((_DAT_008088d6 & 0x11) == 0)))) &&
         ((((_DAT_00808846 & 8) != 0 && ((_DAT_0080450e & 1) == 0)) ||
          (((_DAT_00808846 & 8) == 0 && ((_DAT_00808668 & 0x80) == 0)))))) {
        _DAT_0080808e = sMem0005310a;
        DAT_0080886a = DAT_0080886a | 0x20;
        uVar4 = (uint)(_DAT_008089ce >> 2);
        if (7 < uVar4) {
          uVar4 = 8;
        }
        uVar7 = func_0x0004db80(_DAT_0080aaae,0x180);
        uVar5 = func_0x0004dcf4(_DAT_008089ca,uVar7,0x200);
        uVar4 = (uint)(byte)(&Asynchronous_Injection_TPS_Accel_IPW_per_change_in_TPS)
                            [uVar4 & 0xffff] * (uVar5 & 0xffff) >> 7;
        if ((uint)_Asynchronous_Injection_TPS_Accel_Max_IPW_Limit <= (uVar4 & 0xffff)) {
          uVar4 = (uint)_Asynchronous_Injection_TPS_Accel_Max_IPW_Limit;
        }
        _DAT_008089c4 = (short)uVar4;
        _DAT_008089c8 = _DAT_008089c8 + _DAT_008089c4;
        if ((uVar4 & 0xffff) != 0) {
          uVar7 = func_0x0003116c((uVar4 & 0xffff) << 5);
          func_0x00000310();
          uVar5 = (uint)*(ushort *)((uint)_DAT_00808e0a * 2 + 0x963e);
          uVar4 = func_0x0000dc64();
          func_0x000311b8(uVar7,uVar5 & ~uVar4);
          func_0x00000328();
        }
      }
      _DAT_008089d4 = 0;
      _DAT_008089d2 = _DAT_00808748;
    }
    _DAT_008089d0 = _DAT_00808748;
    if (uMem0005310c <= _DAT_008089ce) {
      _DAT_0080836e = uMem000531a8;
    }
    _DAT_0080862c = (_DAT_0080862c + _TMS1CT) - sVar22;
  }
  _DAT_0080862a = _DAT_0080862c;
  if ((_DAT_00808fae & 0xf) != 0) goto LAB_0003ca60;
  sVar22 = _TMS1CT;
  if (((((((DAT_0080ad57 & 0x80) == 0) && ((_DAT_0080aed8 & 0x30) == 0)) &&
        ((_DAT_0080afaa & 0x80) == 0)) && (((_DAT_00809660 & 8) == 0 && ((_DAT_0080965e & 1) == 0)))
       ) && ((_DAT_00808cc6 & 4) == 0)) || ((_DAT_00809660 & 0x10) != 0)) {
    uVar18 = func_0x0004e500(_DAT_00808752,_DAT_0080874e);
    if ((uMem000549fc <= uVar18) && (_DAT_0080967a <= uMem00054a00)) goto LAB_0003c728;
    uVar18 = func_0x0004e500(_DAT_0080874e,_DAT_00808752);
    if (uMem000549fe <= uVar18) goto LAB_0003c754;
  }
  else {
    uVar18 = func_0x0004e500(_DAT_00809772,_DAT_0080976e);
    if ((uVar18 < uMem000549fc) || (uMem00054a00 < _DAT_0080967c)) {
      uVar18 = func_0x0004e500(_DAT_0080976e,_DAT_00809772);
      if (uMem000549fe <= uVar18) {
LAB_0003c754:
        _DAT_008084e6 = 0;
      }
    }
    else {
LAB_0003c728:
      _DAT_008084e6 = uMem00054a22;
    }
  }
  if (((_DAT_008088d6 & 8) == 0) && (_DAT_008088ca != 0)) {
    if (_DAT_0080826e == 0) {
      _DAT_00809750 = _DAT_00809750 & 0xfeff;
    }
    else {
      _DAT_00809750 = _DAT_00809750 | 0x100;
    }
  }
  else {
    _DAT_00809750 = _DAT_00809750 | 0x100;
    _DAT_0080826e = sMem00054a0e;
  }
  if (_DAT_0080967a < _DAT_0080967e) {
    if ((cMem00063b21 != '\0') ||
       (_DAT_0080967e = func_0x0004e500(_DAT_0080967e,_DAT_0080a83c), _DAT_0080967e < _DAT_0080967a)
       ) goto LAB_0003c7f0;
  }
  else {
    _DAT_0080967e = func_0x0004db80(_DAT_0080967e,_DAT_0080a83c);
    if (_DAT_0080967a <= _DAT_0080967e) {
LAB_0003c7f0:
      _DAT_0080967e = _DAT_0080967a;
    }
  }
  if (_DAT_0080967c < _DAT_00809680) {
    if ((cMem00063b21 != '\0') ||
       (_DAT_00809680 = func_0x0004e500(_DAT_00809680,_DAT_0080a83c), _DAT_00809680 < _DAT_0080967c)
       ) goto LAB_0003c854;
  }
  else {
    _DAT_00809680 = func_0x0004db80(_DAT_00809680,_DAT_0080a83c);
    if (_DAT_0080967c <= _DAT_00809680) {
LAB_0003c854:
      _DAT_00809680 = _DAT_0080967c;
    }
  }
  if (_DAT_0080a850 < _DAT_0080a852) {
    uVar18 = _DAT_0080a852 - _DAT_0080a850;
  }
  else {
    uVar18 = _DAT_0080a850 - _DAT_0080a852;
  }
  if (uVar18 < uMem00054a1e) {
    _DAT_00809750 = _DAT_00809750 & 0xfdff;
  }
  else {
    _DAT_00809750 = _DAT_00809750 | 0x200;
  }
  func_0x0003dba4(_DAT_0080a850,0,0x4000);
  func_0x0003dba4(_DAT_0080a852,1,0x1000);
  func_0x0003e2b8();
  if ((_DAT_00808846 & 0x2000) != 0) {
    if (_DAT_008080b8 == 0) {
      _DAT_0080a894 = 0;
      _DAT_0080a898 = 0;
    }
    else if (((_DAT_0080a512 & 4) == 0) || ((_DAT_0080a3ee & 0x20) != 0)) {
      _DAT_0080a898 = 0xffff;
    }
    else {
      uVar7 = func_0x0004dd1c(_DAT_0080a89c,5,0x240);
      uVar4 = func_0x0004dba0(_DAT_0080a894,uVar7);
      iVar21 = func_0x0004e518(0xffff,1);
      if ((uint)(iVar21 << 3) < uVar4) {
        uVar4 = func_0x0004e518(uVar4,iVar21 << 3);
      }
      _DAT_0080a898 = (undefined2)(uVar4 >> 3);
      _DAT_0080a894 = uVar4;
    }
    _DAT_0080a89a = _DAT_0080a898;
    func_0x00079474();
    if (_DAT_00809c24 != 0) {
      _DAT_00809c24 = _DAT_00809c24 + -1;
    }
    if (_DAT_00809c24 == 0) {
      func_0x00079478();
      _DAT_00809c24 = sMem00054256;
    }
  }
  func_0x0004dd6c(_DAT_0080a840,_DAT_0080a838);
  _DAT_0080a85e = func_0x0004dd6c(_DAT_0080a83a);
  func_0x0004dd6c(_DAT_0080a83e,_DAT_0080a838);
  _DAT_0080a85c = func_0x0004dd6c(_DAT_0080a83a);
  uVar7 = func_0x0004e4a4(_DAT_0080a852,0x100);
  uVar11 = func_0x0004dc14(_DAT_0080a862);
  func_0x0004dba0(uVar7,uVar11);
  _DAT_0080a862 = func_0x0004e050((uint)_DAT_0080a85e << 8,_DAT_0080a844);
  _DAT_0080a862 = _DAT_0080a862 & 0xff;
  _DAT_0080a852 = func_0x0004df68(0x100);
  uVar7 = func_0x0004e4a4(_DAT_0080a850,0x100);
  uVar11 = func_0x0004dc14(_DAT_0080a860);
  func_0x0004dba0(uVar7,uVar11);
  _DAT_0080a860 = func_0x0004e050((uint)_DAT_0080a85c << 8,_DAT_0080a842);
  _DAT_0080a860 = _DAT_0080a860 & 0xff;
  _DAT_0080a850 = func_0x0004df68(0x100);
  _DAT_0080862e = _TMS1CT - sVar22;
LAB_0003ca60:
  if ((_DAT_00808fae & 0x1f) == 0) {
    sVar22 = _TMS1CT;
    if ((_DAT_00808846 & 0x2000) != 0) {
      func_0x0007947c();
    }
    _DAT_00808630 = _TMS1CT - sVar22;
  }
  sVar22 = _TMS1CT;
  func_0x000a62b0();
  if ((_DAT_008088d6 & 0x11) != 0) {
    _DAT_0080807c = 0;
  }
  if (((_DAT_00808676 & 1) != 0) && ((_DAT_008088d6 & 1) == 0)) {
    _DAT_00808676 = _DAT_00808676 | 2;
  }
  if (((_DAT_00808676 & 2) == 0) || ((_DAT_008088d6 & 1) != 0)) {
    _DAT_008086ee = 0;
    _DAT_00808676 = _DAT_00808676 & 0xfffd;
    sVar12 = _DAT_008086ee;
  }
  else {
    sVar12 = _DAT_008086ee + 1;
    if (_DAT_008086ee == -1) {
      sVar12 = _DAT_008086ee;
    }
  }
  _DAT_008086ee = sVar12;
  if ((_DAT_008086ee == 3) && ((_DAT_00808672 & 5) == 0)) {
    DAT_00808679 = DAT_00808679 | 1;
    if (cMem000503bf == '\0') {
      func_0x0000ba78();
    }
    _DAT_00808676 = _DAT_00808676 & 0xfffd;
    DAT_00808679 = DAT_00808679 & 0xfe;
  }
  if ((_DAT_008088d6 & 1) == 0) {
    _DAT_00808676 = _DAT_00808676 & 0xfffe;
  }
  else {
    _DAT_00808676 = _DAT_00808676 | 1;
  }
  func_0x0000bf9c();
  func_0x0000c1a0();
  uVar18 = _DAT_008086e4 + 1;
  if (_DAT_008086e4 == 0xffff) {
    uVar18 = _DAT_008086e4;
  }
  _DAT_008086e4 = uVar18;
  if ((((_DAT_00808676 & 8) == 0) || (uVar18 = _DAT_008086e8, _DAT_008086e8 < 0x50)) &&
     (uVar18 = _DAT_008086e8 + 1, _DAT_008086e8 == 0xffff)) {
    uVar18 = _DAT_008086e8;
  }
  _DAT_008086e8 = uVar18;
  _DAT_00808676 = _DAT_00808676 & 0xfff7;
  if (((((_DAT_00808672 & 0x100) != 0) && ((_DAT_00808672 & 1) != 0)) ||
      (((_DAT_00808672 & 0x1000) != 0 && ((_DAT_00808672 & 1) == 0)))) || (0x4f < _DAT_008086e4)) {
    func_0x000a3c98(0x8638,1);
    _DAT_00808676 = _DAT_00808676 | 8;
    if ((_DAT_00808672 & 1) != 0) {
      DAT_00808679 = DAT_00808679 | 2;
      if (cMem000503bf == '\0') {
        func_0x0000ba78();
      }
      DAT_00808679 = DAT_00808679 & 0xfd;
    }
    _DAT_008086e4 = 0;
  }
  if (((_DAT_00808676 & 8) == 0) &&
     (((((_DAT_00808672 & 0x400) != 0 && ((_DAT_00808672 & 4) != 0)) ||
       (((_DAT_00808672 & 0x4000) != 0 && ((_DAT_00808672 & 4) == 0)))) || (0x4f < _DAT_008086e8))))
  {
    if ((_DAT_00808844 & 2) != 0) {
      func_0x000a41cc(0x8638,1);
    }
    if ((_DAT_00808672 & 4) != 0) {
      DAT_00808679 = DAT_00808679 | 8;
      if (cMem000503bf == '\0') {
        func_0x0000ba78();
      }
      DAT_00808679 = DAT_00808679 & 0xf7;
    }
    _DAT_008086e8 = 0;
  }
  uVar18 = _DAT_00808676;
  _DAT_00808676 = _DAT_00808676 & 0xfffb;
  if ((_DAT_0080a91a & 1) == 0) {
    _DAT_00808672 = _DAT_00808672 & 0xfeff;
  }
  else {
    _DAT_0080a91a = _DAT_0080a91a & 0xfffe;
    _DAT_00808672 = _DAT_00808672 | 0x100;
  }
  if ((_DAT_0080a91a & 4) == 0) {
    if ((uVar18 & 8) == 0) {
      _DAT_00808672 = _DAT_00808672 & 0xfbff;
    }
  }
  else {
    _DAT_0080a91a = _DAT_0080a91a & 0xfffb;
    _DAT_00808672 = _DAT_00808672 | 0x400;
  }
  if ((_DAT_0080a91a & 0x10) == 0) {
    _DAT_00808672 = _DAT_00808672 & 0xefff;
  }
  else {
    _DAT_0080a91a = _DAT_0080a91a & 0xffef;
    _DAT_00808672 = _DAT_00808672 | 0x1000;
  }
  if ((_DAT_0080a91a & 0x40) == 0) {
    if ((uVar18 & 8) == 0) {
      _DAT_00808672 = _DAT_00808672 & 0xbfff;
    }
  }
  else {
    _DAT_0080a91a = _DAT_0080a91a & 0xffbf;
    _DAT_00808672 = _DAT_00808672 | 0x4000;
  }
  if (cMem000503bf != '\0') {
    func_0x0003e660(0x8638);
  }
  _DAT_00808624 = (_DAT_00808624 + _TMS1CT) - sVar22;
  func_0x00045bec();
  func_0x00041410();
  sVar22 = _TMS1CT;
  if (((DAT_00809626 & 4) == 0) || ((_DAT_00808d5e & 0x80) != 0)) {
    *(byte *)(iMem00000e84 + 1) = *(byte *)(iMem00000e84 + 1) & 0xfe;
  }
  else {
    *(byte *)(iMem00000e84 + 1) = *(byte *)(iMem00000e84 + 1) | 1;
  }
  func_0x000001e0();
  func_0x000a9cd0();
  if ((_DAT_00808fae & 1) == 0) {
    func_0x000aa694();
  }
  _DAT_00808624 = (_DAT_00808624 + _TMS1CT) - sVar22;
  _DAT_00808622 = _DAT_00808624;
  return;
}


