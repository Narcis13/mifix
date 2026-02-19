 SET TALK OFF
 SET ECHO OFF
 SET EXACT OFF
 SET DELETED ON
 CLEA
 CLEA MEMO
 var = 1
 DO WHILE var>=0
      CLEA
      sterg = 'N'
      @ 3, 5 SAY 'SIGUR DORITI STERGEREA UNEI OPERATIUNI ? =  ' COLOR GR+/B,R/W  GET sterg SIZE 1, 1
      READ
      se_sterge = .F.
      IF sterg='D' .OR. sterg='d'
           se_sterge = .T.
      ELSE
           CLEA
           RETU
      ENDI
      var = var-1
 ENDD
 CLEA
 DO STERG_OP.SPR
 IF M.ok<>1
      CLEA
      RETU
 ENDI
 CLOS ALL
 PUBL M.c_operat, M.cod_den, M.unit_mas, M.stare, M.cont, M.cod_ges
 PUBL M.c_stoc, M.sect, M.cod_fin, M.crt
 M.ce_op = M.anul*1000000+M.operat
 M.c_operat = M.ce_op
 SELE 1
 USE tranzact
 SET ORDER TO pun_op ASCENDING
 SEEK STR(M.c_operat, 10)
 IF  .NOT. FOUND()
      CLOS ALL
      RETU
 ENDI
 SELE 2
 USE tranzact AGAIN
 SET ORDER TO ord_sort DESCENDING
 SELE 3
 USE solduri
 SET ORDER TO ord_sor ASCENDING
 SELE 4
 USE operatii
 SET ORDER TO pun_oper
 var = verific()
 IF var=.T.
      SELE 1
      SET ORDER TO PUN_OP DESCENDING
      GOTO TOP
      SEEK STR(M.ce_op, 10)
      SELE operatii
      SET ORDER TO PUN_OPER DESCENDING
      GOTO TOP
      SEEK STR(M.anul, 4)+STR(M.operat, 6)
      DELE
      SELE 1
      DO WHILE M.c_operat=A.c_operat
           SELE 1
           SCAT MEMVAR
           DELE
           SET PROCEDURE TO LIBRARIE
           = rec_sold()
           SET PROCEDURE TO
           SELE 1
           SET ORDER TO PUN_OP DESCENDING
           GOTO TOP
           SET EXACT OFF
           SEEK STR(M.ce_op, 10)
           IF  .NOT. FOUND()
                EXIT
           ENDI
      ENDD
      CLOS ALL
      @ 3, 5 SAY 'ASTEPTATI PANA SE REFAC BAZELE DE DATE DUPA STERGERE.'
      USE TRANZACT
      PACK
      USE SOLDURI
      PACK
      USE OPERATII
      PACK
      = st_nr_oper()
 ENDI
 CLOS ALL
 SET DELETED OFF
 RETU
*
FUNC verific
 SELE 1
 SET ORDER TO pun_op DESCENDING
 GOTO TOP
 SEEK STR(M.c_operat, 10)
 bine = .T.
 DO WHILE M.c_operat==A.c_operat
      SELE 2
      SET ORDER TO pmp ASCENDING
      GOTO TOP
      SEEK STR(A.cod_den, 8)+STR(A.unit_mas, 2)+STR(A.c_operat, 10)+STR(A.crt, 3)
      SKIP 1
      IF EOF()
           SELE 1
           SKIP 1
           IF EOF()
                RETU .T.
           ELSE
                LOOP
           ENDI
      ENDI
      DO WHILE A.cod_den=B.cod_den .AND. A.unit_mas=B.unit_mas
           IF A.cont=B.cont .AND. A.sect=B.sect .AND. A.cod_ges=B.cod_ges
                IF A.c_stoc=B.c_stoc .AND. A.cod_prov=B.cod_prov .AND. A.cod_fin=B.cod_fin
                     IF A.stare=B.stare .AND. A.pret=B.pret .AND. A.seria=B.seria
                          IF A.data_intr=B.data_intr .AND. A.proc=B.proc .AND. A.c_adaug<>B.c_adaug
                               IF A.c_operat<>B.c_operat
                                    SCAT MEMVAR
                                    CLOS ALL
                                    USE tranzact
                                    SET ORDER TO pun_op
                                    SEEK STR(M.c_operat, 10)+STR(M.crt, 3)
                                    DO avertiz2.spr
                                    CLOS ALL
                                    RETU .F.
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
      SELE 1
      SKIP 1
      IF EOF()
           RETU .T.
      ENDI
 ENDD
 RETU .T.
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
