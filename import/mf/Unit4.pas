unit Unit4;

interface

uses
  Windows, Messages, SysUtils, Classes, Graphics, Controls, Forms, Dialogs,
  Buttons, ComCtrls, StdCtrls, DB, dbTables;

type
  TForm4 = class(TForm)
    Label1: TLabel;
    MonthCalendar1: TMonthCalendar;
    SpeedButton1: TSpeedButton;
    Table1: TTable;
    procedure SpeedButton1Click(Sender: TObject);
  private
    { Private declarations }
  public
  function AdaugaSubtotaluri(sursa:TDataset;cimp:string;cimpsortare:string;cimpsubtotal:string):TDataSet;
    { Public declarations }
  end;

var
  Form4: TForm4;

implementation
uses unit1;

{$R *.DFM}

function TForm4.AdaugaSubtotaluri(sursa: TDataset;
  cimp: string;cimpsortare:string;cimpsubtotal:string): TDataSet;
  var
  i:byte;
   v:variant;
   ss,t:currency;
 //sd:TDatasource;
  begin
  // tabel:=TTable.Create(form4);
    table1.Active:=false;
     table1.TableType:=ttFoxpro;
   table1.TableName:=getcurrentdir()+'\xxx.dbf' ;

     table1.FieldDefs.Clear;
    for i:=1 to sursa.fields.count do
    begin

    table1.FieldDefs.AddFieldDef;
    table1.FieldDefs.items[i-1]:=sursa.FieldDefs.Items[i-1];
    end;
    sursa.First;
    v:=sursa.fieldbyname(cimpsortare).value;
    ss:=0;
    t:=0;
    table1.CreateTable;

    table1.active:=true;
    while not sursa.eof do
    begin
    if sursa.fieldbyname(cimpsortare).value=v then
    begin
     table1.append;
     table1.post;
     table1.last;
     table1.edit;
     for i:=1 to sursa.fields.count do
    begin
     table1.Fields[i-1].Value:=sursa.Fields[i-1].Value;
     end;
     table1.post;
     ss:=ss+sursa.fieldbyname(cimp).value;
     end
     else
     begin
       table1.append;
     table1.post;
     table1.last;
     table1.edit;

     table1.fieldbyname(cimpsubtotal).Value:='Subtotal '+cimpsortare+' : '+v;
     table1.fieldbyname(cimp).value:=ss;
     table1.post;
      v:=sursa.fieldbyname(cimpsortare).value;
      ss:=sursa.fieldbyname(cimp).value;
     end;
     t:=t+sursa.fieldbyname(cimp).value;
    sursa.next;
    end;
          table1.append;
     table1.post;
     table1.last;
     table1.edit;

     table1.fieldbyname(cimpsubtotal).Value:='Subtotal '+cimpsortare+' : '+v;
     table1.fieldbyname(cimp).value:=ss;
     table1.post;
            table1.append;
     table1.post;
     table1.last;
     table1.edit;

     table1.fieldbyname(cimpsubtotal).Value:='Total general : ';
     table1.fieldbyname(cimp).value:=t;
     table1.post;  
 //  366023677 table1.CreateTable;
  // table1.active:=true;
    Result:=table1;
end;

procedure TForm4.SpeedButton1Click(Sender: TObject);
var
dif,diff:integer;
S:CURRENCY;
YEAR,MONTH,DAY,y,m,d:WORD;
begin
dif:=round((monthcalendar1.date-strtodate('01/01/2004')+1)/30);
//showmessage(inttostr(dif));
form1.table4.active:=false;
form1.table4.emptytable;
form1.table4.active:=true;
form1.table3.first;
s:=0;
while not form1.table3.eof do
begin
      if form1.table3['c']<>'O.I.' then
      begin
          if form1.table3['n19']>0 then
          begin
              form1.table4.append;
              form1.table4.post;
              form1.table4.last;
              form1.table4.edit;
              form1.table4['a']:=form1.table3['a'];
              form1.table4['b']:=form1.table3['b'];
              form1.table4['c']:=form1.table3['c'];
              form1.table4['d']:=form1.table3['d'];
              form1.table4['n5']:=form1.table3['n5'];
              form1.table4['n6']:=form1.table3['n6'];
              form1.table4['n7']:=form1.table3['n7'];
              form1.table4['n8']:=form1.table3['n8'];
              form1.table4['n9']:=form1.table3['n9'];
              form1.table4['n19']:=form1.table3['n19'];
              form1.table4['n20']:=form1.table3['n20'];
              form1.table4['n21']:=form1.table3['n21'];
              form1.table4['GRUPA']:=form1.table3['grupa'];
              if dif > form1.table3['n8'] then
              begin
             // form1.table4.edit;
             form1.table4['al']:=0;
             s:=s+form1.table4['al'];
              form1.table4['nrl']:=form1.table3['n8'] ;
              form1.table4['ac']:=form1.table4['al']*form1.table4['nrl'];
              form1.table4['ar']:=form1.table4['n19']-form1.table4['ac'] ;
            //  form1.table4.post;
              end
              else
              begin

              //  form1.table4.edit;
              form1.table4['al']:=form1.table3['n19']/form1.table3['n8'] ;
              s:=s+form1.table4['al'];
              decodedate(form1.TABLE4['D'],year,month,day);
              decodedate(now,y,m,d);
              DIFF:=round((monthcalendar1.date-form1.TABLE4['D']+1)/30);
              IF year=y then
              form1.table4['nrl']:=diff
              else
              form1.table4['nrl']:=dif;
              form1.table4['ac']:=form1.table4['al']*form1.table4['nrl'];
              form1.table4['ar']:=form1.table4['n19']-form1.table4['ac'] ;
             // form1.table4.post;
              end;
              form1.table4.post;

          end;

      end;

form1.table3.next;
end;
form1.Query2.Active:=false;
form1.Query2.sql.clear;
form1.Query2.sql.Add('SELECT A, B, C, D, N5, N6, N7, N8, N9, N19, N20, N21, AL, NRL, AC, AR, GRUPA');
form1.Query2.sql.Add('FROM "'+form1.table4.TableName+'"');
form1.Query2.sql.Add('ORDER BY GRUPA');
form1.query2.Active:=true;

form4.close;
//form1.dbgrid1.DataSource:=form1.datasource5;
form1.datasource5.dataset:=adaugasubtotaluri(form1.Query2,'al','grupa','a');
form1.dbgrid1.DataSource:=form1.datasource5;
form1.dbnavigator1.DataSource:=form1.datasource5;
form1.tag:=1;
form1.StatusBar1.Panels[0].text:='Amortizare lunara - total : '+floattostr(s);
end;

end.
