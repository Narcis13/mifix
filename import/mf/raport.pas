unit raport;

interface

uses
  Windows, Messages, SysUtils, Classes, Graphics, Controls, Forms, Dialogs,
  Db, DBTables, StdCtrls, Menus;

type
  Tbanda=record
   id:string;
   linii:TStrings;
  end;
  Tcimp=record
      tip:string;
      aliniament:string;
      comanda:string;
      cimpdate:string;
      start:byte;
      stop:byte;
      idBanda:string;
      id:string;
  end;
  TCimpuri=array[1..70] of TCimp;
  TParametrii=array[1..30] of TCimp;
  TRaport=class(TObject)
  AntetRaport:TBanda;
  AntetPagina:TBanda;
  CapTabel:TBanda;
  SubsolPagina:TBanda;
  SubsolRaport:TBanda;
  Detalii:TBanda;
  SumarDetalii:TBanda;
  Cimpuri:TCimpuri;
  P:TParametrii;
  Sursa:string;
  caleraport:string;
  parametrii:string;
  Sursadate:Tdataset;
  script:TStrings;
  Rezultat:TStrings;
  Numarlinii:byte;
  Numarcimpuri:byte;
  nparametrii:byte;
  procedure Initializare(srs:string);
  procedure Raportnou(sd:Tdataset;locatie:string;m:Tmemo;cale:string;param:string);
  procedure ExecutaRaport;
  function Aliniaza(st:string;tip:string;p1:byte):string;
  private
  public
  end;

  TFrm1 = class(TForm)
    MainMenu1: TMainMenu;
    Rapoarte1: TMenuItem;
    Raportnou1: TMenuItem;
    N1: TMenuItem;
    Exit1: TMenuItem;
    Memo1: TMemo;
    Table1: TTable;
    Memo2: TMemo;
    Memo3: TMemo;
    Memo4: TMemo;
    Memo5: TMemo;
    Memo6: TMemo;
    Memo7: TMemo;
    Memo8: TMemo;
    Memo9: TMemo;
    Memo10: TMemo;
    procedure Exit1Click(Sender: TObject);
    procedure Raportnou1Click(Sender: TObject);
    procedure FormDeactivate(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  Frm1: TFrm1;

implementation

{$R *.DFM}

procedure TFrm1.Exit1Click(Sender: TObject);
begin
frm1.close;

end;

{ TRaport }



function TRaport.Aliniaza(st, tip: string; p1: byte): string;
var
s,sr,sl:string     ;
i:byte;
begin
if tip='L' then
begin
   s:=copy(st,1,p1);
   if length(s)<p1 then
   begin
   for i:=1 to p1-length(s) do
   begin
   s:=s+' ';
   end;
   Result:=s;
   end
   else
   begin
   Result:=s;
   end;
end;
if tip='R' then
begin
   s:=copy(st,1,p1);
   sr:='';
   if length(s)<p1 then
   begin
   for i:=1 to p1-length(s) do
   begin
   sr:=' '+sr;
   end;
   Result:=sr+s;
   end
   else
   begin
   Result:=s;
   end;
end;
if tip='C' then
begin
   s:=copy(st,1,p1);
   sr:='';
   sl:='';
   if length(s)<p1 then
   begin
   for i:=1 to p1-length(s) do
   begin
   if odd(i) then
   sr:=' '+sr
   else
   sl:=sl+' ';
   end;
   Result:=sl+s+sr;
   end
   else
   begin
   Result:=s;
   end;
end;
//showmessage(inttostr(length(Result))+' '+Result);
end;

procedure TRaport.ExecutaRaport;
var
i,j,k,g,pi,tp,z,jj:byte;
s,stinga,dreapta,linie:string;
nl,ix,nrcrt,npag:integer;
suma:currency;
begin
Rezultat:=TStrings.Create;
rezultat:=frm1.Memo10.Lines;
//Rezultat.Clear;
 nl:=1;
       for i:=1 to Sumardetalii.linii.Count do
       begin
         for j:=1 to length(Sumardetalii.linii[i-1]) do
         begin
             if copy(Sumardetalii.linii[i-1],j,1)='#' then
             begin
             k:=1;
             s:='';
             while not (copy(Sumardetalii.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(Sumardetalii.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to Numarcimpuri do
             begin
             if cimpuri[g].id=s then
             begin
              cimpuri[g].idBanda:='SD';
              cimpuri[g].start:=j;
             end;
             end;
             end;




         if copy(Sumardetalii.linii[i-1],j,1)='~' then
             begin
             k:=1;
             s:='';
             while not (copy(Sumardetalii.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(Sumardetalii.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to nparametrii do
             begin
             if p[g].id=s then
             begin
              p[g].idBanda:='SD';
              p[g].start:=j;
             end;
             end;
             end;

            end;

     //    Rezultat.Add(AntetRaport.linii[i-1]);
       end;


       for i:=1 to AntetRaport.linii.Count do
       begin
       linie:=AntetRaport.linii[i-1];
         for j:=1 to length(AntetRaport.linii[i-1]) do
         begin
             if copy(AntetRaport.linii[i-1],j,1)='#' then
             begin
             k:=1;
             s:='';
             while not (copy(AntetRaport.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(AntetRaport.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to Numarcimpuri do
             begin
             if cimpuri[g].id=s then
             begin
              cimpuri[g].idBanda:='AR';
              cimpuri[g].start:=j;
             end;
             end;
             end;




          if copy(AntetRaport.linii[i-1],j,1)='~' then
             begin
             k:=1;
             s:='';
             while not (copy(AntetRaport.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(AntetRaport.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to nparametrii do
             begin
             if p[g].id=s then
             begin
              p[g].idBanda:='AR';
              p[g].start:=j;
              delete(linie,p[g].start,p[g].stop-p[g].start+1);
              Insert(Aliniaza(p[g].comanda,p[g].aliniament,p[g].stop-p[g].start+1),linie,p[g].start);
             end;
             end;
             end;

            end;

         Rezultat.Add(linie);
       end;
       nl:=nl+AntetRaport.linii.Count;
     //sf Antet Raport
            npag:=1;
            for i:=1 to AntetPagina.linii.Count do
       begin
       linie:=AntetPagina.linii[i-1];
         for j:=1 to length(AntetPagina.linii[i-1]) do
         begin
             if copy(AntetPagina.linii[i-1],j,1)='~' then
             begin
             k:=1;
             s:='';
             while not (copy(AntetPagina.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(AntetPagina.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to nparametrii do
             begin
             if p[g].id=s then
             begin
              p[g].idBanda:='AP';
              p[g].start:=j;
              delete(linie,p[g].start,p[g].stop-p[g].start+1);
              Insert(Aliniaza(p[g].comanda,p[g].aliniament,p[g].stop-p[g].start+1),linie,p[g].start);
             end;
             end;
             end;



             if copy(AntetPagina.linii[i-1],j,1)='#' then
             begin
             k:=1;
             s:='';
             while not (copy(AntetPagina.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(AntetPagina.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to Numarcimpuri do
             begin
             if cimpuri[g].id=s then
             begin

              cimpuri[g].idBanda:='AP';
              cimpuri[g].start:=j;

              if cimpuri[g].tip='F' then
              begin
                if cimpuri[g].comanda='PAGINA' then
                begin
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(inttostr(npag),cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
                end;
              end
              else
              begin
          //    stinga:=copy(Detalii.linii[i-1],1,j-1);
            //  dreapta:=copy(Detalii.linii[i-1],cimpuri[g].stop+1,length(Detalii.linii[i-1])-cimpuri[g].stop-1);
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
         //     linie:=stinga+Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,'L',cimpuri[g].stop-cimpuri[g].start-1)+dreapta;
             end;
             end;
             end;
             end;
         //    end;
          //   end;


         end;

         Rezultat.Add(linie);
       end;
       nl:=nl+AntetPagina.linii.Count;
       // sf antet pagina
     //  showmessage(inttostr(cimpuri[1].start));

       for i:=1 to CapTabel.linii.Count do
       begin
         for j:=1 to length(CapTabel.linii[i-1]) do
         begin
             if copy(CapTabel.linii[i-1],j,1)='#' then
             begin
             k:=1;
             s:='';
             while not (copy(CapTabel.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(CapTabel.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to Numarcimpuri do
             begin
             if cimpuri[g].id=s then
             begin
              cimpuri[g].idBanda:='CT';
              cimpuri[g].start:=j;
             end;
             end;
             end;


         end;
         Rezultat.Add(CapTabel.linii[i-1]);
       end;
       nl:=nl+CapTabel.linii.Count;
  //   showmessage(inttostr(SubsolPagina.linii.count));

   for i:=1 to SubsolPagina.linii.Count do
       begin
         for j:=1 to length(SubsolPagina.linii[i-1]) do
         begin
             if copy(SubsolPagina.linii[i-1],j,1)='#' then
             begin
             k:=1;
             s:='';
             while not (copy(SubsolPagina.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(SubsolPagina.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to Numarcimpuri do
             begin
             if cimpuri[g].id=s then
             begin
              cimpuri[g].idBanda:='SP';
              cimpuri[g].start:=j;
             end;
             end;
             end;


         end;
   //      Rezultat.Add(SubsolPagina.linii[i-1]);
       end;
 //     nl:=nl+SubsolPagina.linii.Count;

      Sursadate.First;
      ix:=1;

           nrcrt:=1;
      while not sursadate.eof do
      begin

             for i:=1 to Detalii.linii.Count do
             begin
             linie:=Detalii.linii[i-1];
             for j:=1 to length(Detalii.linii[i-1]) do
              begin
             if copy(Detalii.linii[i-1],j,1)='#' then
             begin
             k:=1;
             s:='';
             while not (copy(Detalii.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(Detalii.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to Numarcimpuri do
             begin
             if cimpuri[g].id=s then
             begin
              cimpuri[g].idBanda:='DD';
              cimpuri[g].start:=j;
              if cimpuri[g].tip='F' then
              begin
                if cimpuri[g].comanda='NRCRT' then
                begin
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(inttostr(SursaDate.recno),cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
                end;
              end
              else
              begin
          //    stinga:=copy(Detalii.linii[i-1],1,j-1);
            //  dreapta:=copy(Detalii.linii[i-1],cimpuri[g].stop+1,length(Detalii.linii[i-1])-cimpuri[g].stop-1);
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
         //     linie:=stinga+Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,'L',cimpuri[g].stop-cimpuri[g].start-1)+dreapta;
             end;
             end;
             end;
             end;


             end;
                 //   Rezultat.Add(linie);
                    ix:=ix+1;
                     if nrcrt<=(Numarlinii-nl) then
                     begin
                     Rezultat.Add(linie);
                     nrcrt:=nrcrt+1;
                     end
                     else
                     begin
                     nrcrt:=1;
                     npag:=npag+1;
                     nl:=0;
                        sursadate.Prior;

        //inserez subsol de pagina
         for z:=1 to SubsolPagina.linii.Count do
       begin
       linie:=SubsolPagina.linii[z-1];
         for j:=1 to length(SubsolPagina.linii[z-1]) do
         begin
             if copy(SubsolPagina.linii[i-1],j,1)='~' then
             begin
             k:=1;
             s:='';
             while not (copy(SubsolPagina.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(SubsolPagina.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to nparametrii do
             begin
             if p[g].id=s then
             begin
              p[g].idBanda:='SP';
              p[g].start:=j;
              delete(linie,p[g].start,p[g].stop-p[g].start+1);
              Insert(Aliniaza(p[g].comanda,p[g].aliniament,p[g].stop-p[g].start+1),linie,p[g].start);
             end;
             end;
             end;

             if copy(SubsolPagina.linii[z-1],j,1)='#' then
             begin
             k:=1;
             s:='';
             while not (copy(SubsolPagina.linii[z-1],j+k,1)=' ') do
             begin
              s:=s+copy(SubsolPagina.linii[z-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to Numarcimpuri do
             begin
             if cimpuri[g].id=s then
             begin

              cimpuri[g].idBanda:='SP';
              cimpuri[g].start:=j;

              if cimpuri[g].tip='F' then
              begin
                if cimpuri[g].comanda='PAGINA' then
                begin
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(inttostr(npag-1),cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
                end;
              end
              else
              begin
          //    stinga:=copy(Detalii.linii[i-1],1,j-1);
            //  dreapta:=copy(Detalii.linii[i-1],cimpuri[g].stop+1,length(Detalii.linii[i-1])-cimpuri[g].stop-1);
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
         //     linie:=stinga+Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,'L',cimpuri[g].stop-cimpuri[g].start-1)+dreapta;
             end;
             end;
             end;
             end;
         //    end;
          //   end;


         end;
         Rezultat.Add(linie);
       end;

    // sf inserarwa subsol de pagina

     //inserez header pagina
                       for z:=1 to AntetPagina.linii.Count do
       begin
       linie:=AntetPagina.linii[z-1];
         for j:=1 to length(AntetPagina.linii[z-1]) do
         begin
              if copy(AntetPagina.linii[i-1],j,1)='~' then
             begin
             k:=1;
             s:='';
             while not (copy(AntetPagina.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(AntetPagina.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to nparametrii do
             begin
             if p[g].id=s then
             begin
              p[g].idBanda:='AP';
              p[g].start:=j;
              delete(linie,p[g].start,p[g].stop-p[g].start+1);
              Insert(Aliniaza(p[g].comanda,p[g].aliniament,p[g].stop-p[g].start+1),linie,p[g].start);
             end;
             end;
             end;

             if copy(AntetPagina.linii[z-1],j,1)='#' then
             begin
             k:=1;
             s:='';
             while not (copy(AntetPagina.linii[z-1],j+k,1)=' ') do
             begin
              s:=s+copy(AntetPagina.linii[z-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to Numarcimpuri do
             begin
             if cimpuri[g].id=s then
             begin

              cimpuri[g].idBanda:='AP';
              cimpuri[g].start:=j;

              if cimpuri[g].tip='F' then
              begin
                if cimpuri[g].comanda='PAGINA' then
                begin
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(inttostr(npag),cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
                end;
              end
              else
              begin
          //    stinga:=copy(Detalii.linii[i-1],1,j-1);
            //  dreapta:=copy(Detalii.linii[i-1],cimpuri[g].stop+1,length(Detalii.linii[i-1])-cimpuri[g].stop-1);
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
         //     linie:=stinga+Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,'L',cimpuri[g].stop-cimpuri[g].start-1)+dreapta;
             end;
             end;
             end;
             end;
         //    end;
          //   end;


         end;
         Rezultat.Add(linie);
       end;
       //sf inserez header pagina
                   
                       for z:=1 to Captabel.linii.Count do
                       begin
                         Rezultat.Add(Captabel.linii[z-1]);
                       end;
                       nl:=AntetPagina.linii.Count+Captabel.linii.Count+SubsolPagina.linii.Count;
                     end;
                     end;
            

   //   end;


      sursadate.next;
      end;

      //inc sumar detalii

             for i:=1 to SumarDetalii.linii.Count do
             begin
             linie:=SumarDetalii.linii[i-1];
             for j:=1 to length(SumarDetalii.linii[i-1]) do
              begin
             if copy(SumarDetalii.linii[i-1],j,1)='~' then
             begin
             k:=1;
             s:='';
             while not (copy(Sumardetalii.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(sumardetalii.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to nparametrii do
             begin
             if p[g].id=s then
             begin
              p[g].idBanda:='SD';
              p[g].start:=j;
              delete(linie,p[g].start,p[g].stop-p[g].start+1);
              Insert(Aliniaza(p[g].comanda,p[g].aliniament,p[g].stop-p[g].start+1),linie,p[g].start);
             end;
             end;
             end;

             if copy(SumarDetalii.linii[i-1],j,1)='#' then
             begin
             k:=1;
             s:='';
             while not (copy(SumarDetalii.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(SumarDetalii.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to Numarcimpuri do
             begin
             if cimpuri[g].id=s then
             begin
              cimpuri[g].idBanda:='DD';
              cimpuri[g].start:=j;
          //    stinga:=copy(Detalii.linii[i-1],1,j-1);
            //  dreapta:=copy(Detalii.linii[i-1],cimpuri[g].stop+1,length(Detalii.linii[i-1])-cimpuri[g].stop-1);
              suma:=0;
              sursadate.first;
              while not sursadate.eof do
              begin
              suma:=suma+SursaDate.fieldbyname(cimpuri[g].cimpdate).ascurrency;
              sursadate.next;
              end;
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(floattostr(suma),cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
         //     linie:=stinga+Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,'L',cimpuri[g].stop-cimpuri[g].start-1)+dreapta;
             end;
             end;
             end;
             end;

             end;
                    Rezultat.Add(linie);

    //sf  sumar detalii

      for z:=1 to SubsolPagina.linii.Count do
       begin
       linie:=SubsolPagina.linii[z-1];
         for j:=1 to length(SubsolPagina.linii[z-1]) do
         begin
             if copy(SubsolPagina.linii[i-1],j,1)='~' then
             begin
             k:=1;
             s:='';
             while not (copy(SubsolPagina.linii[i-1],j+k,1)=' ') do
             begin
              s:=s+copy(SubsolPagina.linii[i-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to nparametrii do
             begin
             if p[g].id=s then
             begin
              p[g].idBanda:='SP';
              p[g].start:=j;
              delete(linie,p[g].start,p[g].stop-p[g].start+1);
              Insert(Aliniaza(p[g].comanda,p[g].aliniament,p[g].stop-p[g].start+1),linie,p[g].start);
             end;
             end;
             end;

             if copy(SubsolPagina.linii[z-1],j,1)='#' then
             begin
             k:=1;
             s:='';
             while not (copy(SubsolPagina.linii[z-1],j+k,1)=' ') do
             begin
              s:=s+copy(SubsolPagina.linii[z-1],j+k,1);
             k:=k+1;
             end;
             for g:=1 to Numarcimpuri do
             begin
             if cimpuri[g].id=s then
             begin

              cimpuri[g].idBanda:='SP';
              cimpuri[g].start:=j;

              if cimpuri[g].tip='F' then
              begin
                if cimpuri[g].comanda='PAGINA' then
                begin
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(inttostr(npag-1),cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
                end;
              end
              else
              begin
          //    stinga:=copy(Detalii.linii[i-1],1,j-1);
            //  dreapta:=copy(Detalii.linii[i-1],cimpuri[g].stop+1,length(Detalii.linii[i-1])-cimpuri[g].stop-1);
              delete(linie,cimpuri[g].start,cimpuri[g].stop-cimpuri[g].start+1);
              Insert(Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,cimpuri[g].aliniament,cimpuri[g].stop-cimpuri[g].start+1),linie,cimpuri[g].start);
         //     linie:=stinga+Aliniaza(SursaDate.fieldbyname(cimpuri[g].cimpdate).asstring,'L',cimpuri[g].stop-cimpuri[g].start-1)+dreapta;
             end;
             end;
             end;
             end;
         //    end;
          //   end;


         end;
         Rezultat.Add(linie);
       end;



       
          for jj:=1 to SubsolRaport.linii.Count do
            begin
    Rezultat.Add(SubsolRaport.linii[jj-1]);
    end;


    Rezultat.SaveToFile(caleraport);


     // SF PRIMA raport


end;

procedure TRaport.Initializare(srs: string);
var
i,j,k,x,z,zz,zzz:byte;
s,d,text,p1,p2,p3:string;
index,g:integer;
begin
frm1.Memo2.Lines.LoadFromFile(srs);
script:=frm1.memo2.lines;
AntetRaport.id:='AR';
AntetRaport.linii:=frm1.memo5.lines;
AntetPagina.id:='AP';
Antetpagina.linii:=TStrings.Create;
AntetPagina.linii:=frm1.memo3.lines;
SubsolPagina.id:='SP' ;
subsolpagina.linii:=TStrings.Create;
SubsolPagina.linii:=frm1.memo7.lines;
SubsolRaport.id:='SR';
subsolRaport.linii:=TStrings.Create;
SubsolRaport.linii:=frm1.memo4.lines;
Detalii.id:='DD';
Detalii.linii:=TStrings.Create;
Detalii.linii:=frm1.memo8.lines;
CapTabel.id:='CT';
Captabel.linii:=TStrings.Create;
CapTabel.linii:=frm1.memo6.lines;
Sumardetalii.id:='SD';
SumarDetalii.linii:=TStrings.Create;
SumarDetalii.linii:=frm1.memo9.lines;
 for i:=1 to length(script[0]) do
 begin
  if copy(script[0],i,2)='NL' then
  begin
  Numarlinii:=strtoint(copy(script[0],i+3,2));
 // showmessage(inttostr(Numarlinii));
  end;

   if copy(script[0],i,2)='AP' then
  begin
  j:=3;
  s:='';
  d:='';
   while not (copy(script[0],i+j,1)=':') do
   begin
   s:=s+copy(script[0],i+j,1);
   j:=j+1;
   end;
   while not (copy(script[0],i+j+1,1)=')') do
   begin
   d:=d+copy(script[0],i+j+1,1);
   j:=j+1;
   end;
     AntetPagina.linii:=Tstrings.Create;
    frm1.memo3.Clear;
    for k:=strtoint(s) to strtoint(d) do
    begin
       text:=script[k-1];

       frm1.memo3.lines.add(text);

    end;
    AntetPagina.linii:=frm1.memo3.lines;
  end;

   if copy(script[0],i,2)='SR' then
    begin
    j:=3;
    s:='';
    d:='';
    while not (copy(script[0],i+j,1)=':') do
    begin
    s:=s+copy(script[0],i+j,1);
    j:=j+1;
    end;
    while not (copy(script[0],i+j+1,1)=')') do
    begin
    d:=d+copy(script[0],i+j+1,1);
    j:=j+1;
    end;
     SubsolRaport.linii:=Tstrings.Create;
     frm1.memo4.Clear;
      for k:=strtoint(s) to strtoint(d) do
       begin
        text:=script[k-1];
        frm1.memo4.lines.add(text);

       end;
     SubsolRaport.linii:=frm1.memo4.lines;
  end;

  if copy(script[0],i,2)='AR' then
    begin
    j:=3;
    s:='';
    d:='';
    while not (copy(script[0],i+j,1)=':') do
    begin
    s:=s+copy(script[0],i+j,1);
    j:=j+1;
    end;
    while not (copy(script[0],i+j+1,1)=')') do
    begin
    d:=d+copy(script[0],i+j+1,1);
    j:=j+1;
    end;
     AntetRaport.linii:=Tstrings.Create;
     frm1.memo5.Clear;
      for k:=strtoint(s) to strtoint(d) do
       begin
        text:=script[k-1];
        frm1.memo5.lines.add(text);

       end;
     AntetRaport.linii:=frm1.memo5.lines;
  end;

  if copy(script[0],i,2)='CT' then
    begin
    j:=3;
    s:='';
    d:='';
    while not (copy(script[0],i+j,1)=':') do
    begin
    s:=s+copy(script[0],i+j,1);
    j:=j+1;
    end;
    while not (copy(script[0],i+j+1,1)=')') do
    begin
    d:=d+copy(script[0],i+j+1,1);
    j:=j+1;
    end;
     CapTabel.linii:=Tstrings.Create;
     frm1.memo6.Clear;
      for k:=strtoint(s) to strtoint(d) do
       begin
        text:=script[k-1];
        frm1.memo6.lines.add(text);

       end;
     CapTabel.linii:=frm1.memo6.lines;
  end;

   if copy(script[0],i,2)='SP' then
    begin
    j:=3;
    s:='';
    d:='';
    while not (copy(script[0],i+j,1)=':') do
    begin
    s:=s+copy(script[0],i+j,1);
    j:=j+1;
    end;
    while not (copy(script[0],i+j+1,1)=')') do
    begin
    d:=d+copy(script[0],i+j+1,1);
    j:=j+1;
    end;
     SubsolPagina.linii:=Tstrings.Create;
     frm1.memo7.Clear;
      for k:=strtoint(s) to strtoint(d) do
       begin
        text:=script[k-1];
        frm1.memo7.lines.add(text);

       end;
     SubsolPagina.linii:=frm1.memo7.lines;
  end;

  if copy(script[0],i,2)='DD' then
    begin
    j:=3;
    s:='';
    d:='';
    while not (copy(script[0],i+j,1)=':') do
    begin
    s:=s+copy(script[0],i+j,1);
    j:=j+1;
    end;
    while not (copy(script[0],i+j+1,1)=')') do
    begin
    d:=d+copy(script[0],i+j+1,1);
    j:=j+1;
    end;
     Detalii.linii:=Tstrings.Create;
     frm1.memo8.Clear;
      for k:=strtoint(s) to strtoint(d) do
       begin
        text:=script[k-1];
        frm1.memo8.lines.add(text);

       end;
     Detalii.linii:=frm1.memo8.lines;
  end;

   if copy(script[0],i,2)='SD' then
    begin
    j:=3;
    s:='';
    d:='';
    while not (copy(script[0],i+j,1)=':') do
    begin
    s:=s+copy(script[0],i+j,1);
    j:=j+1;
    end;
    while not (copy(script[0],i+j+1,1)=')') do
    begin
    d:=d+copy(script[0],i+j+1,1);
    j:=j+1;
    end;
     Sumardetalii.linii:=Tstrings.Create;
     frm1.memo9.Clear;
      for k:=strtoint(s) to strtoint(d) do
       begin
        text:=script[k-1];
        frm1.memo9.lines.add(text);

       end;
     SumarDetalii.linii:=frm1.memo9.lines;
  end;

 end;
 zz:=1;
for i:=1 to length(script[1]) do
begin

 if copy(script[1],i,1)='(' then
 begin
 z:=1;
     while not (copy(script[1],i-z,1)=';') do
     begin
      cimpuri[zz].id:=cimpuri[zz].id+copy(script[1],i-z,1);
      z:=z+1;
     end;
     cimpuri[zz].tip:=copy(script[1],i+1,1);
     j:=3;
  p1:='';
  p2:='';
  p3:='';
   while not (copy(script[1],i+j,1)=',') do
   begin
   p1:=p1+copy(script[1],i+j,1);
   j:=j+1;
   end;
   while not (copy(script[1],i+j+1,1)=',') do
   begin
   p2:=p2+copy(script[1],i+j+1,1);
   j:=j+1;
   end;
   while not (copy(script[1],i+j+2,1)=')') do
   begin
   p3:=p3+copy(script[1],i+j+2,1);
   j:=j+1;
   end;
   if cimpuri[zz].tip='D' then
    cimpuri[zz].cimpdate:=p1
    else
    cimpuri[zz].comanda:=p1;
    cimpuri[zz].aliniament:=p2;
    cimpuri[zz].stop:=strtoint(p3);
  zz:=zz+1;
     end;

end;
numarcimpuri:=zz-1;

//parametrii
       zzz:=1;
for i:=1 to length(script[2]) do
begin

 if copy(script[2],i,1)='(' then
 begin
 z:=1;
     while not (copy(script[2],i-z,1)=';') do
     begin
      p[zzz].id:=p[zzz].id+copy(script[2],i-z,1);
      z:=z+1;
     end;
     p[zzz].aliniament:=copy(script[2],i+1,1);
     j:=3;
  p1:='';
  p2:='';
  p3:='';
   while not (copy(script[2],i+j,1)=')') do
   begin
   p1:=p1+copy(script[2],i+j,1);
   j:=j+1;
   end;
   //    p[zzz].aliniament:=p1;
    p[zzz].stop:=strtoint(p1);

  zzz:=zzz+1;
     end;

end;
nparametrii:=zzz-1;
index:=1;
for g:=1 to length(parametrii) do
begin
    if copy(parametrii,g,1)=';' then
    begin
    index:=index+1;
    end
    else
    begin
    p[index].comanda:=p[index].comanda+copy(parametrii,g,1);
    end;
end;
// sf parametrii
//showmessage(p[1].comanda+' '+p[2].comanda);
end;

procedure TFrm1.Raportnou1Click(Sender: TObject);
var
r:TRaport;
begin
r:=TRaport.Create;
r.Raportnou(table1,'c:\s.txt',memo1,'c:\c\modele\_nf.txt',getcurrentdir()+';'+'mii;');
//memo1.lines:=R.script;
end;

procedure TRaport.Raportnou(sd: Tdataset; locatie: string;
  m: Tmemo;cale:string;param:string);
begin
sursadate:=sd;
sursa:=locatie;
caleraport:=cale;
parametrii:=param;
Initializare(locatie);
ExecutaRaport;
m.Lines:=Rezultat;//aici se va inlocui cu rezultat
end;

procedure TFrm1.FormDeactivate(Sender: TObject);
begin
table1.active:=false;
end;

end.
