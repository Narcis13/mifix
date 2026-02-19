object Form4: TForm4
  Left = 248
  Top = 186
  Width = 293
  Height = 220
  Caption = 'Amortizare mijloace fixe'
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'MS Sans Serif'
  Font.Style = []
  OldCreateOrder = False
  Position = poDesktopCenter
  PixelsPerInch = 96
  TextHeight = 13
  object Label1: TLabel
    Left = 32
    Top = 8
    Width = 237
    Height = 13
    Caption = 'Selecteaza data la care se calculeaza amortizarea'
  end
  object SpeedButton1: TSpeedButton
    Left = 232
    Top = 24
    Width = 41
    Height = 153
    Caption = 'OK'
    Flat = True
    OnClick = SpeedButton1Click
  end
  object MonthCalendar1: TMonthCalendar
    Left = 24
    Top = 24
    Width = 197
    Height = 153
    Date = 38055
    TabOrder = 0
  end
  object Table1: TTable
    Left = 8
    Top = 32
  end
end
