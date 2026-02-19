 SET TALK OFF
 SET ECHO OFF
 SET EXACT OFF
 SET DATE TO GERMAN
 SET CENTURY ON
 SET DECIMALS TO 2
 CLOS ALL
 CLEA
 PUBL M.executa
 DO interog.spr
 IF M.executa=0
      CLOS ALL
      RETU
 ENDI
 PUBL titlu, M.datas
 IF M.situatia=1
      titlu = 'SITUATIA OBIECTELOR DE INVENTAR CARE NU AU DATA INTRARII'
 ENDI
 IF M.situatia=2
      M.datas = DATE()
      CLEA
      @ 3, 1 SAY 'SITUATIA OBIECTELOR DE INVENTAR CU TERMENUL DEPASIT LA DATA = ' COLOR GR+/B,R/W  GET M.datas SIZE 1, 10
      READ
      CLEA
      titlu = 'SITUATIA OBIECTELOR DE INVENTAR CU TERMENUL DEPASIT LA DATA DE '+DTOC(M.datas)
 ENDI
 PUBL M.csold, M.vsold, M.tcsold, M.tvsold, M.proc
 PUBL nu_verific
 M.tcsold = 0.000
 M.tvsold = 0
 M.proc = 0.000
 CLEA
 @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
 CLOS ALL
 SELE 1
 USE SOLDURI
 SELE 2
 USE TRANZACT
 SET ORDER TO ORD_SORT ASCENDING
 SELE 3
 USE GESTIUNI
 SET ORDER TO COD
 SELE 4
 USE CONTURI
 SET ORDER TO COD_CONT
 SELE 5
 USE STOC_UZ
 SET ORDER TO COD
 SELE 6
 USE DISPUS
 SET ORDER TO COD
 SELE 7
 USE UNIT_MAS
 SET ORDER TO COD_U
 SELE 8
 USE STARE
 SET ORDER TO COD
 SELE 9
 USE FINANTAT
 SET ORDER TO COD
 SELE 10
 USE PROVENIE
 SET ORDER TO COD
 SELE 11
 USE MATERIAL
 SET ORDER TO COD
 IF M.situatia=1
      SELE cod_den, unit_mas, stare, cont, c_stoc, cod_ges, sect, cod_fin, cod_prov, cantit, pret, data_intr, proc FROM SOLDURI WHERE cantit<>0 AND data_intr={} AND IIF(i(2)=-1, -1, cod_den)=i(2) AND IIF(i(3)=-1, -1, cod_ges)=i(3) AND IIF(i(4)=-1, -1, c_stoc)=i(4) AND IIF(i(5)=-1, -1, sect)=i(5) AND IIF(i(6)=-1, -1, cod_prov)=i(6) AND IIF(i(8)=-1, -1, stare)=i(8) GROUP BY cod_den, unit_mas, stare, cont, c_stoc, cod_ges, sect, cod_fin, cod_prov, cantit, pret, data_intr, proc ORDER BY cod_den, unit_mas, stare, cont, c_stoc, cod_ges, sect, cod_fin, cod_prov, cantit, pret, data_intr, proc INTO CURSOR QUERY
 ENDI
 IF M.situatia=2
      SELE cod_den, unit_mas, stare, cont, c_stoc, cod_ges, sect, cod_fin, cod_prov, cantit, pret, data_intr, proc FROM SOLDURI WHERE cantit<>0 AND data_intr<>{} AND IIF(i(2)=-1, -1, cod_den)=i(2) AND IIF(i(3)=-1, -1, cod_ges)=i(3) AND IIF(i(4)=-1, -1, c_stoc)=i(4) AND IIF(i(5)=-1, -1, sect)=i(5) AND IIF(i(6)=-1, -1, cod_prov)=i(6) AND IIF(i(8)=-1, -1, stare)=i(8) GROUP BY cod_den, unit_mas, stare, cont, c_stoc, cod_ges, sect, cod_fin, cod_prov, cantit, pret, data_intr, proc ORDER BY cod_den, unit_mas, stare, cont, c_stoc, cod_ges, sect, cod_fin, cod_prov, cantit, pret, data_intr, proc INTO CURSOR QUERY
 ENDI
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
 SET RELATION TO query.cod_ges INTO gestiuni ADDITIVE
 SET RELATION TO query.cod_den INTO material ADDITIVE
 SET RELATION TO query.cont INTO conturi ADDITIVE
 SET RELATION TO query.c_stoc INTO stoc_uz ADDITIVE
 SET RELATION TO query.sect INTO dispus ADDITIVE
 SET RELATION TO query.unit_mas INTO unit_mas ADDITIVE
 SET RELATION TO query.stare INTO stare ADDITIVE
 SET RELATION TO query.cod_fin INTO finantat ADDITIVE
 SET RELATION TO query.cod_prov INTO provenie ADDITIVE
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
 USE SIT_OBIE.FRX
 REPL height WITH _PLENGTH
 USE
 SELE query
 IF se_listeaz=.T.
      PRIN
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE LISTEAZA LA IMPRIMANTA ' COLOR GR+/B,R/W 
      REPO FORMAT SIT_OBIE TO PRINTER NOCONSOLE
      ENDP
 ELSE
      DEFI WINDOW vizualiz FROM 0, 0 TO 24, 79 SYSTEM COLOR ,,,,BG/N,W+/B,,,B/W 
      IF FILE('SIT_OBIE.TXT')
           ERAS 'SIT_OBIE.TXT'
      ENDI
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
      SET PRINTER TO SIT_OBIE.txt
      PRIN
      REPO FORMAT SIT_OBIE TO PRINTER NOCONSOLE
      ENDP
      SET PRINTER TO
      MODI COMMAND 'SIT_OBIE.TXT' NOEDIT WINDOW vizualiz
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
 IF i(7)<>-1
      SELE finantat
      SEEK query.cod_fin
      IF i(7)<>finantat.cod
           IF  .NOT. (i(7)=finantat.cod_cap1 .OR. i(7)=finantat.cod_cap2)
                SELE query
                RETU .F.
           ENDI
      ENDI
      SELE query
 ENDI
 IF i(9)<>0
      SELE conturi
      SEEK query.cont
      IF SUBSTR(conturi.cont, 1, i(9))==SUBSTR(i(1), 1, i(9))
           SELE query
           RETU .T.
      ELSE
           SELE query
           RETU .F.
      ENDI
 ENDI
 RETU .T.
*
PROC reset
 STOR 0 TO M.vsold
 STOR 0.000 TO M.csold
*
PROC prelucrez
 SELE query
 bine = verific()
 IF bine=.F.
      RETU
 ENDI
 IF query.unit_mas<>6
      M.csold = query.cantit
      M.vsold = ROUND(M.csold*query.pret, 2)
 ELSE
      SCAT MEMVAR
      SELE tranzact
      filtru = STR(M.cod_den, 8)+STR(M.unit_mas, 2)+STR(M.stare, 1)+STR(M.pret, 13, 2)+DTOS(M.data_intr)+STR(M.proc, 10, 3)+STR(M.cont, 3)+STR(M.cod_ges, 2)+STR(M.c_stoc, 1)+STR(M.sect, 2)+STR(M.cod_fin, 2)+STR(M.cod_prov, 2)
      SEEK filtru
      M.csold = 0.000
      M.vsold = 0
      bine = .T.
      DO WHILE bine=.T.
           bine = .F.
           IF M.cont=cont .AND. M.cod_ges=cod_ges .AND. M.cod_prov=cod_prov
                IF M.cod_fin=cod_fin .AND. M.c_stoc=c_stoc .AND. M.sect=sect
                     IF M.cod_den=cod_den .AND. M.unit_mas=unit_mas .AND. M.stare=stare
                          IF M.pret=pret .AND. M.proc=proc .AND. M.data_intr=data_intr
                               bine = .T.
                               IF tranzact.c_adaug=2
                                    M.csold = M.csold+tranzact.cantit
                                    M.vsold = M.vsold+tranzact.pret_comp
                               ENDI
                               IF tranzact.c_adaug=1
                                    M.csold = M.csold-tranzact.cantit
                                    M.vsold = M.vsold-tranzact.pret_comp
                               ENDI
                          ENDI
                     ENDI
                ENDI
           ENDI
           SKIP 1
           IF EOF()
                EXIT
           ENDI
      ENDD
      M.vsold = ROUND(M.vsold, 2)
 ENDI
 SELE query
 RETU
*
FUNC salt
 SELE query
 = reset()
 DO WHILE M.csold==0 .AND. M.vsold==0
      = prelucrez()
      SELE query
      IF M.csold<>0 .OR. M.vsold<>0
           IF M.situatia=2
                = calc_proc()
                IF M.proc>=100.000
                     EXIT
                ELSE
                     M.csold = 0
                     M.vsold = 0
                     M.proc = 0.000
                ENDI
           ELSE
                EXIT
           ENDI
           SELE query
      ENDI
      SKIP 1
      IF EOF()
           M.tcsold = M.tcsold+M.csold
           M.tvsold = M.tvsold+M.vsold
           RETU 0
      ENDI
 ENDD
 M.tcsold = M.tcsold+M.csold
 M.tvsold = M.tvsold+M.vsold
 RETU 0
*
FUNC calc_proc
 M.proc = 0.000
 IF data_intr={}
      M.proc = proc
      RETU 0
 ENDI
 IF c_stoc=0
      IF material.zile<>0
           M.proc = proc+ROUND((M.datas-data_intr)*100/material.zile, 3)
      ELSE
           M.proc = proc
      ENDI
 ENDI
 IF c_stoc=1
      IF material.zile1<>0
           M.proc = proc+ROUND((M.datas-data_intr)*100/material.zile1, 3)
      ELSE
           M.proc = proc
      ENDI
 ENDI
 IF c_stoc=2
      IF material.zile2<>0
           M.proc = proc+ROUND((M.datas-data_intr)*100/material.zile2, 3)
      ELSE
           M.proc = proc
      ENDI
 ENDI
 RETU 0
*
