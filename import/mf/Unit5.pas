unit Unit5;

interface

uses
  Windows, Messages, SysUtils, Classes, Graphics, Controls, Forms, Dialogs,
  Db, ComCtrls, ExtCtrls, DBCtrls, Grids, DBGrids, StdCtrls, DBTables;

type
  TForm5 = class(TForm)
    Table1: TTable;
    Label1: TLabel;
    Edit1: TEdit;
    Label2: TLabel;
    Edit2: TEdit;
    Label3: TLabel;
    ComboBox1: TComboBox;
    Label4: TLabel;
    DateTimePicker1: TDateTimePicker;
    Label5: TLabel;
    Edit3: TEdit;
    Label6: TLabel;
    Edit4: TEdit;
    Label7: TLabel;
    Edit5: TEdit;
    Label8: TLabel;
    Label9: TLabel;
    Button1: TButton;
    ListBox1: TListBox;
    DBGrid1: TDBGrid;
    DBNavigator1: TDBNavigator;
    StatusBar1: TStatusBar;
    DataSource1: TDataSource;
    ComboBox2: TComboBox;
    ComboBox3: TComboBox;
    Button2: TButton;
    Label10: TLabel;
    Edit6: TEdit;
    CheckBox1: TCheckBox;
    procedure FormActivate(Sender: TObject);
    procedure FormDeactivate(Sender: TObject);
    procedure ComboBox1Change(Sender: TObject);
    procedure Edit1KeyPress(Sender: TObject; var Key: Char);
    procedure Edit2KeyPress(Sender: TObject; var Key: Char);
    procedure Edit3KeyPress(Sender: TObject; var Key: Char);
    procedure Edit5KeyPress(Sender: TObject; var Key: Char);
    procedure ComboBox2Change(Sender: TObject);
    procedure Button1Click(Sender: TObject);
    procedure Edit2Exit(Sender: TObject);
    procedure Button2Click(Sender: TObject);
    procedure ComboBox2KeyPress(Sender: TObject; var Key: Char);
    procedure ComboBox3KeyPress(Sender: TObject; var Key: Char);
    procedure Edit2Change(Sender: TObject);
    procedure DateTimePicker1KeyPress(Sender: TObject; var Key: Char);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  Form5: TForm5;
  v1,v2,v3,v4,v5,v6,v7,v8,v9,v10,v11,v12,v13,v14:currency;
implementation
uses unit1;
{$R *.DFM}

procedure TForm5.FormActivate(Sender: TObject);
begin
checkbox1.checked:=false;
combobox1.Items.Clear;
combobox2.Items.Clear;
combobox3.Items.Clear;
dbgrid1.DataSource:=nil;
button2.Caption:='Adauga';
form1.Table3.First;
while not form1.Table3.eof do
begin
if combobox2.Items.IndexOf(form1.Table3.Fieldbyname('n20').AsString)=-1 then
begin
combobox2.items.Add(form1.Table3.Fieldbyname('n20').AsString);

end;
if combobox3.Items.IndexOf(form1.Table3.Fieldbyname('n21').AsString)=-1 then
begin
combobox3.items.Add(form1.Table3.Fieldbyname('n21').AsString);

end;

form1.Table3.next;
end;
table1.Active:=false;
table1.TableName:=getcurrentdir()+'\clasific.dbf';
table1.active:=true  ;
table1.first;
while not table1.eof do
begin
combobox1.Items.Add(table1['cod']);

table1.Next;
end;
 dbgrid1.DataSource:=datasource1;
end;

procedure TForm5.FormDeactivate(Sender: TObject);
begin
table1.active:=false;
end;

procedure TForm5.ComboBox1Change(Sender: TObject);
begin
table1.Locate('cod',combobox1.text,[locaseinsensitive]);
statusbar1.Panels[0].text:=table1['denumire'];
edit4.text:=inttostr(table1['durata']*12);

Form5.FocusControl(datetimepicker1);


end;

procedure TForm5.Edit1KeyPress(Sender: TObject; var Key: Char);
begin
If Inttostr( Ord(key))='13' then
begin
Form5.FocusControl(edit2);

end;
end;

procedure TForm5.Edit2KeyPress(Sender: TObject; var Key: Char);
begin
if checkbox1.Checked then
begin
if Inttostr( Ord(key))='13' then
begin
listbox1.Items.Clear;
edit1.text:=form1.table3['a'];
combobox1.text:=form1.table3['c'];
datetimepicker1.date:=form1.table3['d'];
 edit4.text:=form1.table3['n6'];
 edit3.text:=form1.table3['n5'];
 edit5.text:=form1.table3['n15'];
 combobox2.text:=form1.table3['n20'];
 combobox3.text:=form1.table3['n21'];
 form5.focuscontrol(edit1);
// checkbox1.Checked:=false;
end;
end
else
begin

if Inttostr( Ord(key))='13' then
begin
Form5.FocusControl(combobox1);

end;
end;
end;

procedure TForm5.Edit3KeyPress(Sender: TObject; var Key: Char);
begin
If Inttostr( Ord(key))='13' then
begin
Form5.FocusControl(edit5);

end;
end;

procedure TForm5.Edit5KeyPress(Sender: TObject; var Key: Char);
begin
If Inttostr( Ord(key))='13' then
begin
Form5.FocusControl(combobox2);

end;
end;

procedure TForm5.ComboBox2Change(Sender: TObject);
begin

Form5.FocusControl(combobox3);


end;

procedure TForm5.Button1Click(Sender: TObject);
var
dif:integer;
year,month,day,year1,month1,day1:word;
begin
if checkbox1.checked then button2.Caption:='Modifica' else button2.caption:='Adauga';
button2.enabled:=true;
decodedate(datetimepicker1.date,year,month,day);

if datetimepicker1.Date< strtodate('31/12/2003') then
dif:=(2003-YEAR)*12+(12-MONTH)
else
dif:=0;
listbox1.Items.clear;
v1:=dif;
if strtoint(edit4.text)<dif then
v2:=0
else
v2:=strtoint(edit4.text)-dif;
if v2=0 then v3:=1 else v3:=strtofloat(floattostrf(v1/strtoint(edit4.text),ffnumber,2,2));
v4:=round(v3*strtoFLOAT(edit3.text));
v5:=strtofloat(edit3.text)-v4;
if year<=1999 then v6:=3.9;
if year=2000 then v6:=2.7;
if year=2001 then v6:=1.8;
if year=2002 then v6:=1;
if year>=2003 then v6:=1;
if v2=0 then v6:=0;
if edit6.text<>'' then v6:=strtofloat(edit6.text);
v7:=round(v6*strtoFLOAT(edit3.text));
if v7=0 then v8:=0 else v8:=v7-strtofloat(edit3.text);
v10:=v8+strtoint(edit5.text);
v11:=round(v10*v3);
v12:=v10-v11;
v13:=v12+v5;
if v2=0 then v14:=strtofloat(edit3.text) else v14:=strtofloat(edit3.text)+v10;
listbox1.items.add('Durata normala de utilizare consumata la 31.12.2003 : '+floattostr(v1));
listbox1.items.add('Durata normala de utilizare ramasa la 31.12.2003 : '+floattostr(v2));
listbox1.items.add('Grad de utilizare : '+floattostr(v3));
listbox1.items.add('Valoarea aferenta duratei consumate : '+floattostr(v4));
listbox1.items.add('Valoarea aferenta duratei ramase : '+floattostr(v5));
listbox1.items.add('Coeficient de actualizare : '+floattostr(v6));
listbox1.items.add('Valoarea de inregistrare in contabilitate actualizata : '+floattostr(v7));
listbox1.items.add('Diferente din reevaluare : '+floattostr(v8));
listbox1.items.add('Diferente de inregistrat in contabilitate la 31.12.2003 : '+floattostr(v10));
listbox1.items.add('Diferente de inregistrat aferente duratei consumate : '+floattostr(v11));
listbox1.items.add('Diferente de inregistrat aferente duratei ramase : '+floattostr(v12));
listbox1.items.add('Valoarea de amortizat : '+floattostr(v13));
listbox1.items.add('Valoarea finala : '+floattostr(v14));


Form5.FocusControl(button2);


end;

procedure TForm5.Edit2Exit(Sender: TObject);
begin
if ((not checkbox1.checked) and (edit2.text<>'')) then
begin
if form1.Table3.Locate('B',strtoint(edit2.text),[locaseinsensitive]) then
begin
showmessage('Acest numar de inventar mai exista!!!');
edit2.text:='';
Form5.FocusControl(edit1);
form1.table3.last;

end;
 end;
end;

procedure TForm5.Button2Click(Sender: TObject);
begin
if checkbox1.Checked then
begin
if ((edit1.text<>'') and (edit2.text<>'') and (combobox1.text<>'')) then
begin

form1.table3.edit;
form1.table3['a']:=edit1.text;
form1.table3['b']:=strtoint(edit2.text);
form1.table3['c']:=combobox1.text;
form1.table3['d']:=datetimepicker1.date;
form1.table3['n5']:=strtoFLOAT(edit3.text);
form1.table3['n6']:=strtoint(edit4.text);
form1.table3['n7']:=v1;
form1.table3['n8']:=v2;
form1.table3['n9']:=v3;
form1.table3['n10']:=v4;
form1.table3['n11']:=v5;
form1.table3['n12']:=v6;
form1.table3['n13']:=v7;
form1.table3['n14']:=v8;
form1.table3['n15']:=strtoint(edit5.text);
form1.table3['n16']:=v10;
form1.table3['n17']:=v11;
form1.table3['n18']:=v12;
form1.table3['n19']:=v13;
form1.table3['n20']:=combobox2.text;
form1.table3['n21']:=combobox3.text;
form1.table3['n22']:=v14;
form1.table3['grupa']:=copy(combobox1.text,1,1);
form1.table3.post;

//curatare
              edit1.text:='';
              edit2.text:='';
          //    combobox1.text:='';
          //    combobox2.text:='';
          //    combobox3.text:='';
       //       edit6.text:='';
              edit3.text:='0';
              edit5.text:='0';
              button2.enabled:=false;
              combobox2.Items.Clear;
              listbox1.items.clear;
combobox3.Items.Clear;
dbgrid1.DataSource:=nil;

form1.Table3.First;
while not form1.Table3.eof do
begin
if combobox2.Items.IndexOf(form1.Table3.Fieldbyname('n20').AsString)=-1 then
begin
combobox2.items.Add(form1.Table3.Fieldbyname('n20').AsString);

end;
if combobox3.Items.IndexOf(form1.Table3.Fieldbyname('n21').AsString)=-1 then
begin
combobox3.items.Add(form1.Table3.Fieldbyname('n21').AsString);

end;

form1.Table3.next;
end;
dbgrid1.DataSource:=datasource1;
FORM5.FocusControl(EDIT1);
//sf cvuratate

end
else
begin
showmessage('Informatii incomplete !!!');
form5.focuscontrol(edit1);
end;
end
else
begin
if ((edit1.text<>'') and (edit2.text<>'') and (combobox1.text<>'')) then
begin
form1.table3.Append;
form1.table3.post;
form1.table3.last;
form1.table3.edit;
form1.table3['a']:=edit1.text;
form1.table3['b']:=strtoint(edit2.text);
form1.table3['c']:=combobox1.text;
form1.table3['d']:=datetimepicker1.date;
form1.table3['n5']:=strtofloat(edit3.text);
form1.table3['n6']:=strtoint(edit4.text);
form1.table3['n7']:=v1;
form1.table3['n8']:=v2;
form1.table3['n9']:=v3;
form1.table3['n10']:=v4;
form1.table3['n11']:=v5;
form1.table3['n12']:=v6;
form1.table3['n13']:=v7;
form1.table3['n14']:=v8;
form1.table3['n15']:=strtoint(edit5.text);
form1.table3['n16']:=v10;
form1.table3['n17']:=v11;
form1.table3['n18']:=v12;
form1.table3['n19']:=v13;
form1.table3['n20']:=combobox2.text;
form1.table3['n21']:=combobox3.text;
form1.table3['n22']:=v14;
form1.table3['grupa']:=copy(combobox1.text,1,1);
form1.table3.post;

//curatare
              edit1.text:='';
              edit2.text:='';
          //    combobox1.text:='';
          //    combobox2.text:='';
          //    combobox3.text:='';
         //     edit6.text:='';
              edit3.text:='0';
              edit5.text:='0';
              button2.enabled:=false;
              combobox2.Items.Clear;
combobox3.Items.Clear;
   listbox1.items.clear;
dbgrid1.DataSource:=nil;

form1.Table3.First;
while not form1.Table3.eof do
begin
if combobox2.Items.IndexOf(form1.Table3.Fieldbyname('n20').AsString)=-1 then
begin
combobox2.items.Add(form1.Table3.Fieldbyname('n20').AsString);

end;
if combobox3.Items.IndexOf(form1.Table3.Fieldbyname('n21').AsString)=-1 then
begin
combobox3.items.Add(form1.Table3.Fieldbyname('n21').AsString);

end;

form1.Table3.next;
end;
dbgrid1.DataSource:=datasource1;
FORM5.FocusControl(EDIT1);
//sf cvuratate

end
else
begin
showmessage('Informatii incomplete !!!');
form5.focuscontrol(edit1);
end;
end;
checkbox1.Checked:=false;
end;

procedure TForm5.ComboBox2KeyPress(Sender: TObject; var Key: Char);
begin
If Inttostr( Ord(key))='13' then
begin
Form5.FocusControl(combobox3);

end;
end;

procedure TForm5.ComboBox3KeyPress(Sender: TObject; var Key: Char);
begin
If Inttostr( Ord(key))='13' then
begin
Form5.FocusControl(BUTTON1);

end;
end;

procedure TForm5.Edit2Change(Sender: TObject);
begin
if ((checkbox1.Checked) and (edit2.text<>'')) then
begin
form1.table3.Locate('b',edit2.text,[loPartialKey])
end;
end;

procedure TForm5.DateTimePicker1KeyPress(Sender: TObject; var Key: Char);
begin
If Inttostr( Ord(key))='13' then
begin
Form5.FocusControl(edit3);

end;
end;

end.
