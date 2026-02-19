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
 PUBL M.toti_cant, M.tote_cant, M.toti_val, M.tote_val
 PUBL M.intr_cant, M.intr_val, M.ies_cant, M.ies_val
 PUBL M.stoc_cant, M.stoc_val, M.proc
 PUBL nu_verific, M.ce_oper
 CLEA
 @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
 CLOS ALL
 IF FILE('MANEVRA.DBF')
      ERAS 'MANEVRA.DBF'
 ENDI
 IF FILE('MANEVRA.IDX')
      ERAS 'MANEVRA.IDX'
 ENDI
 SELE 1
 USE TRANZACT
 COPY TO MANEVRA.DBF STRUCTURE
 SELE 1
 SET ORDER TO ord_fisa ASCENDING
 SELE 2
 USE MANEVRA
 INDE ON STR(cod_den, 8)+STR(unit_mas, 2)+STR(stare, 1)+STR(c_operat, 10)+STR(crt, 3) TO MANEVRA.IDX
 SET INDEX TO MANEVRA.IDX
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
 SELE 8
 USE STARE
 SET ORDER TO COD
 SELE 9
 USE ACTE
 SET ORDER TO COD
 SELE operatii
 SET RELATION TO cod_doc INTO acte ADDITIVE
 SELE 1
 SET RELATION TO STR(c_operat, 10) INTO operatii ADDITIVE
 SET RELATION TO cod_den INTO material ADDITIVE
 SET RELATION TO unit_mas INTO unit_mas ADDITIVE
 SET RELATION TO stare INTO stare ADDITIVE
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
 SELE 1
 SET FILTER TO operatii.c_data<=M.datai
 GOTO TOP
 DO WHILE  .NOT. EOF()
      = det_sold()
      IF M.stoc_val<>0 .OR. M.stoc_cant<>0
           SELE 2
           APPE BLANK
           GATH MEMVAR
           REPL c_operat WITH 0
           REPL cantit WITH M.stoc_cant
           REPL pret WITH M.stoc_val
           REPL c_adaug WITH 2
      ENDI
      SELE 1
 ENDD
 SELE 1
 SET FILTER TO operatii.c_data>M.datai .AND. operatii.c_data<=M.datas
 GOTO TOP
 DO WHILE  .NOT. EOF()
      bine = verific()
      IF bine=.T.
           SELE 1
           SCAT MEMVAR
           SELE manevra
           APPE BLANK
           GATH MEMVAR
      ENDI
      SELE 1
      SKIP 1
 ENDD
 SELE manevra
 COUN ALL TO nr
 IF nr=0
      CLOS ALL
      ERAS 'MANEVRA.DBF'
      ERAS 'MANEVRA.IDX'
      CLOS ALL
      CLEA MEMO
      RETU
 ENDI
 GOTO TOP
 SET RELATION TO STR(c_operat, 10) INTO operatii ADDITIVE
 SET RELATION TO cod_den INTO material ADDITIVE
 SET RELATION TO unit_mas INTO unit_mas ADDITIVE
 SET RELATION TO stare INTO stare ADDITIVE
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
 USE RAPORT1.FRX
 REPL height WITH _PLENGTH
 USE
 SELE manevra
 IF se_listeaz=.T.
      PRIN
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE LISTEAZA LA IMPRIMANTA ' COLOR GR+/B,R/W 
      REPO FORMAT RAPORT1 TO PRINTER NOCONSOLE
      ENDP
 ELSE
      DEFI WINDOW vizualiz FROM 0, 0 TO 24, 79 SYSTEM COLOR ,,,,BG/N,W+/B,,,B/W 
      IF FILE('FISA_MAT.TXT')
           ERAS 'FISA_MAT.TXT'
      ENDI
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
      SET PRINTER TO FISA_MAT.txt
      PRIN
      REPO FORMAT RAPORT1 TO PRINTER NOCONSOLE
      ENDP
      SET PRINTER TO
      MODI COMMAND 'FISA_MAT.TXT' NOEDIT WINDOW vizualiz
      RELE WINDOW vizualiz
 ENDI
 CLEA
 SET EXACT OFF
 CLOS ALL
 ERAS 'MANEVRA.DBF'
 ERAS 'MANEVRA.IDX'
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
      SELE conturi
      SEEK A.cont
      IF SUBSTR(conturi.cont, 1, i(9))==SUBSTR(i(1), 1, i(9))
           SELE 1
           RETU .T.
      ELSE
           SELE 1
           RETU .F.
      ENDI
 ENDI
 RETU .T.
*
FUNC resetari
 STOR 0.000 TO M.toti_cant, M.tote_cant, M.stoc_cant
 STOR 0 TO M.toti_val, M.tote_val, M.stoc_val
 STOR 0.000 TO M.intr_cant, M.ies_cant
 STOR 0 TO M.intr_val, M.ies_val
 RETU 0
*
FUNC reev_sold
 IF A.c_adaug=1
      IF A.unit_mas<>6
           M.stoc_val = M.stoc_val-ROUND(A.cantit*A.pret, 2)
      ELSE
           M.stoc_val = M.stoc_val-ROUND(A.pret_comp, 2)
      ENDI
      M.stoc_cant = M.stoc_cant-A.cantit
      RETU 0
 ENDI
 IF A.c_adaug=2
      IF A.unit_mas<>6
           M.stoc_val = M.stoc_val+ROUND(A.cantit*A.pret, 2)
      ELSE
           M.stoc_val = M.stoc_val+ROUND(A.pret_comp, 2)
      ENDI
      M.stoc_cant = M.stoc_cant+A.cantit
      RETU 0
 ENDI
 RETU 0
*
FUNC reev_misc
 = calc_proc()
 IF B.c_operat=0
      = resetari()
      M.intr_val = ROUND(B.pret, 2)
      M.intr_cant = B.cantit
      M.toti_cant = B.cantit
      M.tote_cant = 0.000
      M.toti_val = ROUND(B.pret, 2)
      M.tote_val = 0
      M.stoc_cant = M.stoc_cant+M.intr_cant
      M.stoc_val = M.stoc_val+M.intr_val
      RETU 0
 ENDI
 IF B.c_adaug=1
      IF B.unit_mas<>6
           M.ies_val = ROUND(B.cantit*B.pret, 2)
      ELSE
           M.ies_val = ROUND(B.pret_comp, 2)
      ENDI
      M.ies_cant = B.cantit
      M.intr_val = 0
      M.intr_cant = 0.000
      M.stoc_cant = M.stoc_cant-M.ies_cant
      M.stoc_val = M.stoc_val-M.ies_val
 ENDI
 IF B.c_adaug=2
      IF B.unit_mas<>6
           M.intr_val = ROUND(B.cantit*B.pret, 2)
      ELSE
           M.intr_val = ROUND(B.pret_comp, 2)
      ENDI
      M.intr_cant = B.cantit
      M.stoc_cant = M.stoc_cant+M.intr_cant
      M.stoc_val = M.stoc_val+M.intr_val
      M.ies_cant = 0.00
      M.ies_val = 0
 ENDI
 M.toti_cant = M.toti_cant+M.intr_cant
 M.tote_cant = M.tote_cant+M.ies_cant
 M.toti_val = M.toti_val+M.intr_val
 M.tote_val = M.tote_val+M.ies_val
 RETU 0
*
FUNC det_sold
 SELE 1
 = resetari()
 SCAT MEMVAR
 DO WHILE A.cod_den=M.cod_den .AND. A.unit_mas=M.unit_mas .AND. A.stare=M.stare
      bine = verific()
      IF bine=.T.
           SELE 1
           = reev_sold()
      ENDI
      SKIP 1
      IF EOF()
           EXIT
      ENDI
 ENDD
 RETU 0
*
FUNC calc_proc
 IF c_operat=0
      M.proc = -1
      RETU 0
 ENDI
 IF c_stoc=0
      IF material.zile<>0
           M.proc = proc+ROUND((M.datas-data_intr)*100/material.zile, 3)
      ELSE
           IF proc=0
                M.proc = -1
           ELSE
                M.proc = proc
           ENDI
      ENDI
 ENDI
 IF c_stoc=1
      IF material.zile1<>0
           M.proc = proc+ROUND((M.datas-data_intr)*100/material.zile1, 3)
      ELSE
           IF proc=0
                M.proc = -1
           ELSE
                M.proc = proc
           ENDI
      ENDI
 ENDI
 IF c_stoc=2
      IF material.zile2<>0
           M.proc = proc+ROUND((M.datas-data_intr)*100/material.zile2, 3)
      ELSE
           IF proc=0
                M.proc = -1
           ELSE
                M.proc = proc
           ENDI
      ENDI
 ENDI
 RETU 0
*
