object Frm1: TFrm1
  Left = 192
  Top = 114
  Width = 696
  Height = 480
  Caption = 'Rapoarte Ophelia 1.0'
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'MS Sans Serif'
  Font.Style = []
  Menu = MainMenu1
  OldCreateOrder = False
  OnDeactivate = FormDeactivate
  PixelsPerInch = 96
  TextHeight = 13
  object Memo1: TMemo
    Left = 0
    Top = 0
    Width = 688
    Height = 426
    Align = alClient
    Font.Charset = ANSI_CHARSET
    Font.Color = clWindowText
    Font.Height = -13
    Font.Name = 'Lucida Console'
    Font.Style = []
    ParentFont = False
    TabOrder = 0
  end
  object Memo2: TMemo
    Left = 448
    Top = 200
    Width = 185
    Height = 89
    TabOrder = 1
    Visible = False
    WordWrap = False
  end
  object Memo3: TMemo
    Left = 8
    Top = 0
    Width = 65
    Height = 49
    TabOrder = 2
    Visible = False
    WordWrap = False
  end
  object Memo4: TMemo
    Left = 8
    Top = 56
    Width = 121
    Height = 41
    TabOrder = 3
    Visible = False
    WordWrap = False
  end
  object Memo5: TMemo
    Left = 72
    Top = 136
    Width = 89
    Height = 33
    TabOrder = 4
    Visible = False
    WordWrap = False
  end
  object Memo6: TMemo
    Left = 88
    Top = 224
    Width = 121
    Height = 33
    TabOrder = 5
    Visible = False
    WordWrap = False
  end
  object Memo7: TMemo
    Left = 368
    Top = 72
    Width = 113
    Height = 41
    TabOrder = 6
    Visible = False
    WordWrap = False
  end
  object Memo8: TMemo
    Left = 64
    Top = 320
    Width = 145
    Height = 33
    TabOrder = 7
    Visible = False
    WordWrap = False
  end
  object Memo9: TMemo
    Left = 256
    Top = 288
    Width = 97
    Height = 33
    TabOrder = 8
    Visible = False
    WordWrap = False
  end
  object Memo10: TMemo
    Left = 264
    Top = 168
    Width = 185
    Height = 89
    TabOrder = 9
    Visible = False
    WordWrap = False
  end
  object MainMenu1: TMainMenu
    Left = 184
    Top = 128
    object Rapoarte1: TMenuItem
      Caption = 'Rapoarte'
      object Raportnou1: TMenuItem
        Caption = 'Raport nou...'
        OnClick = Raportnou1Click
      end
      object N1: TMenuItem
        Caption = '-'
      end
      object Exit1: TMenuItem
        Caption = 'Exit'
        OnClick = Exit1Click
      end
    end
  end
  object Table1: TTable
    Active = True
    TableName = 'c:\c\nf.dbf'
    Left = 256
    Top = 40
  end
end
