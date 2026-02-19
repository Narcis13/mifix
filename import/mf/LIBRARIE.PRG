*
FUNC ver_stg
 IF USED('tranzact')
      SELE tranzact
 ELSE
      SELE 0
      USE tranzact
 ENDI
 SET ORDER TO pun_op DESCENDING
 GOTO TOP
 SEEK STR(M.c_operat, 10)+STR(M.crt, 3)
 IF  .NOT. FOUND()
      RETU .F.
 ENDI
 IF c_adaug=1
      RETU .T.
 ENDI
 SET ORDER TO pmp ASCENDING
 GOTO TOP
 SEEK STR(M.cod_den, 8)+STR(M.unit_mas, 2)+STR(M.c_operat, 10)+STR(M.crt, 3)
 SKIP 1
 IF EOF()
      RETU .T.
 ENDI
 DO WHILE M.cod_den=cod_den .AND. M.unit_mas=unit_mas
      IF M.cont=cont .AND. M.sect=sect .AND. M.cod_ges=cod_ges
           IF M.c_stoc=c_stoc .AND. M.cod_prov=cod_prov .AND. M.cod_fin=cod_fin
                IF M.stare=stare .AND. M.pret=pret .AND. M.seria=seria
                     IF M.data_intr=data_intr .AND. M.proc=M.proc .AND. c_adaug=1
                          DO avertiz5.spr
                          RETU .F.
                     ENDI
                ENDI
           ENDI
      ENDI
      SKIP 1
      IF EOF()
           RETU .T.
      ENDI
 ENDD
 RETU .T.
*
FUNC ver_ins
 PARA ce_adaug
 IF USED('tranzact')
      SELE tranzact
 ELSE
      SELE 0
      USE tranzact
 ENDI
 SET ORDER TO pmp ASCENDING
 GOTO TOP
 SEEK STR(M.cod_den, 8)+STR(M.unit_mas, 2)
 IF M.ce_adaug=1
      DO WHILE M.cod_den=cod_den .AND. M.unit_mas=unit_mas
           IF M.cont=cont .AND. M.sect=sect .AND. M.cod_gest=cod_gest
                IF M.c_stoc=c_stoc .AND. M.cod_prov=cod_prov .AND. M.cod_fin=cod_fin
                     IF M.stare=stare .AND. M.pret=pret .AND. M.seria=seria
                          IF M.data_intr=data_intr .AND. M.proc=M.proc .AND. c_adaug=1
                               DO avertiz5.spr
                               RETU .F.
                          ENDI
                     ENDI
                ENDI
           ENDI
           SKIP 1
           IF EOF()
                RETU .T.
           ENDI
      ENDD
 ENDI
 RETU .T.
*
FUNC ren_crt
 PRIV inv
 IF USED('tranzact')
      SELE tranzact
 ELSE
      SELE 0
      USE tranzact
 ENDI
 SET ORDER TO pun_op ASCENDING
 SEEK STR(M.c_operat, 10)
 IF  .NOT. FOUND()
      RETU
 ENDI
 inv = 1
 DO WHILE c_operat=M.c_operat
      REPL crt WITH inv
      inv = inv+1
      SKIP 1
      IF EOF()
           SKIP -1
           RETU .T.
      ENDI
 ENDD
 RETU .T.
*
PROC rec_sold
 PRIV filtru
 IF USED('tranzact')
      SELE tranzact
 ELSE
      SELE 0
      USE tranzact
 ENDI
 IF USED('solduri')
      SELE solduri
 ELSE
      SELE 0
      USE solduri
 ENDI
 SELE tranzact
 SET ORDER TO ORD_SORT DESCENDING
 filtru = STR(M.cod_den, 8)+STR(M.unit_mas, 2)+STR(M.stare, 1)+STR(M.pret, 13, 2)+DTOS(M.data_intr)+STR(M.proc, 10, 3)+STR(M.cont, 3)+STR(M.cod_ges, 2)+STR(M.c_stoc, 1)+STR(M.sect, 2)+STR(M.cod_fin, 2)+STR(M.cod_prov, 2)
 SEEK filtru
 IF  .NOT. FOUND()
      SELE solduri
      SET ORDER TO ORD_SOR
      filtru = STR(M.cod_den, 8)+STR(M.unit_mas, 2)+STR(M.stare, 1)+STR(M.pret, 13, 2)+DTOS(M.data_intr)+STR(M.proc, 10, 3)+STR(M.cont, 3)+STR(M.cod_ges, 2)+STR(M.c_stoc, 1)+STR(M.sect, 2)+STR(M.cod_fin, 2)+STR(M.cod_prov, 2)
      SEEK filtru
      IF FOUND()
           DELE
      ENDI
      RETU
 ENDI
 SELE tranzact
 SET ORDER TO ORD_SORT DESCENDING
 GOTO TOP
 filtru = STR(M.cod_den, 8)+STR(M.unit_mas, 2)+STR(M.stare, 1)+STR(M.pret, 13, 2)+DTOS(M.data_intr)+STR(M.proc, 10, 3)+STR(M.cont, 3)+STR(M.cod_ges, 2)+STR(M.c_stoc, 1)+STR(M.sect, 2)+STR(M.cod_fin, 2)+STR(M.cod_prov, 2)
 SEEK filtru
 ce_cantit = 0.00
 bine = .T.
 DO WHILE bine=.T.
      bine = .F.
      IF M.cont=cont .AND. M.cod_ges=cod_ges .AND. M.cod_prov=cod_prov
           IF M.cod_fin=cod_fin .AND. M.c_stoc=c_stoc .AND. M.sect=sect
                IF M.cod_den=cod_den .AND. M.unit_mas=unit_mas .AND. M.stare=stare
                     IF M.pret=pret .AND. M.proc=proc .AND. M.data_intr=data_intr
                          bine = .T.
                          IF tranzact.c_adaug=2
                               ce_cantit = ce_cantit+tranzact.cantit
                          ENDI
                          IF tranzact.c_adaug=1
                               ce_cantit = ce_cantit-tranzact.cantit
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
 SELE solduri
 SET ORDER TO ORD_SOR
 filtru = STR(M.cod_den, 8)+STR(M.unit_mas, 2)+STR(M.stare, 1)+STR(M.pret, 13, 2)+DTOS(M.data_intr)+STR(M.proc, 10, 3)+STR(M.cont, 3)+STR(M.cod_ges, 2)+STR(M.c_stoc, 1)+STR(M.sect, 2)+STR(M.cod_fin, 2)+STR(M.cod_prov, 2)
 SEEK filtru
 IF  .NOT. FOUND()
      APPE BLANK
 ENDI
 GATH MEMVAR
 REPL cantit WITH ce_cantit
*
FUNC get_materi
 IF USED('MATERIAL')
      SELE material
 ELSE
      SELE 0
      USE MATERIAL
 ENDI
 IF USED('SOLDURI')
      SELE solduri
 ELSE
      SELE 0
      USE SOLDURI
 ENDI
 nr_zona = SELECT(0)
 SET ORDER TO COD_DEN
 IF M.c_adaug=1
      SET FILTER TO cantit>0 .AND. cod_ges=M.cod_ges .AND. c_stoc=M.c_stoc .AND. cont=M.cont .AND. sect=M.sect
 ELSE
      SET FILTER TO cod_ges=M.cod_ges
 ENDI
 SELE material
 SET ORDER TO NUME
 SET RELATION TO material.cod INTO solduri ADDITIVE
 GOTO TOP
 COUN ALL FOR  .NOT. EOF(nr_zona) TO nr_mat
 IF nr_mat=0
      SET RELATION OFF INTO solduri
      SELE solduri
      SET FILTER TO
      SELE material
      RETU 0
 ENDI
 BROW FOR  .NOT. EOF(nr_zona) FIELDS denumire = nume, fisa = cod : 6 NOAPPEND NOEDIT NODELETE WINDOW fer_brow TITLE 'IESIRE CU ESC SAU CTRL-W'
 SET RELATION OFF INTO solduri
 SELE solduri
 SET FILTER TO
 SELE material
 RETU material.cod
*
PROC set_print
 PUBL nr_linii, pg_incep
 nr_linii = 66
 CLEA
 @ 5, 5 SAY 'NUMARUL DE LINII PE PAGINA = ' COLOR GR+/B,R/W  GET nr_linii
 READ
 _PLENGTH = nr_linii
 pg_incep = 1
 @ 7, 5 SAY 'PAGINA DE INCEPUT = ' COLOR GR+/B,R/W  GET pg_incep
 READ
 _PBPAGE = pg_incep
*
