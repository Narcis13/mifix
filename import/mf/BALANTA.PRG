 SET TALK OFF
 SET ECHO OFF
 SET EXACT OFF
 SET DATE TO GERMAN
 SET CENTURY ON
 SET DECIMALS TO 2
 CLEA
 DO BAL_FISE.SPR
 IF M.executa<>1
      CLEA MEMO
      CLOS ALL
      CLEA
      RETU
 ENDI
 CLOS ALL
 CLEA
 DO interog.spr
 IF M.executa=0
      CLOS ALL
      RETU
 ENDI
 PUBL M.sold, M.intr, M.iesi, nu_verific
 PUBL M.tsold, M.tintr, M.tiesi
 STOR 0.00 TO M.tsold, M.tintr, M.tiesi
 i[ 1] = ALLTRIM(i(1))
 nu_verific = .T.
 IF i(9)=0
      FOR j = 2 TO 8
           IF i(j)<>-1
                nu_verific = .F.
           ENDI
      ENDF
 ELSE
      nu_verific = .F.
 ENDI
 CLEA
 CLOS ALL
 SELE 1
 USE TRANZACT
 SET ORDER TO CONT
 SELE 2
 USE OPERATII
 SET ORDER TO ORD_ACT
 SELE 1
 SET RELATION TO STR(c_operat, 10) INTO operatii ADDITIVE
 SELE 3
 USE CONTURI
 SET ORDER TO COD_CONT
 REPL val1 WITH 0, val2 WITH 0, val3 WITH 0 ALL
 SET FILTER TO titlu=.F.
 SELE 4
 USE FINANTAT
 SET ORDER TO COD
 SELE 5
 USE CONTURI.DBF AGAIN ALIAS conturi_a
 SET ORDER TO COD_CONT
 SELE 1
 GOTO TOP
 DO WHILE  .NOT. EOF()
      M.cont = A.cont
      M.sold = 0.00
      M.intr = 0.00
      M.iesi = 0.00
      DO WHILE M.cont==A.cont
           IF operatii.c_data<M.datai
                = reev_sold()
           ENDI
           IF M.datai<=operatii.c_data .AND. operatii.c_data<=M.datas
                = reev_misc()
           ENDI
           SKIP 1
           IF EOF()
                EXIT
           ENDI
      ENDD
      SELE conturi
      SEEK M.cont
      IF FOUND()
           REPL val1 WITH M.sold, val2 WITH M.intr, val3 WITH M.iesi
           M.tsold = M.tsold+M.sold
           M.tintr = M.tintr+M.intr
           M.tiesi = M.tiesi+M.iesi
      ENDI
      SELE 1
 ENDD
 CLOS ALL
 SELE 1
 USE CONTURI
 SET ORDER TO CONT
 SET FILTER TO titlu=.T.
 SELE 2
 USE CONTURI AGAIN ALIAS conturi_a
 SET FILTER TO val1<>0 .OR. val2<>0 .OR. val3<>0
 SET EXACT OFF
 SELE 1
 GOTO TOP
 DO WHILE  .NOT. EOF()
      M.cont = ALLTRIM(A.cont)
      l = LEN(M.cont)
      SELE 2
      CALC FOR SUBSTR(B.cont, 1, l)==M.cont SUM (val1), SUM (val2), SUM (val3) TO M.val1, M.val2, M.val3
      SELE 1
      REPL val1 WITH M.val1, val2 WITH M.val2, val3 WITH M.val3
      SKIP 1
 ENDD
 SELE 1
 SET FILTER TO val1<>0 .OR. val2<>0 .OR. val3<>0
 COUN ALL TO nr
 IF nr=0
      CLEA MEMO
      CLOS ALL
      CLEA
      RETU
 ENDI
 GOTO TOP
 CLEA
 list = 'N'
 @ 3, 5 SAY 'SITUATIA SE LISTEAZA LA IMPRIMANTA       =    ' COLOR GR+/B,R/W  GET list SIZE 1, 1
 READ
 se_listeaz = .F.
 IF list='D' .OR. list='d'
      se_listeaz = .T.
 ENDI
 CLEA
 SET PROCEDURE TO librarie
 = set_print()
 SET PROCEDURE TO
 SELE 0
 USE BALANTA.FRX
 REPL height WITH _PLENGTH
 USE
 SELE 1
 IF se_listeaz=.T.
      PRIN
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE LISTEAZA LA IMPRIMANTA ' COLOR GR+/B,R/W 
      REPO FORMAT BALANTA TO PRINTER NOCONSOLE
      ENDP
 ELSE
      DEFI WINDOW vizualiz FROM 0, 0 TO 24, 79 SYSTEM COLOR ,,,,BG/N,W+/B,,,B/W 
      IF FILE('BALANTA.TXT')
           ERAS 'BALANTA.TXT'
      ENDI
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
      SET PRINTER TO BALANTA.txt
      PRIN
      REPO FORMAT BALANTA TO PRINTER NOCONSOLE
      ENDP
      SET PRINTER TO
      MODI COMMAND 'BALANTA.TXT' NOEDIT WINDOW vizualiz
      RELE WINDOW vizualiz
 ENDI
 CLEA
 SET EXACT OFF
 CLOS ALL
 CLEA MEMO
*
PROC reev_sold
 PRIV filtru
 filtru = verific()
 IF filtru=.T.
      IF c_adaug=1
           IF unit_mas<>6
                M.sold = M.sold-ROUND(cantit*pret, 2)
           ELSE
                M.sold = M.sold-ROUND(pret_comp, 2)
           ENDI
           RETU
      ENDI
      IF c_adaug=2
           IF unit_mas<>6
                M.sold = M.sold+ROUND(cantit*pret, 2)
           ELSE
                M.sold = M.sold+ROUND(pret_comp, 2)
           ENDI
           RETU
      ENDI
 ENDI
*
PROC reev_misc
 PRIV filtru
 filtru = verific()
 IF filtru=.T.
      IF c_adaug=1
           IF unit_mas<>6
                M.iesi = M.iesi+ROUND(cantit*pret, 2)
           ELSE
                M.iesi = M.iesi+ROUND(pret_comp, 2)
           ENDI
           RETU
      ENDI
      IF c_adaug=2
           IF unit_mas<>6
                M.intr = M.intr+ROUND(cantit*pret, 2)
           ELSE
                M.intr = M.intr+ROUND(pret_comp, 2)
           ENDI
           RETU
      ENDI
 ENDI
*
FUNC verific
 IF nu_verific=.T.
      RETU .T.
 ENDI
 IF i(2)<>-1
      IF i(2)<>cod_den
           RETU .F.
      ENDI
 ENDI
 IF i(3)<>-1
      IF i(3)<>cod_ges
           RETU .F.
      ENDI
 ENDI
 IF i(4)<>-1
      IF i(4)<>c_stoc
           RETU .F.
      ENDI
 ENDI
 IF i(5)<>-1
      IF i(5)<>sect
           RETU .F.
      ENDI
 ENDI
 IF i(6)<>-1
      IF i(6)<>cod_prov
           RETU .F.
      ENDI
 ENDI
 IF i(8)<>-1
      IF i(8)<>stare
           RETU .F.
      ENDI
 ENDI
 IF i(7)<>-1
      SELE finantat
      SEEK A.cod_fin
      IF i(7)<>finantat.cod
           IF  .NOT. (i(7)=finantat.cod_cap1 .OR. i(7)=finantat.cod_cap2)
                SELE 1
                RETU .F.
           ENDI
      ENDI
      SELE 1
 ENDI
 IF i(9)<>0
      SELE conturi_a
      SEEK A.cont
      IF SUBSTR(conturi_a.cont, 1, i(9))==SUBSTR(i(1), 1, i(9))
           SELE 1
           RETU .T.
      ELSE
           SELE 1
           RETU .F.
      ENDI
 ENDI
 RETU .T.
*
