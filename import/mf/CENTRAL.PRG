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
 DO interog.spr
 IF M.executa=0
      CLEA MEMO
      CLOS ALL
      RETU
 ENDI
 PUBL M.intr, M.iesi, M.tintr, M.tiesi, nu_verific
 STOR 0 TO M.intr, M.iesi, M.tintr, M.tiesi
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
 CLOS ALL
 CLEA
 CLEA
 CLOS ALL
 SELE 1
 USE TRANZACT
 SET ORDER TO PUN_OP
 SELE 2
 USE FINANTAT
 SET ORDER TO COD
 SELE 3
 USE CONTURI
 SET ORDER TO COD_CONT
 SELE 1
 SET RELATION TO cont INTO conturi ADDITIVE
 SET RELATION TO cod_fin INTO finantat ADDITIVE
 SELE 4
 USE OPERATII
 SET ORDER TO ORD_ACT ASCENDING
 SET FILTER TO c_data>=M.datai .AND. c_data<=M.datas
 COUN ALL TO nr
 IF nr=0
      CLEA MEMO
      CLOS ALL
      CLEA
      RETU
 ENDI
 SELE 5
 USE ACTE
 SET ORDER TO COD
 SELE 4
 SET RELATION TO cod_doc INTO acte ADDITIVE
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
 USE CENTRAL.FRX
 REPL height WITH _PLENGTH
 USE
 SELE 4
 IF se_listeaz=.T.
      PRIN
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE LISTEAZA LA IMPRIMANTA ' COLOR GR+/B,R/W 
      REPO FORMAT CENTRAL TO PRINTER NOCONSOLE
      ENDP
 ELSE
      DEFI WINDOW vizualiz FROM 0, 0 TO 24, 79 SYSTEM COLOR ,,,,BG/N,W+/B,,,B/W 
      IF FILE('CENTRAL.TXT')
           ERAS 'CENTRAL.TXT'
      ENDI
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
      SET PRINTER TO CENTRAL.txt
      PRIN
      REPO FORMAT CENTRAL TO PRINTER NOCONSOLE
      ENDP
      SET PRINTER TO
      MODI COMMAND 'CENTRAL.TXT' NOEDIT WINDOW vizualiz
      RELE WINDOW vizualiz
 ENDI
 CLEA
 SET EXACT OFF
 CLOS ALL
 CLEA MEMO
*
FUNC calculez
 SELE tranzact
 M.c_operat = YEAR(operatii.c_data)*1000000+operatii.nr_oper
 SEEK STR(M.c_operat, 10)
 M.intr = 0
 M.iesi = 0
 IF  .NOT. FOUND()
      SELE operatii
      RETU 0
 ENDI
 DO WHILE tranzact.c_operat=M.c_operat
      bine = verific()
      SELE tranzact
      IF bine=.T.
           IF c_adaug=1
                IF unit_mas<>6
                     M.iesi = M.iesi+ROUND(cantit*pret, 2)
                ELSE
                     M.iesi = M.iesi+ROUND(pret_comp, 2)
                ENDI
           ENDI
           IF c_adaug=2
                IF unit_mas<>6
                     M.intr = M.intr+ROUND(cantit*pret, 2)
                ELSE
                     M.intr = M.intr+ROUND(pret_comp, 2)
                ENDI
           ENDI
      ENDI
      SKIP 1
      IF EOF()
           EXIT
      ENDI
 ENDD
 SELE operatii
 M.tintr = M.tintr+M.intr
 M.tiesi = M.tiesi+M.iesi
 RETU 0
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
      SELE 1
      IF i(7)<>finantat.cod
           IF  .NOT. (i(7)=finantat.cod_cap1 .OR. i(7)=finantat.cod_cap2)
                RETU .F.
           ENDI
      ENDI
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
FUNC salt
 SELE operatii
 IF EOF()
      RETU 0
 ENDI
 = calculez()
 DO WHILE M.intr=0 .AND. M.iesi=0
      SELE operatii
      SKIP 1
      IF EOF()
           EXIT
      ENDI
      = calculez()
 ENDD
 SELE operatii
 RETU 0
*
