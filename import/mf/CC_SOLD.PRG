 SET TALK OFF
 SET ECHO OFF
 CLOS ALL
 CLEA
 = pun_fis()
 = st_acte()
 = regindex()
 CLEA
 = recalc()
 CLOS ALL
 = st_nr_oper()
 USE UNIT_MAS
 REPL nume_u WITH ALLTRIM(LOWER(nume_u)) ALL
 USE MATERIAL
 REPL nume WITH ALLTRIM(nume) ALL
 CLOS ALL
 CLEA
*
PROC recalc
 PRIV vmat, vunit
 CLOS ALL
 CLEA
 @ 5, 5 SAY 'ASTEPTATI PANA SE RECALCULEAZA SOLDURILE ' COLOR GR+/B,R/W 
 SELE 1
 USE SOLDURI
 DELE ALL
 PACK
 SELE 2
 USE TRANZACT
 SET ORDER TO ORD_SORT DESCENDING
 SELE 2
 GOTO TOP
 DO WHILE  .NOT. EOF()
      SELE tranzact
      SCAT MEMVAR
      cant_sold = 0.000
      e_bine = .T.
      DO WHILE e_bine=.T.
           e_bine = .F.
           IF M.cont=B.cont .AND. M.cod_ges=B.cod_ges .AND. M.cod_prov=B.cod_prov
                IF M.cod_fin=B.cod_fin .AND. M.c_stoc=B.c_stoc .AND. M.sect=B.sect
                     IF M.stare=B.stare .AND. M.cod_den=B.cod_den .AND. M.unit_mas=B.unit_mas
                          IF M.pret=B.pret .AND. M.proc=B.proc .AND. M.data_intr=B.data_intr
                               IF tranzact.c_adaug=2
                                    e_bine = .T.
                                    cant_sold = cant_sold+tranzact.cantit
                               ENDI
                               IF tranzact.c_adaug=1
                                    e_bine = .T.
                                    cant_sold = cant_sold-tranzact.cantit
                               ENDI
                          ENDI
                     ENDI
                ENDI
           ENDI
           SELE tranzact
           IF e_bine=.T.
                SKIP 1
                IF EOF()
                     EXIT
                ENDI
           ENDI
      ENDD
      SELE solduri
      APPE BLANK
      GATH MEMVAR
      REPL cantit WITH cant_sold
      SELE tranzact
      IF EOF()
           EXIT
      ENDI
      SELE tranzact
 ENDD
*
PROC regindex
 CLOS ALL
 CLEA
 RUN COPY INDEXI\*.CDX
 CLEA
 @ 2, 2 SAY 'ASTEPTATI PANA SE REFAC FISIERELE INDEX.' COLOR R/W 
 USE SOLDURI
 REIN
 USE ACTE
 REIN
 USE CONTURI
 REIN
 USE DISPUS
 REIN
 USE FINANTAT
 REIN
 USE TRANZACT
 REIN
 USE GESTIUNI
 REIN
 USE MATERIAL
 REIN
 USE PROVENIE
 REIN
 USE STARE
 REIN
 USE STOC_UZ
 REIN
 USE UNIT_MAS
 REIN
 USE OPERATII
 REIN
 CLOS ALL
*
PROC ren_crt
 CLEA
 @ 5, 5 SAY 'ASTEPTATI PANA SE RENUMEROTEAZA NUMERELE CURENTE. ' COLOR GR+/B,R/W 
 CLOS ALL
 SELE 1
 USE TRANZACT
 SET ORDER TO PUN_OP ASCENDING
 GOTO TOP
 DO WHILE  .NOT. EOF()
      M.op = c_operat
      i = 0
      DO WHILE M.op==A.c_operat
           i = i+1
           REPL A.crt WITH i
           SKIP 1
           IF EOF()
                CLOS ALL
                CLEA
                RETU
           ENDI
      ENDD
 ENDD
*
PROC st_nr_oper
 CLOS ALL
 SELE 1
 USE operatii
 SELE 2
 USE tranzact
 SET ORDER TO pun_op
 SELE 1
 SET RELATION TO STR(YEAR(c_data)*1000000+nr_oper, 10) INTO tranzact ADDITIVE
 DELE ALL FOR EOF(2)
 PACK
 CLOS ALL
*
PROC st_acte
 CLOS ALL
 USE ACTE
 SELE 2
 USE OPERATII
 SELE 1
 LOCA FOR cod=40 .AND. ALLTRIM(den)='ALTE ACTE'
 IF FOUND()
      SELE 2
      LOCA ALL FOR cod_doc=40
      IF  .NOT. FOUND()
           SELE 1
           DELE
           PACK
      ENDI
 ENDI
 CLOS ALL
*
PROC pun_fis
 CLOS ALL
 IF FILE('TRANZACT.DBF')
      RETU
 ENDI
 RUN COPY INDEXI\*.DBF
 CLEA
 RETU
*
