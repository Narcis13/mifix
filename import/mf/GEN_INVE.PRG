 SET TALK OFF
 SET ECHO OFF
 SET EXACT OFF
 SET DATE TO GERMAN
 SET CENTURY ON
 SET DECIMALS TO 3
 CLEA
 PUBL M.executa
 PUBL M.datai, M.datas
 M.datai = DATE()
 M.datas = DATE()
 @ 2, 2 SAY 'LISTA DE INVENTARIERE LA DATA DE = ' GET M.datas DEFAULT {} RANGE {01/01/98},{01/01/2100}
 READ
 CLEA
 M.datai = M.datas
 IF M.datas={}
      CLOS ALL
      RETU
 ENDI
 DO interog.spr
 IF M.executa=0
      CLOS ALL
      RETU
 ENDI
 PUBL M.csold, M.cintr, M.ciesi
 PUBL M.vsold, M.vintr, M.viesi
 PUBL M.tsold, M.tintr, M.tiesi
 PUBL nu_verific, M.ce_oper
 STOR 0.00 TO M.tsold, M.tintr, M.tiesi
 STOR 0.00 TO M.vsold, M.vintr, M.viesi
 STOR 0.00 TO M.csold, M.cintr, M.ciesi
 CLEA
 @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
 CLOS ALL
 USE OPERATII
 CALC FOR YEAR(c_data)=YEAR(M.datas) .AND. c_data<=M.datas MAX (nr_oper) TO M.ce_oper
 M.ce_oper = YEAR(M.datas)*1000000+M.ce_oper
 CLOS ALL
 SELE 1
 USE TRANZACT
 SELE 2
 USE TRANZACT AGAIN ALIAS tranzact_a
 SET ORDER TO ORD_SORT ASCENDING
 SET FILTER TO c_operat<=M.ce_oper
 SELE 3
 USE UNIT_MAS
 SET ORDER TO COD_U
 SELE 4
 USE MATERIAL
 SET ORDER TO COD
 SELE 5
 USE CONTURI
 SET ORDER TO COD_CONT
 SELE 6
 USE OPERATII
 SET ORDER TO ORD_ACT
 SELE 7
 USE FINANTAT
 SET ORDER TO COD
 SELE 2
 SET RELATION TO STR(tranzact_a.c_operat, 10) INTO operatii ADDITIVE
 SET RELATION TO tranzact_a.cont INTO conturi ADDITIVE
 SET RELATION TO tranzact_a.cod_fin INTO finantat ADDITIVE
 SELE 8
 USE STARE
 SET ORDER TO COD
 SELE DISTINCT tranzact.cod_den, tranzact.unit_mas, tranzact.stare, tranzact.pret FROM TRANZACT WHERE c_operat<=M.ce_oper AND IIF(i(2)=-1, -1, cod_den)=i(2) AND IIF(i(3)=-1, -1, cod_ges)=i(3) AND IIF(i(4)=-1, -1, c_stoc)=i(4) AND IIF(i(5)=-1, -1, sect)=i(5) AND IIF(i(6)=-1, -1, cod_prov)=i(6) AND IIF(i(8)=-1, -1, stare)=i(8) GROUP BY tranzact.cod_den, tranzact.unit_mas, tranzact.stare, tranzact.pret ORDER BY tranzact.cod_den, tranzact.unit_mas, tranzact.stare, tranzact.pret INTO CURSOR QUERY
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
 SELE query
 SET RELATION TO query.cod_den INTO material ADDITIVE
 SET RELATION TO query.unit_mas INTO unit_mas ADDITIVE
 SET RELATION TO query.stare INTO stare ADDITIVE
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
 USE gen_inve.FRX
 REPL height WITH _PLENGTH
 USE
 SELE query
 IF se_listeaz=.T.
      PRIN
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE LISTEAZA LA IMPRIMANTA ' COLOR GR+/B,R/W 
      REPO FORMAT gen_inve TO PRINTER NOCONSOLE
      ENDP
 ELSE
      DEFI WINDOW vizualiz FROM 0, 0 TO 24, 79 SYSTEM COLOR ,,,,BG/N,W+/B,,,B/W 
      IF FILE('gen_inve.TXT')
           ERAS 'gen_inve.TXT'
      ENDI
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
      SET PRINTER TO gen_inve.txt
      PRIN
      REPO FORMAT gen_inve TO PRINTER NOCONSOLE
      ENDP
      SET PRINTER TO
      MODI COMMAND 'gen_inve.TXT' NOEDIT WINDOW vizualiz
      RELE WINDOW vizualiz
 ENDI
 CLEA
 SET EXACT OFF
 CLOS ALL
 CLEA MEMO
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
      SELE 2
      IF i(7)<>finantat.cod
           IF  .NOT. (i(7)=finantat.cod_cap1 .OR. i(7)=finantat.cod_cap2)
                RETU .F.
           ENDI
      ENDI
 ENDI
 IF i(9)<>0
      SELE 2
      SELE conturi
      SEEK B.cont
      IF SUBSTR(conturi.cont, 1, i(9))==SUBSTR(i(1), 1, i(9))
           SELE 2
           RETU .T.
      ELSE
           SELE 2
           RETU .F.
      ENDI
 ENDI
 RETU .T.
*
PROC reev_sold
 PRIV filtru
 IF B.c_adaug=1
      filtru = verific()
      IF filtru=.T.
           IF B.unit_mas<>6
                M.vsold = M.vsold-ROUND(B.cantit*B.pret, 2)
           ELSE
                M.vsold = M.vsold-ROUND(B.pret_comp, 2)
           ENDI
           M.csold = M.csold-B.cantit
      ENDI
      RETU
 ENDI
 IF B.c_adaug=2
      filtru = verific()
      IF filtru=.T.
           IF B.unit_mas<>6
                M.vsold = M.vsold+ROUND(B.cantit*B.pret, 2)
           ELSE
                M.vsold = M.vsold+ROUND(B.pret_comp, 2)
           ENDI
           M.csold = M.csold+B.cantit
      ENDI
      RETU
 ENDI
*
PROC reev_misc
 PRIV filtru
 IF B.c_adaug=1
      filtru = verific()
      IF filtru=.T.
           IF B.unit_mas<>6
                M.viesi = M.viesi+ROUND(B.cantit*B.pret, 2)
           ELSE
                M.viesi = M.viesi+ROUND(B.pret_comp, 2)
           ENDI
           M.ciesi = M.ciesi+B.cantit
      ENDI
      RETU
 ENDI
 IF B.c_adaug=2
      filtru = verific()
      IF filtru=.T.
           IF B.unit_mas<>6
                M.vintr = M.vintr+ROUND(B.cantit*B.pret, 2)
           ELSE
                M.vintr = M.vintr+ROUND(B.pret_comp, 2)
           ENDI
           M.cintr = M.cintr+B.cantit
      ENDI
      RETU
 ENDI
*
PROC reset
 STOR 0.00 TO M.vsold, M.vintr, M.viesi
 STOR 0.00 TO M.csold, M.cintr, M.ciesi
*
PROC prelucrez
 SELE 2
 GOTO TOP
 SEEK STR(query.cod_den, 8)+STR(query.unit_mas, 2)+STR(query.stare, 1)+STR(query.pret, 13, 2)
 = reset()
 IF FOUND()
      DO WHILE B.cod_den==query.cod_den .AND. B.unit_mas==query.unit_mas .AND. B.stare==query.stare .AND. B.pret=query.pret
           IF operatii.c_data<M.datai
                = reev_sold()
           ENDI
           IF M.datai<=operatii.c_data .AND. operatii.c_data<=M.datas
                = reev_misc()
           ENDI
           SELE 2
           SKIP 1
           IF EOF()
                EXIT
           ENDI
      ENDD
      M.tsold = M.tsold+M.vsold
      M.tiesi = M.tiesi+M.viesi
      M.tintr = M.tintr+M.vintr
 ENDI
*
FUNC salt
 SELE query
 = reset()
 DO WHILE M.csold==0 .AND. M.cintr==0 .AND. M.ciesi==0
      = prelucrez()
      SELE query
      IF M.csold<>0 .OR. M.cintr<>0 .OR. M.ciesi<>0
           EXIT
      ENDI
      SKIP 1
      IF EOF()
           RETU 0
      ENDI
 ENDD
 RETU 0
*
