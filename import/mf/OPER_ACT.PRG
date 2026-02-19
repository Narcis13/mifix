 PRIV M.currarea, M.talkstat, M.compstat
 IF SET('TALK')='ON'
      SET TALK OFF
      M.talkstat = 'ON'
 ELSE
      M.talkstat = 'OFF'
 ENDI
 M.compstat = SET('COMPATIBLE')
 SET COMPATIBLE TO FOXPLUS
 M.currarea = SELECT()
 CLEA
 DEFI WINDOW fer_brow FROM INT((SROWS()-14)/2), INT((SCOLS()-72)/2) TO INT((SROWS()-14)/2)+13, INT((SCOLS()-72)/2)+71 NOFLOAT NOCLOSE SHADOW NOMINIMIZE COLOR SCHEME 7
 SET EXACT OFF
 SET DELETED ON
 CLOS ALL
 SELE 1
 USE tranzact
 SELE 2
 USE conturi
 SELE 3
 USE material
 SELE 4
 USE solduri
 SELE 5
 USE operatii
 DIME sir_cont[ 1, 2]
 DIME sir_fin[ 1, 2]
 DIME sir_pro[ 1, 2]
 DIME sir_uz[ 1, 2]
 DIME sir_ges[ 1, 2]
 DIME sir_loc[ 1, 2]
 DIME sir_um[ 1, 2]
 DIME sir_stare[ 1, 2]
 PUBL M.cont, M.modific, M.c_adaug, M.c_data
 PUBL M.nr_oper, M.nume, M.data_max, M.max_op
 PUBL M.cod_ges, M.cod_dis, M.c_stoc, M.cod_prov, M.cod_fin
 PUBL M.data_fol, M.pret, M.cantit, M.unit_mas, M.stare
 PUBL M.cod_doc, M.nr_doc, M.c_operat, M.crt, M.ce_cont
 PUBL M.val, M.tot_oper, M.fisa, M.data_intr
 PUBL M.max_gest, M.max_loc, M.proc, M.zile_f
 PUBL M.seria, M.pret_comp
 M.max_cant = 0.000
 M.max_pret = 0
 M.proc_act = 0.000
 M.seria = '        '
 M.pret_comp = 0
 M.max_data = DATE()
 M.max_op = 0
 M.fisa = 0
 M.nume = '      '
 M.data_intr = DATE()
 M.nr_doc = '     '
 M.val = 0
 M.tot_oper = 0
 M.zile_f = 0
 M.proc = 0.000
 M.crt_int = -1
 pun_act = .T.
 M.c_adaug = 2
 M.modific = 0
 SET DATE TO briti
 SET CENTURY ON
 SELE conturi
 SET FILTER TO titlu=.F.
 SET ORDER TO cont ASCENDING
 COUN ALL TO nr
 DIME sir_cont[ nr, 2]
 GOTO TOP
 i = 1
 DO WHILE  .NOT. EOF()
      sir_cont[ i, 1] = cont+'   '+denumire
      sir_cont[ i, 2] = cod_cont
      i = i+1
      SKIP 1
 ENDD
 M.ce_cont = 1
 M.cont = sir_cont(M.ce_cont,2)
 SELE 7
 USE finantat
 COUN ALL FOR cap=.F. TO nr_elem
 DIME sir_fin[ nr_elem, 2]
 COPY TO ARRAY sir_fin FIELDS den, cod ALL FOR cap=.F.
 M.ce_fin = 1
 USE
 USE provenie
 SET ORDER TO cod
 COUN ALL TO nr_elem
 DIME sir_pro[ nr_elem, 2]
 COPY TO ARRAY sir_pro FIELDS den, cod ALL
 M.ce_pro = 1
 USE
 USE stoc_uz
 COUN ALL TO nr_elem
 DIME sir_uz[ nr_elem, 2]
 COPY TO ARRAY sir_uz FIELDS den, cod ALL
 M.ce_uz = 1
 M.c_stoc = sir_uz(M.ce_uz,2)
 USE
 USE gestiuni
 SET ORDER TO denumire
 COUN ALL TO M.max_gest
 IF M.max_gest=0
      CLOS ALL
      DO avertiz7.spr
      CLEA
      RETU
 ENDI
 DIME sir_ges[ M.max_gest, 2]
 COPY TO ARRAY sir_ges FIELDS denumire, cod ALL
 M.ce_ges = 1
 M.cod_ges = sir_ges(M.ce_ges,2)
 USE
 USE dispus
 SET ORDER TO DENUMIRE
 COUN ALL TO M.max_loc
 IF M.max_loc=0
      CLOS ALL
      DO avertiz7.spr
      CLEA
      RETU
 ENDI
 DIME sir_loc[ M.max_loc, 2]
 COPY TO ARRAY sir_loc FIELDS denumire, cod ALL
 USE
 M.ce_loc = 1
 M.sect = sir_loc(M.ce_loc,2)
 M.data_fol = DATE()
 USE unit_mas
 SET ORDER TO NUME_U
 COUN ALL TO nr_elem
 DIME sir_um[ nr_elem, 2]
 COPY TO ARRAY sir_um FIELDS nume_u, cod_u ALL
 M.ce_um = 1
 USE
 USE stare
 SET ORDER TO cod
 COUN ALL TO nr_elem
 DIME sir_stare[ nr_elem, 2]
 COPY TO ARRAY sir_stare FIELDS den, cod ALL
 M.ce_stare = 1
 USE
 USE acte
 SET ORDER TO DEN
 COUN ALL TO nr_elem
 DIME sir_act[ nr_elem, 2]
 COPY TO ARRAY sir_act FIELDS den, cod ALL
 M.ce_act = 2
 USE
 SELE 0
 USE unit_mas
 SET ORDER TO cod_u
 SELE 0
 USE stare
 SET ORDER TO cod
 SELE 0
 USE provenie
 SET ORDER TO cod
 SELE 0
 USE finantat
 SET ORDER TO cod
 SELE 1
 SELE tranzact
 GOTO TOP
 SCAT MEMVAR
 tot_linii = 0
 M.c_data = DATE()
 = reset_date()
 = init_op()
 SHOW GETS
 @ 12, 0 SAY 'Sursa de finantare:' SIZE 1, 19, 0
 @ 9, 16 SAY 'Gestiune:' SIZE 1, 9, 0
 @ 15, 60 SAY 'U/M:' SIZE 1, 4, 0
 @ 17, 57 SAY 'Pret:' SIZE 1, 5, 0
 @ 0, 1 SAY 'Operatiunea nr.:' SIZE 1, 16, 0
 @ 0, 26 SAY 'data operarii:' SIZE 1, 14, 0
 @ 0, 52 SAY '{ZZ/LL/AAAA}' SIZE 1, 12, 0
 @ 2, 1 SAY 'Act:' SIZE 1, 4, 0
 @ 2, 62 SAY 'Nr.act:' SIZE 1, 7, 0
 @ 0, 66 SAY 'linii/act:' SIZE 1, 10, 0
 @ 6, 0 SAY 'Contul:' SIZE 1, 7, 0
 @ 15, 0 SAY 'Nr.fisa:' SIZE 1, 8, 0
 @ 9, 51 SAY 'Locul:' SIZE 1, 6, 0
 @ 12, 40 SAY 'Sursa de provenienta:' SIZE 1, 21, 0
 @ 17, 0 SAY 'Stare:' SIZE 1, 6, 0
 @ 17, 34 SAY 'Cantitate:' SIZE 1, 10, 0
 @ 17, 77 SAY 'lei' SIZE 1, 3, 0
 @ 19, 38 SAY '%' SIZE 1, 1, 0
 @ 19, 0 SAY 'Data intrarii:' SIZE 1, 14, 0
 @ 21, 10 SAY 'Complet (' SIZE 1, 9, 0
 @ 21, 24 SAY ':' SIZE 1, 1, 0
 @ 21, 20 SAY 'nume' SIZE 1, 4, 0
 @ 21, 61 SAY 'lei )' SIZE 1, 5, 0
 @ 19, 42 SAY 'Procent la data operarii:' SIZE 1, 25, 0
 @ 19, 79 SAY '%' SIZE 1, 1, 0
 @ 4, 0 SAY 'Numar curent:' SIZE 1, 13, 0
 @ 4, 16 SAY '<' SIZE 1, 1, 0
 @ 4, 22 SAY '>' SIZE 1, 1, 0
 @ 23, 0 SAY 'TOTAL INTRARI :' SIZE 1, 15, 0
 @ 23, 33 SAY 'LEI.' SIZE 1, 4, 0
 @ 23, 41 SAY 'TOTAL IESIRI :' SIZE 1, 14, 0
 @ 23, 74 SAY 'LEI.' SIZE 1, 4, 0
 @ 0, 18 GET M.nr_oper DEFAULT 0 SIZE 1, 6 RANGE 1,999999 VALID _04h0jvytt() WHEN data_max()
 @ 0, 41 GET M.c_data DEFAULT {} SIZE 1, 10 RANGE {01/01/00},{01/01/2100} PICTURE '@E' VALID val_oper()
 @ 0, 77 GET tot_linii DEFAULT 0 SIZE 1, 3 WHEN .F.
 @ 1, 5 GET M.ce_act DEFAULT 1 SIZE 3, 56 FROM sir_act PICTURE '@^' VALID _04h0jvyu1() WHEN pun_act
 @ 2, 69 GET M.nr_doc DEFAULT ' ' SIZE 1, 10 WHEN pun_act
 @ 4, 16 GET M.prec DEFAULT 0 SIZE 1, 1, 1 PICTURE '@*IHN ' VALID _04h0jvyu7() WHEN IIF(M.crt>1, .T., .F.)
 @ 4, 18 GET M.crt DEFAULT 0 SIZE 1, 3 RANGE 1,999 PICTURE '@Z' VALID val_crt() WHEN wen_crt()
 @ 4, 22 GET M.urm DEFAULT 0 SIZE 1, 1, 1 PICTURE '@*IHN ' VALID _04h0jvyud() WHEN IIF(M.crt<=tot_linii, .T., .F.)
 @ 4, 46 GET M.c_adaug DEFAULT 2 SIZE 1, 11, 0 PICTURE '@*RHN IESIRE;INTRARE' VALID wen_adaug() WHEN wen_adaug()
 @ 5, 7 GET M.ce_cont DEFAULT 1 SIZE 3, 73 FROM sir_cont PICTURE '@^' VALID _04h0jvyum()
 @ 8, 0 GET M.ce_uz DEFAULT 1 SIZE 3, 14 FROM sir_uz PICTURE '@^' VALID _04h0jvyuq()
 @ 8, 25 GET M.ce_ges DEFAULT 1 SIZE 3, 22 FROM sir_ges PICTURE '@^' VALID _04h0jvyuv() WHEN IIF(M.max_gest>1, .T., .F.)
 @ 8, 58 GET M.ce_loc DEFAULT 1 SIZE 3, 22 FROM sir_loc PICTURE '@^' VALID _04h0jvyuz() WHEN IIF(M.max_loc>1, .T., .F.)
 @ 11, 20 GET M.ce_fin DEFAULT 1 SIZE 3, 18 FROM sir_fin PICTURE '@^' WHEN IIF(M.c_adaug=1, .F., .T.)
 @ 11, 62 GET M.ce_pro DEFAULT 1 SIZE 3, 18 FROM sir_pro PICTURE '@^' WHEN IIF(M.c_adaug=1, .F., .T.)
 @ 15, 9 GET M.cod_den DEFAULT 0 SIZE 1, 6 RANGE 0,999999 PICTURE '@BZ' VALID setare_den() WHEN wen_den()
 @ 15, 17 GET M.nume DEFAULT ' ' SIZE 1, 40 WHEN .F.
 @ 14, 64 GET M.ce_um DEFAULT 1 SIZE 3, 15 FROM sir_um PICTURE '@^' VALID val_um() WHEN val_um()
 @ 16, 7 GET M.ce_stare DEFAULT 1 SIZE 3, 25 FROM sir_stare PICTURE '@^' WHEN IIF(M.c_adaug=1, .F., .T.)
 @ 17, 45 GET M.cantit DEFAULT 0 SIZE 1, 10 RANGE 0.000,9999999.999 VALID val_cantit() WHEN wen_cantit()
 @ 17, 63 GET M.pret DEFAULT 0 SIZE 1, 13 RANGE 0.00,9999999999.99 VALID val_pret() WHEN IIF(M.c_adaug=1, .F., .T.)
 @ 19, 15 GET M.data_intr DEFAULT {} SIZE 1, 10 RANGE ,{01/01/2100} PICTURE '@E' VALID _04h0jvyvc() WHEN IIF(M.c_adaug=1 .OR. LEN(ALLTRIM(M.seria))<>0, .F., .T.)
 @ 19, 27 GET M.proc DEFAULT 0 SIZE 1, 10 RANGE 0,999999 PICTURE '@Z' VALID _04h0jvyvi() WHEN IIF(M.c_adaug=1 .OR. LEN(ALLTRIM(M.seria))<>0, .F., .T.)
 @ 19, 68 GET M.proc_act DEFAULT 0 SIZE 1, 10 RANGE 0,999999 PICTURE '@Z' WHEN .F.
 @ 21, 25 GET M.seria DEFAULT ' ' SIZE 1, 8 VALID _04h0jvyvn() WHEN IIF(sir_um(M.ce_um,2)=6 .AND. LEN(ALLTRIM(M.seria))=0, .T., .F.) ERROR 'MAI MULTE COMPLETE CU ACEEASI SERIE.'
 @ 21, 47 GET M.pret_comp DEFAULT 0 SIZE 1, 13 RANGE 0.00,9999999999.99 VALID _04h0jvyvs() WHEN IIF(sir_um(M.ce_um,2)=6, .T., .F.)
 @ 23, 16 GET M.tot_int DEFAULT 0 SIZE 1, 16 WHEN .F.
 @ 23, 57 GET M.tot_ies DEFAULT 0 SIZE 1, 16 WHEN .F.
 @ 24, 0 GET M.salvare DEFAULT 1 SIZE 1, 12, 1 PICTURE '@*HN \!\<SALVARE' VALID salvare()
 @ 24, 23 GET M.sterg DEFAULT 1 SIZE 1, 12, 1 PICTURE '@*HN STE\<RGERE' DISABLE VALID sterge()
 @ 24, 49 GET M.material DEFAULT 1 SIZE 1, 12, 1 PICTURE '@*HN \<MATERIAL' VALID get_mater()
 @ 24, 69 GET M.ies DEFAULT 1 SIZE 1, 10, 1 PICTURE '@*HT \?\<Iesire' VALID iesire()
 @ 21, 37 SAY 'valoare:' SIZE 1, 8, 0
 READ CYCLE
 SELE (M.currarea)
 IF M.talkstat='ON'
      SET TALK ON
 ENDI
 IF M.compstat='ON'
      SET COMPATIBLE TO DB4
 ENDI
 CLOS ALL
 CLEA
*
PROC data_max
 SELE tranzact
 SET ORDER TO pun_op DESCENDING
 COUN ALL TO nr
 IF nr<>0
      GOTO TOP
      M.max_data = c_data
      M.max_op = c_operat
 ELSE
      M.max_data = DATE()
      M.max_op = 0
 ENDI
*
FUNC init_op
 SELE operatii
 SET ORDER TO pun_oper DESCENDING
 GOTO TOP
 M.c_data = DATE()
 SEEK STR(YEAR(M.c_data), 4)
 IF FOUND()
      M.nr_oper = operatii.nr_oper+1
 ELSE
      M.nr_oper = 1
 ENDI
 M.c_operat = YEAR(M.c_data)*1000000+M.nr_oper
 SHOW GET M.nr_oper
 RETU .T.
*
PROC valoare_ac
 SELE tranzact
 SET ORDER TO pun_op DESCENDING
 GOTO TOP
 SEEK STR(M.c_operat, 10)
 M.tot_int = 0
 M.tot_ies = 0
 DO WHILE M.c_operat==c_operat
      IF c_adaug=2
           IF unit_mas<>6
                M.tot_int = M.tot_int+ROUND(cantit*pret, 2)
           ELSE
                M.tot_int = M.tot_int+ROUND(pret_comp, 2)
           ENDI
      ENDI
      IF c_adaug=1
           IF unit_mas<>6
                M.tot_ies = M.tot_ies+ROUND(cantit*pret, 2)
           ELSE
                M.tot_ies = M.tot_ies+ROUND(pret_comp, 2)
           ENDI
      ENDI
      SKIP 1
      IF EOF()
           EXIT
      ENDI
 ENDD
 SHOW GET M.tot_int
 SHOW GET M.tot_ies
*
PROC val_oper
 SELE operatii
 SET ORDER TO pun_oper DESCENDING
 GOTO TOP
 SEEK STR(YEAR(M.c_data), 4)+STR(M.nr_oper, 6)
 IF FOUND()
      SCAT MEMVAR
      M.c_operat = YEAR(M.c_data)*1000000+M.nr_oper
      M.ce_act = 1
      DO WHILE sir_act(M.ce_act,2)<>M.cod_doc
           M.ce_act = M.ce_act+1
      ENDD
      SHOW GET M.ce_act
      SHOW GET M.nr_doc
      = valoare_ac()
      SELE tranzact
      GOTO TOP
      SEEK STR(M.c_operat, 10)
      M.crt = tranzact.crt
      = incarc_dat()
      tot_linii = M.crt
      IF M.crt<999
           M.modific = 0
           M.crt = M.crt+1
           = reset_var()
      ELSE
           M.modific = 1
      ENDI
      M.c_adaug = 2
      pun_act = .F.
      SHOW GETS
 ELSE
      GOTO TOP
      SEEK STR(YEAR(M.c_data), 4)
      IF FOUND()
           IF M.nr_oper>nr_oper+1
                M.nr_oper = nr_oper+1
           ENDI
      ELSE
           M.nr_oper = 1
      ENDI
      M.c_operat = YEAR(M.c_data)*1000000+M.nr_oper
      SHOW GET M.nr_oper
      pun_act = .T.
      M.modific = 0
      tot_linii = 0
      = reset_date()
      M.ce_act = 2
      M.cod_doc = sir_act(M.ce_act,2)
      M.nr_doc = '        '
 ENDI
 SHOW GETS
*
PROC reset_var
 M.cantit = 0.000
 M.c_adaug = 2
 M.pret = 0.00
 M.seria = '        '
 M.pret_comp = 0.00
 M.cod_den = 0
*
FUNC reset_date
 M.cantit = 0.000
 M.c_adaug = 2
 M.pret = 0.00
 M.crt = 1
 M.ce_cont = 1
 M.ce_fin = 1
 M.ce_pro = 1
 M.ce_uz = 1
 M.ce_ges = 1
 M.ce_loc = 1
 M.ce_um = 1
 M.ce_stare = 1
 M.data_fol = DATE()
 M.cod_den = 0
 M.seria = '        '
 M.pret_comp = 0.00
 RETU .T.
*
FUNC next_crt
 SELE tranzact
 SET ORDER TO pun_op DESCENDING
 GOTO TOP
 SEEK STR(M.c_operat, 10)
 IF FOUND()
      M.crt = crt+1
      IF M.crt=1000
           DO avertiz1.spr
           GOTO TOP
           SEEK STR(M.c_operat, 10)
           M.crt = tranzact.crt
           = val_crt()
           _CUROBJ = OBJNUM(M.ies)
      ENDI
 ELSE
      M.crt = 1
 ENDI
 SHOW GET M.crt
 _CUROBJ = OBJNUM(M.cod_den)
 SHOW GETS
 RETU .T.
*
FUNC calc_proc
 M.proc_act = 0.000
 IF M.data_intr={}
      M.proc_act = M.proc
      RETU M.proc_act
 ENDI
 zona = SELECT()
 SELE material
 SET ORDER TO cod
 SEEK M.cod_den
 IF FOUND()
      IF M.c_stoc=0
           IF material.zile<>0
                M.proc_act = M.proc+ROUND((M.c_data-M.data_intr)*100/material.zile, 3)
           ELSE
                M.proc_act = M.proc
           ENDI
      ENDI
      IF M.c_stoc=1
           IF material.zile1<>0
                M.proc_act = M.proc+ROUND((M.c_data-M.data_intr)*100/material.zile1, 3)
           ELSE
                M.proc_act = M.proc
           ENDI
      ENDI
      IF M.c_stoc=2
           IF material.zile2<>0
                M.proc_act = M.proc+ROUND((M.c_data-M.data_intr)*100/material.zile2, 3)
           ELSE
                M.proc_act = M.proc
           ENDI
      ENDI
 ENDI
 = SELECT(zona)
 RETU M.proc_act
*
PROC val_crt
 IF M.crt_int<>M.crt
      M.modific = 0
 ENDI
 SELE tranzact
 SET ORDER TO pun_op
 SHOW GET M.salvare ENABLE
 GOTO TOP
 SEEK STR(M.c_operat, 10)+STR(M.crt, 3)
 IF FOUND()
      M.modific = 1
      SCAT MEMVAR
      = incarc_dat()
      SELE material
      DO FER2.SPR
      SET ORDER TO COD
      GOTO TOP
      SEEK M.cod_den
      M.nume = nume
      SHOW GET M.nume
      = calc_proc()
      SHOW GET M.proc_act
      SELE tranzact
      SET PROCEDURE TO librarie
      se_poate = ver_stg()
      SET PROCEDURE TO
      IF se_poate=.T.
           SHOW GETS ENABLE
      ELSE
           SHOW GETS DISABLE
           SHOW GET M.crt ENABLE
           SHOW GET M.urm ENABLE
           SHOW GET M.prec ENABLE
           SHOW GET M.ies ENABLE
           SHOW GET M.nr_oper ENABLE
           SHOW GET M.c_data ENABLE
      ENDI
      _CUROBJ = OBJNUM(M.cod_den)
 ELSE
      GOTO TOP
      SEEK STR(M.c_operat, 10)
      IF  .NOT. FOUND()
           M.crt = 1
      ELSE
           IF M.crt>crt
                M.crt = crt+1
           ENDI
      ENDI
      SHOW GET M.sterg DISABLE
      M.modific = 0
      M.cod_den = 0
      M.nume = '   '
      M.pret = 0.00
      M.cantit = 0.000
      M.seria = '        '
      M.pret_comp = 0.00
      M.proc = 0.000
      M.data_intr = {}
 ENDI
 SHOW GETS
*
PROC add_caract
 M.ce_cont = 1
 DO WHILE sir_cont(M.ce_cont,2)<>M.cont
      M.ce_cont = M.ce_cont+1
 ENDD
 M.ce_fin = 1
 DO WHILE sir_fin(M.ce_fin,2)<>M.cod_fin
      M.ce_fin = M.ce_fin+1
 ENDD
 M.ce_pro = 1
 DO WHILE sir_pro(M.ce_pro,2)<>M.cod_prov
      M.ce_pro = M.ce_pro+1
 ENDD
 M.ce_uz = 1
 DO WHILE sir_uz(M.ce_uz,2)<>M.c_stoc
      M.ce_uz = M.ce_uz+1
 ENDD
 M.ce_ges = 1
 DO WHILE sir_ges(M.ce_ges,2)<>M.cod_ges
      M.ce_ges = M.ce_ges+1
 ENDD
 M.ce_loc = 1
 DO WHILE sir_loc(M.ce_loc,2)<>M.sect
      M.ce_loc = M.ce_loc+1
 ENDD
 M.ce_um = 1
 DO WHILE sir_um(M.ce_um,2)<>M.unit_mas
      M.ce_um = M.ce_um+1
 ENDD
 M.ce_stare = 1
 DO WHILE sir_stare(M.ce_stare,2)<>M.stare
      M.ce_stare = M.ce_stare+1
 ENDD
*
FUNC wen_crt
 M.crt_int = M.crt
 RETU .T.
*
FUNC wen_den
 = incarc_var()
 M.fisa = M.cod_den
 RETU .T.
*
FUNC setare_den
 IF M.cod_den=1
      SELE tranzact
      SET FILTER TO cod_ges=sir_ges(M.ce_ges,2)
      SET ORDER TO COD_DEN DESCENDING
      GOTO TOP
      M.cod_den = cod_den+1
      IF M.cod_den=1
           M.cod_den = 2
      ENDI
      SHOW GET M.cod_den
      SET FILTER TO
 ENDI
 IF M.fisa=M.cod_den
      RETU .T.
 ENDI
 IF M.cod_den=0
      RETU .T.
 ENDI
 SELE material
 SET ORDER TO COD
 GOTO TOP
 SEEK M.cod_den
 IF FOUND()
      DO FER2.SPR
      M.nume = nume
      SELE solduri
      SET ORDER TO PMP
      SEEK STR(M.cod_den, 8)
      IF FOUND()
           M.unit_mas = unit_mas
           M.stare = stare
           M.ce_um = 1
           DO WHILE sir_um(M.ce_um,2)<>M.unit_mas
                M.ce_um = M.ce_um+1
           ENDD
           M.ce_stare = 1
           DO WHILE sir_stare(M.ce_stare,2)<>M.stare
                M.ce_stare = M.ce_stare+1
           ENDD
           M.cantit = 0.000
           M.pret = 0.00
           M.proc = 0.000
           M.seria = '        '
           M.pret_comp = 0.00
      ENDI
      SHOW GETS
      RETU
 ENDI
 M.ce_um = 1
 SHOW GET M.ce_um
 DO FER1.spr
 IF LEN(ALLTRIM(M.nume))=0
      M.cod_den = 0
      _CUROBJ = OBJNUM(M.cod_doc)
 ELSE
      SHOW GET M.nume
      SHOW GET M.cod_den
      = setare_den()
      _CUROBJ = OBJNUM(M.cod_doc)
      RETU
 ENDI
 SHOW GET M.nume
 SHOW GET M.cod_den
 RETU
*
FUNC val_um
 M.unit_mas = sir_um(M.ce_um,2)
 IF sir_um(M.ce_um,2)=6
      M.seria = '        '
      M.cantit = 1.00
      M.pret_comp = 0.00
      SHOW GET M.seria
      SHOW GET M.pret_comp
      SHOW GET M.cantit
      RETU .T.
 ENDI
 IF sir_um(M.ce_um,2)<>6
      M.seria = '        '
      M.pret_comp = 0.00
      SHOW GET M.seria
      SHOW GET M.pret_comp
      RETU .T.
 ENDI
 RETU .T.
*
FUNC incarc_dat
 SELE tranzact
 SET ORDER TO pun_op
 GOTO TOP
 SEEK STR(M.c_operat, 10)+STR(M.crt, 3)
 IF FOUND()
      SCAT MEMVAR
      = add_caract()
      SHOW GETS
 ENDI
 RETU .T.
*
PROC incarc_var
 M.cont = sir_cont(M.ce_cont,2)
 M.cod_doc = sir_act(M.ce_act,2)
 M.cod_ges = sir_ges(M.ce_ges,2)
 M.sect = sir_loc(M.ce_loc,2)
 M.c_stoc = sir_uz(M.ce_uz,2)
 M.cod_prov = sir_pro(M.ce_pro,2)
 M.cod_fin = sir_fin(M.ce_fin,2)
 M.unit_mas = sir_um(M.ce_um,2)
 M.stare = sir_stare(M.ce_stare,2)
*
FUNC ver_salvar
 IF M.cod_den=0
      _CUROBJ = OBJNUM(M.cod_den)
      RETU .F.
 ENDI
 IF M.cantit=0.000 .AND. M.unit_mas<>6
      _CUROBJ = OBJNUM(M.cantit)
      RETU .F.
 ENDI
 IF M.pret=0.00
      _CUROBJ = OBJNUM(M.pret)
      RETU .F.
 ENDI
 IF M.cod_fin=0
      _CUROBJ = OBJNUM(M.ce_fin)
      RETU .F.
 ENDI
 IF M.cod_prov=0
      _CUROBJ = OBJNUM(M.ce_prov)
      RETU .F.
 ENDI
 IF M.stare=0
      _CUROBJ = OBJNUM(M.ce_stare)
      RETU .F.
 ENDI
 IF M.sect=0
      _CUROBJ = OBJNUM(M.ce_loc)
      RETU .F.
 ENDI
 IF M.cod_ges=0
      _CUROBJ = OBJNUM(M.ce_ges)
      RETU .F.
 ENDI
 IF M.unit_mas=6 .AND. M.pret_comp<=0
      _CUROBJ = OBJNUM(M.pret_comp)
      RETU .F.
 ENDI
 IF M.unit_mas=6 .AND. LEN(ALLTRIM(M.seria))=0
      M.seria = '        '
      SHOW GET M.seria
      _CUROBJ = OBJNUM(M.seria)
      RETU .F.
 ENDI
*
PROC salvare
 = incarc_var()
 bine = ver_salvar()
 IF bine=.F.
      RETU
 ENDI
 IF pun_act=.T.
      SELE operatii
      APPE BLANK
      GATH MEMVAR
 ENDI
 SELE tranzact
 SET ORDER TO pun_op
 SEEK STR(M.c_operat, 10)+STR(M.crt, 3)
 IF  .NOT. FOUND()
      APPE BLANK
 ELSE
      IF unit_mas<>6
           M.tot_oper = M.tot_oper-ROUND(cantit*pret, 2)
      ELSE
           M.tot_oper = M.tot_oper-ROUND(pret_comp, 2)
      ENDI
      SELE solduri
      SET ORDER TO ord_sor
      filtru = STR(A.cod_den, 8)+STR(A.unit_mas, 2)+STR(A.stare, 1)+STR(A.pret, 13, 2)+DTOS(A.data_intr)+STR(A.proc, 10, 3)+STR(A.cont, 3)+STR(A.cod_ges, 2)+STR(A.c_stoc, 1)+STR(A.sect, 2)+STR(A.cod_fin, 2)+STR(A.cod_prov, 2)
      SEEK filtru
      IF FOUND()
           REPL cantit WITH cantit-A.cantit
           IF solduri.cantit=0
                DELE
           ENDI
      ENDI
      SELE tranzact
      IF c_adaug=2
           IF unit_mas<>6
                M.tot_int = M.tot_int-ROUND(cantit*pret, 2)
           ELSE
                M.tot_int = M.tot_int-ROUND(pret_comp, 2)
           ENDI
      ENDI
      IF c_adaug=1
           IF unit_mas<>6
                M.tot_ies = M.tot_ies-ROUND(cantit*pret, 2)
           ELSE
                M.tot_ies = M.tot_ies-ROUND(pret_comp, 2)
           ENDI
      ENDI
 ENDI
 GATH MEMVAR
 IF c_adaug=2
      IF unit_mas<>6
           M.tot_int = M.tot_int+ROUND(cantit*pret, 2)
      ELSE
           M.tot_int = M.tot_int+ROUND(pret_comp, 2)
      ENDI
 ENDI
 IF c_adaug=1
      IF unit_mas<>6
           M.tot_ies = M.tot_ies+ROUND(cantit*pret, 2)
      ELSE
           M.tot_ies = M.tot_ies+ROUND(pret_comp, 2)
      ENDI
 ENDI
 SHOW GET M.tot_int
 SHOW GET M.tot_ies
 M.modific = 0
 SET PROCEDURE TO librarie
 = rec_sold()
 SET PROCEDURE TO
 pun_act = .F.
 SELE tranzact
 SET ORDER TO pun_op DESCENDING
 SEEK STR(M.c_operat, 10)
 IF tranzact.crt<999 .AND. M.crt<tranzact.crt
      M.crt = M.crt+1
      M.crt_int = -1
      = val_crt()
 ELSE
      SHOW GET M.sterg DISABLE
      = next_crt()
      SHOW GET M.crt
      IF M.unit_mas<>6
           M.cantit = 0.000
           M.pret = 0.00
           M.val = 0
           M.seria = '        '
           M.pret_comp = 0.00
      ELSE
           M.seria = '        '
      ENDI
      _CUROBJ = OBJNUM(M.crt)
      SELE tranzact
      SET ORDER TO pun_op DESCENDING
      SEEK STR(M.c_operat, 10)
      IF FOUND()
           tot_linii = crt
      ELSE
           tot_linii = 0
      ENDI
      SHOW GET tot_linii
 ENDI
 SHOW GETS
*
PROC sterge
 SELE tranzact
 SET ORDER TO pun_op
 GOTO TOP
 SEEK STR(M.c_operat, 10)+STR(M.crt, 3)
 IF FOUND()
      IF c_adaug=2
           IF unit_mas<>6
                M.tot_int = M.tot_int-ROUND(cantit*pret, 2)
           ELSE
                M.tot_int = M.tot_int-ROUND(pret_comp, 2)
           ENDI
      ENDI
      IF c_adaug=1
           IF unit_mas<>6
                M.tot_ies = M.tot_ies-ROUND(cantit*pret, 2)
           ELSE
                M.tot_ies = M.tot_ies-ROUND(pret_comp, 2)
           ENDI
      ENDI
      SHOW GET M.tot_int
      SHOW GET M.tot_ies
      DELE
      SET PROCEDURE TO LIBRARIE
      = ren_crt()
      SET PROCEDURE TO
      SET PROCEDURE TO LIBRARIE
      = rec_sold()
      SET PROCEDURE TO
      SELE tranzact
      USE
      USE tranzact
      SELE solduri
      USE
      USE solduri
      SELE tranzact
      SET ORDER TO pun_op DESCENDING
      SEEK STR(M.c_operat, 10)
      IF FOUND()
           tot_linii = crt
      ELSE
           tot_linii = 0
      ENDI
      SHOW GET tot_linii
      M.crt = tot_linii+1
      IF M.crt=1
           SELE operatii
           SET ORDER TO pun_oper DESCENDING
           GOTO TOP
           SEEK STR(YEAR(M.c_data), 4)+STR(M.nr_oper, 6)
           IF FOUND()
                DELE
                pun_act = .T.
           ENDI
      ENDI
      SHOW GET M.crt
      M.c_adaug = 2
      M.modific = 0
      _CUROBJ = OBJNUM(cod_den)
      SHOW GET M.sterg DISABLE
      M.seria = '        '
      M.pret_comp = 0.00
      M.cantit = 0.000
      M.pret = 0.00
      SHOW GETS
 ENDI
*
PROC iesire
 SET DELETED OFF
 SELE tranzact
 COUN ALL FOR DELETED()=.T. TO nr
 IF nr<>0
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE REFACE BAZA TRANZACT' COLOR GR+/B,R/W 
      PACK
 ENDI
 USE
 SELE solduri
 COUN ALL FOR DELETED()=.T. TO nr
 IF nr<>0
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE REFACE BAZA SOLDURI' COLOR GR+/B,R/W 
      PACK
 ENDI
 USE
 SELE operatii
 COUN ALL FOR DELETED()=.T. TO nr
 IF nr<>0
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE REFACE BAZA OPERATII' COLOR GR+/B,R/W 
      PACK
 ENDI
 USE
*
FUNC val_cantit
 M.unit_mas = sir_um(M.ce_um,2)
 IF M.c_adaug=2 .AND. M.pret=0.00 .AND. M.unit_mas<>6
      SELE solduri
      SET ORDER TO ord_sor DESCENDING
      SEEK STR(M.cod_den, 8)+STR(M.unit_mas, 2)
      IF FOUND()
           M.pret = solduri.pret
           M.val = ROUND(M.pret*M.cantit, 2)
           IF M.val<>M.cantit*M.pret .AND. M.cantit<>0.000
                M.pret = ROUND(M.val/M.cantit, 2)
           ENDI
           SHOW GET M.pret
      ENDI
 ENDI
 IF M.c_adaug=1
      IF M.cantit>M.max_cant
           M.cantit = M.max_cant
           SHOW GET M.cantit
           RETU .F.
      ENDI
 ENDI
 RETU .T.
*
PROC val_pret
 M.unit_mas = sir_um(M.ce_um,2)
 IF M.c_adaug=2
      M.val = ROUND(M.pret*M.cantit, 2)
      IF M.val<>M.cantit*M.pret .AND. M.cantit<>0.000
           M.pret = ROUND(M.val/M.cantit, 2)
      ENDI
      SHOW GET M.pret
 ENDI
 IF M.c_adaug=2 .AND. M.unit_mas=6 .AND. M.pret_comp=0.00
      M.pret_comp = M.pret
      SHOW GET M.pret_comp
 ENDI
*
FUNC val_seria
 IF M.c_adaug=1
      RETU .T.
 ENDI
 M.unit_mas = sir_um(M.ce_um,2)
 SELE tranzact
 SET ORDER TO pmp
 GOTO TOP
 SEEK STR(M.cod_den, 8)+STR(M.unit_mas, 2)
 nr_cantit = 0
 DO WHILE M.cod_den=cod_den .AND. M.unit_mas=unit_mas
      IF ALLTRIM(UPPER(M.seria))==ALLTRIM(UPPER(seria))
           IF c_adaug=1
                nr_cantit = nr_cantit-A.cantit
           ELSE
                nr_cantit = nr_cantit+A.cantit
           ENDI
      ENDI
      SKIP 1
      IF EOF()
           EXIT
      ENDI
 ENDD
 IF nr_cantit>0
      M.seria = '       '
      SHOW GET M.seria
      _CUROBJ = OBJNUM(M.seria)
      RETU .T.
 ENDI
 RETU .T.
*
PROC get_mater
 PRIV ce_ncrt
 SELE tranzact
 SET ORDER TO pun_op DESCENDING
 GOTO TOP
 SEEK STR(M.c_operat, 10)
 IF FOUND() .AND. crt>998
      RETU
 ENDI
 IF FOUND()
      ce_ncrt = crt+1
 ELSE
      ce_ncrt = 1
 ENDI
 M.cont = sir_cont(M.ce_cont,2)
 M.cod_ges = sir_ges(M.ce_ges,2)
 M.sect = sir_loc(M.ce_loc,2)
 M.c_stoc = sir_uz(M.ce_uz,2)
 SET PROCEDURE TO LIBRARIE
 M.cod_den = get_materi()
 SET PROCEDURE TO
 IF M.cod_den=0
      M.nume = ''
      SHOW GET M.nume
      SHOW GET M.cod_den
      _CUROBJ = OBJNUM(M.ce_cont)
      RETU
 ENDI
 M.fisa = -1
 M.crt = ce_ncrt
 M.modific = 0
 = setare_den()
 _CUROBJ = OBJNUM(M.ce_um)
 SHOW GETS
*
FUNC wen_adaug
 IF M.cod_doc=1
      M.c_adaug = 2
      SHOW GET M.c_adaug
      RETU .F.
 ENDI
 IF M.modific=1
      RETU .F.
 ENDI
 IF M.c_adaug=1
      SELE tranzact
      SET ORDER TO pun_op DESCENDING
      GOTO TOP
      SEEK STR(M.c_operat, 10)
      IF FOUND()
           DO WHILE M.c_operat=c_operat
                IF c_adaug=1
                     M.cont = tranzact.cont
                     M.cod_ges = tranzact.cod_ges
                     M.c_stoc = tranzact.c_stoc
                     M.sect = tranzact.sect
                     = add_caract()
                     M.cod_den = 0
                     M.nume = ''
                     SHOW GETS
                     RETU .T.
                ENDI
                SKIP 1
                IF EOF()
                     EXIT
                ENDI
           ENDD
      ENDI
      RETU .T.
 ENDI
 IF M.c_adaug=2
      SELE tranzact
      SET ORDER TO pun_op DESCENDING
      GOTO TOP
      SEEK STR(M.c_operat, 10)
      M.ver_intr = .F.
      M.ver_ies = .F.
      IF FOUND()
           DO WHILE M.c_operat=c_operat
                IF c_adaug=1
                     M.cod_den = tranzact.cod_den
                     M.cantit = tranzact.cantit
                     M.pret = tranzact.pret
                     M.unit_mas = tranzact.unit_mas
                     M.stare = tranzact.stare
                     M.cod_fin = tranzact.cod_fin
                     M.cod_prov = tranzact.cod_prov
                     M.seria = tranzact.seria
                     M.pret_comp = tranzact.pret_comp
                     M.data_intr = tranzact.data_intr
                     M.proc = tranzact.proc
                     M.proc_act = calc_proc()
                     M.proc = M.proc_act
                     M.data_intr = M.c_data
                     SELE material
                     SET ORDER TO COD
                     GOTO TOP
                     SEEK M.cod_den
                     M.nume = nume
                     SELE tranzact
                     M.ver_ies = .T.
                     IF M.ver_intr=.T.
                          EXIT
                     ENDI
                ENDI
                IF c_adaug=2
                     M.cont = tranzact.cont
                     M.cod_ges = tranzact.cod_ges
                     M.c_stoc = tranzact.c_stoc
                     M.sect = tranzact.sect
                     M.ver_intr = .T.
                     IF M.ver_ies=.T.
                          EXIT
                     ENDI
                ENDI
                SKIP 1
                IF EOF()
                     EXIT
                ENDI
           ENDD
           = add_caract()
           SHOW GETS
      ELSE
           RETU .T.
      ENDI
 ENDI
 RETU .T.
*
FUNC ies_mat
 PRIV tab_var[ 10]
 = incarc_var()
 IF M.unit_mas<>6 .AND. M.modific=0
      SELE solduri
      SET FILTER TO cantit>0 .AND. cod_den=M.cod_den .AND. cont=M.cont .AND. unit_mas<>6
      COUN FOR sect=M.sect .AND. cod_ges=M.cod_ges .AND. c_stoc=M.c_stoc TO nr
      IF nr=0
           SET FILTER TO
           RETU .F.
      ENDI
      IF nr>1
           titlu = 'Fisa = '+STR(M.cod_den, 6)+'  '+M.nume
           titlu = ALLTRIM(titlu)
           SET RELATION TO solduri.unit_mas INTO unit_mas ADDITIVE
           SET RELATION TO solduri.stare INTO stare ADDITIVE
           SET RELATION TO solduri.cod_prov INTO provenie ADDITIVE
           SET RELATION TO solduri.cod_fin INTO finantat ADDITIVE
           BROW FOR sect=M.sect .AND. cod_ges=M.cod_ges .AND. c_stoc=M.c_stoc FIELDS cantitate = solduri.cantit, unit_mas = unit_mas.nume_u, starea = stare.den_sc, intrat = data_intr, procent = proc, finantare = finantat.den, provenient = provenie.den NOAPPEND NOEDIT NODELETE WINDOW fer_brow TITLE titlu
           SET RELATION OFF INTO unit_mas
           SET RELATION OFF INTO stare
           SET RELATION OFF INTO finantat
           SET RELATION OFF INTO provenie
      ELSE
           GOTO TOP
           LOCA FOR sect=M.sect .AND. cod_ges=M.cod_ges .AND. c_stoc=M.c_stoc
      ENDI
      M.max_cant = cantit
      M.cantit = cantit
      M.unit_mas = unit_mas
      M.cod_fin = cod_fin
      M.cod_prov = cod_prov
      M.stare = stare
      M.data_intr = data_intr
      M.proc = proc
      M.pret = pret
      M.proc_act = calc_proc()
      SET FILTER TO
      = add_caract()
      SHOW GETS
      RETU .T.
 ENDI
 IF M.unit_mas<>6 .AND. M.modific=1
      SELE solduri
      IF FILE('MANEVRA.DBF')
           ERAS 'MANEVRA.DBF'
      ENDI
      COPY TO MANEVRA.DBF STRUCTURE
      SELE 0
      USE manevra
      SELE tranzact
      SET ORDER TO pun_op
      SEEK STR(M.c_operat, 10)+STR(M.crt, 3)
      SELE solduri
      SET FILTER TO cantit>=0 .AND. cod_den=A.cod_den .AND. cont=A.cont .AND. unit_mas<>6
      GOTO TOP
      DO WHILE  .NOT. EOF()
           IF sect=A.sect .AND. cod_ges=A.cod_ges .AND. c_stoc=A.c_stoc
                SCAT TO tab_var
                SELE manevra
                APPE BLANK
                GATH FROM tab_var
                IF cod_prov=A.cod_prov .AND. cod_fin=A.cod_fin
                     IF unit_mas=A.unit_mas .AND. stare=A.stare
                          IF data_intr=A.data_intr .AND. proc=A.proc
                               REPL cantit WITH cantit+A.cantit
                          ENDI
                     ENDI
                ENDI
                SELE solduri
           ENDI
           SKIP 1
      ENDD
      SELE solduri
      SET FILTER TO
      SELE manevra
      DELE ALL FOR cantit<=0
      PACK
      COUN ALL TO nr
      IF nr=0
           SELE manevra
           USE
           ERAS 'MANEVRA.DBF'
           RETU .F.
      ENDI
      IF nr>1
           titlu = 'Fisa = '+STR(M.cod_den, 6)+'  '+M.nume
           titlu = ALLTRIM(titlu)
           SET RELATION TO manevra.unit_mas INTO unit_mas ADDITIVE
           SET RELATION TO manevra.stare INTO stare ADDITIVE
           SET RELATION TO manevra.cod_prov INTO provenie ADDITIVE
           SET RELATION TO manevra.cod_fin INTO finantat ADDITIVE
           BROW FOR sect=M.sect .AND. cod_ges=M.cod_ges .AND. c_stoc=M.c_stoc FIELDS cantitate = cantit, unit_mas = unit_mas.nume_u, starea = stare.den_sc, intrat = data_intr, procent = proc, finantare = finantat.den, provenient = provenie.den NOAPPEND NOEDIT NODELETE WINDOW fer_brow TITLE titlu
           SET RELATION OFF INTO unit_mas
           SET RELATION OFF INTO stare
           SET RELATION OFF INTO finantat
           SET RELATION OFF INTO provenie
      ELSE
           GOTO TOP
           LOCA FOR sect=M.sect .AND. cod_ges=M.cod_ges .AND. c_stoc=M.c_stoc
      ENDI
      M.max_cant = cantit
      M.cantit = cantit
      M.unit_mas = unit_mas
      M.cod_fin = cod_fin
      M.cod_prov = cod_prov
      M.stare = stare
      M.data_intr = data_intr
      M.proc = proc
      M.pret = pret
      M.proc_act = calc_proc()
      = add_caract()
      SHOW GETS
      SELE manevra
      USE
      ERAS 'MANEVRA.DBF'
      RETU .T.
 ENDI
 RETU .F.
*
FUNC ies_cpl
 PRIV tab_var[ 10]
 = incarc_var()
 SELE tranzact
 SET FILTER TO unit_mas=6 .AND. cantit>=0 .AND. cod_den=M.cod_den .AND. cont=M.cont
 COUN FOR sect=M.sect .AND. cod_ges=M.cod_ges .AND. c_stoc=M.c_stoc TO nr
 IF nr=0
      SET FILTER TO
      RETU .F.
 ENDI
 IF FILE('MANEVRA.DBF')
      ERAS 'MANEVRA.DBF'
 ENDI
 COPY TO MANEVRA.DBF STRUCTURE
 SELE 0
 USE manevra
 SELE tranzact
 GOTO TOP
 DO WHILE  .NOT. EOF()
      IF sect=M.sect .AND. cod_ges=M.cod_ges .AND. c_stoc=M.c_stoc
           SCAT TO tab_var
           SELE manevra
           LOCA FOR cod_prov=A.cod_prov .AND. cod_fin=A.cod_fin .AND. stare=A.stare .AND. stare=A.stare .AND. seria==A.seria .AND. data_intr=A.data_intr .AND. proc=A.proc
           IF FOUND()
                IF A.c_adaug=1
                     IF  .NOT. (A.c_operat=M.c_operat .AND. A.crt=M.crt)
                          REPL cantit WITH cantit-A.cantit
                          REPL pret_comp WITH pret_comp-A.pret_comp
                     ENDI
                ENDI
                IF A.c_adaug=2
                     IF  .NOT. (A.c_operat=M.c_operat .AND. A.crt=M.crt)
                          REPL cantit WITH cantit+A.cantit
                          REPL pret_comp WITH pret_comp+A.pret_comp
                     ENDI
                ENDI
           ELSE
                APPE BLANK
                GATH FROM tab_var
                IF c_adaug=1
                     REPL cantit WITH 0.000, pret_comp WITH 0.00
                     REPL cantit WITH cantit-A.cantit
                     REPL pret_comp WITH pret_comp-A.pret_comp
                ENDI
           ENDI
      ENDI
      SELE tranzact
      SKIP 1
 ENDD
 SELE tranzact
 SET FILTER TO
 SELE manevra
 DELE ALL FOR cantit<=0.000
 PACK
 IF M.c_adaug=2
      APPE BLANK
      GATH MEMVAR
      REPL seria WITH 'CPL.NOU'
      REPL data_intr WITH M.c_data
      REPL proc WITH 0.000
 ENDI
 COUN ALL TO nr
 IF nr=0
      SELE manevra
      USE
      ERAS 'MANEVRA.DBF'
      RETU .F.
 ENDI
 IF nr>1
      titlu = 'Fisa = '+STR(M.cod_den, 6)+'  '+M.nume
      titlu = ALLTRIM(titlu)
      SET RELATION TO manevra.unit_mas INTO unit_mas ADDITIVE
      SET RELATION TO manevra.stare INTO stare ADDITIVE
      SET RELATION TO manevra.cod_prov INTO provenie ADDITIVE
      SET RELATION TO manevra.cod_fin INTO finantat ADDITIVE
      BROW FOR sect=M.sect .AND. cod_ges=M.cod_ges .AND. c_stoc=M.c_stoc FIELDS cant = cantit : 5, seria = seria, val_actual = pret_comp, starea = stare.den_sc, intrat = data_intr, procent = proc, finantare = finantat.den, provenient = provenie.den NOAPPEND NOEDIT NODELETE WINDOW fer_brow TITLE titlu
      SET RELATION OFF INTO unit_mas
      SET RELATION OFF INTO stare
      SET RELATION OFF INTO finantat
      SET RELATION OFF INTO provenie
 ELSE
      GOTO TOP
 ENDI
 M.max_cant = cantit
 M.cantit = cantit
 M.unit_mas = unit_mas
 M.cod_fin = cod_fin
 M.cod_prov = cod_prov
 M.stare = stare
 M.pret_comp = ROUND(pret_comp, 2)
 M.max_pret = M.pret_comp
 M.pret = pret
 M.seria = seria
 M.data_intr = data_intr
 M.proc = proc
 M.proc_act = calc_proc()
 IF ALLTRIM(M.seria)='CPL.NOU'
      M.seria = '        '
 ENDI
 = add_caract()
 IF LEN(ALLTRIM(M.seria))=0
      M.cantit = 1.000
      _CUROBJ = OBJNUM(M.pret)
 ENDI
 IF LEN(ALLTRIM(M.seria))<>0 .AND. M.modific=0
      M.cantit = 0.000
 ENDI
 SHOW GETS
 SELE manevra
 USE
 ERAS 'MANEVRA.DBF'
 RETU .T.
*
FUNC wen_cantit
 IF M.c_adaug=1 .AND. sir_um(M.ce_um,2)<>6
      bine = ies_mat()
      RETU bine
 ENDI
 IF sir_um(M.ce_um,2)=6
      bine = ies_cpl()
      RETU bine
 ENDI
*
PROC _04h0jvytt
 IF M.c_operat>M.max_op+1
      M.c_operat = M.max_op+1
      SHOW GET M.c_operat
 ENDI
*
PROC _04h0jvyu1
 M.cod_doc = sir_act(M.ce_act,2)
*
PROC _04h0jvyu7
 M.crt = M.crt-1
 M.modific = 0
 SHOW GET M.crt
 = val_crt()
 _CUROBJ = OBJNUM(M.prec)
*
PROC _04h0jvyud
 M.crt = M.crt+1
 M.modific = 0
 IF M.crt<=tot_linii
      SHOW GET M.crt
      = val_crt()
      _CUROBJ = OBJNUM(M.urm)
 ENDI
 IF M.crt>tot_linii
      SHOW GET M.crt
      M.cantit = 0.00
      SHOW GET M.crt
      = val_crt()
      _CUROBJ = OBJNUM(M.cod_den)
 ENDI
*
PROC _04h0jvyum
 M.cont = sir_cont(M.ce_cont,2)
*
PROC _04h0jvyuq
 M.c_stoc = sir_uz(M.ce_uz,2)
*
PROC _04h0jvyuv
 M.cod_ges = sir_ges(M.ce_ges,2)
*
PROC _04h0jvyuz
 M.sect = sir_loc(M.ce_loc,2)
*
PROC _04h0jvyvc
 = calc_proc()
 SHOW GET M.proc_act
*
PROC _04h0jvyvi
 = calc_proc()
 SHOW GET M.proc_act
*
FUNC _04h0jvyvn
 bine = val_seria()
 RETU bine
*
PROC _04h0jvyvs
 M.pret_comp = INT(M.pret_comp)
 SHOW GET M.pret_comp
 IF M.c_adaug=1 .AND. M.pret_comp>=M.max_pret
      M.pret_comp = M.max_pret
      M.cantit = 1.000
      SHOW GET M.pret_comp
      SHOW GET M.cantit
 ENDI
 IF M.c_adaug=1 .AND. M.pret_comp<M.max_pret
      M.cantit = 0.000
      SHOW GET M.cantit
 ENDI
*
