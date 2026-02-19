 SET TALK OFF
 SET ECHO OFF
 CLEA
 CLOS ALL
 DO ecr_rap8.SPR
 SET ECHO OFF
 SET TALK OFF
 SET CENTURY ON
 SET DATE TO BRITISH
 IF M.ok<>1
      CLOS ALL
      CLEA
      RETU
 ENDI
 CLOS ALL
 SELE 1
 USE TRANZACT
 SET ORDER TO PUN_OP ASCENDING
 SELE 2
 USE OPERATII
 SET ORDER TO PUN_OPER ASCENDING
 M.ok = 0
 IF M.operat<>0
      GOTO TOP
      SEEK STR(M.anul, 4)+STR(M.operat, 6)
      IF FOUND()
           M.ok = 1
           SET FILTER TO YEAR(c_data)=M.anul .AND. nr_oper=M.operat
      ENDI
 ELSE
      IF LEN(ALLTRIM(M.actul))<>0
           COUN ALL FOR ALLTRIM(nr_doc)==ALLTRIM(M.actul) .AND. YEAR(c_data)=M.anul TO nr
           IF nr<>0
                M.ok = 1
                SET FILTER TO ALLTRIM(nr_doc)==ALLTRIM(M.actul) .AND. YEAR(c_data)=M.anul
           ENDI
      ENDI
 ENDI
 IF M.ok<>1
      CLOS ALL
      CLEA
      SHOW MENU men_prg
      RETU TO MASTER
 ENDI
 SELE operatii
 SET ORDER TO ORD_ACT
 SELE 3
 USE MATERIAL
 SET ORDER TO COD
 SELE 4
 USE ACTE
 SET ORDER TO COD
 SELE 5
 USE GESTIUNI
 SET ORDER TO COD
 SELE 6
 USE CONTURI
 SET ORDER TO COD_CONT
 SELE 7
 USE STOC_UZ
 SET ORDER TO COD
 SELE 8
 USE DISPUS
 SET ORDER TO COD
 SELE 9
 USE UNIT_MAS
 SET ORDER TO COD_U
 SELE 10
 USE STARE
 SET ORDER TO COD
 SELE 11
 USE FINANTAT
 SET ORDER TO COD
 SELE 12
 USE PROVENIE
 SET ORDER TO COD
 SELE tranzact
 SET RELATION TO STR(c_operat, 10) INTO operatii ADDITIVE
 SET RELATION TO tranzact.cod_den INTO material ADDITIVE
 SELE operatii
 SET RELATION TO operatii.cod_doc INTO acte ADDITIVE
 SELE tranzact
 SET ORDER TO pun_op ASCENDING
 GOTO TOP
 SET RELATION TO tranzact.cod_ges INTO gestiuni ADDITIVE
 SET RELATION TO tranzact.cont INTO conturi ADDITIVE
 SET RELATION TO tranzact.c_stoc INTO stoc_uz ADDITIVE
 SET RELATION TO tranzact.sect INTO dispus ADDITIVE
 SET RELATION TO tranzact.unit_mas INTO unit_mas ADDITIVE
 SET RELATION TO tranzact.stare INTO stare ADDITIVE
 SET RELATION TO tranzact.cod_fin INTO finantat ADDITIVE
 SET RELATION TO tranzact.cod_prov INTO provenie ADDITIVE
 SET FILTER TO  .NOT. EOF(2)
 PUBL iesire, intrare
 = resetari()
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
 USE RAP_ACT.FRX
 REPL height WITH _PLENGTH
 USE
 SELE tranzact
 IF se_listeaz=.T.
      PRIN
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE LISTEAZA LA IMPRIMANTA ' COLOR GR+/B,R/W 
      REPO FORMAT RAP_ACT TO PRINTER NOCONSOLE
      ENDP
 ELSE
      DEFI WINDOW vizualiz FROM 0, 0 TO 24, 79 SYSTEM COLOR ,,,,BG/N,W+/B,,,B/W 
      IF FILE('RAP_ACT.TXT')
           ERAS 'RAP_ACT.TXT'
      ENDI
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
      SET PRINTER TO RAP_ACT.txt
      PRIN
      REPO FORMAT RAP_ACT TO PRINTER NOCONSOLE
      ENDP
      SET PRINTER TO
      MODI COMMAND 'RAP_ACT.TXT' NOEDIT WINDOW vizualiz
      RELE WINDOW vizualiz
 ENDI
 SET EXACT OFF
 CLOS ALL
 CLEA
*
FUNC resetari
 PUBL M.intr_val, M.ies_val, M.stoc_val
 PUBL M.intr_cant, M.ies_cant, M.stoc_cant
 PUBL M.toti_val, M.toti_cant, M.tote_val, M.tote_cant
 PUBL M.ti_val, M.ti_cant, M.te_val, M.te_cant
 PUBL M.op_int, M.op_ies
 SET DECIMALS TO 3
 STOR 0.00 TO M.intr_val, M.ies_val, M.stoc_val
 STOR 0.000 TO M.intr_cant, M.ies_cant, M.stoc_cant
 STOR 0.000 TO M.toti_cant, M.tote_cant
 STOR 0.00 TO M.toti_val, M.tote_val
 STOR 0.000 TO M.ti_cant, M.te_cant
 STOR 0.00 TO M.ti_val, M.te_val, M.op_int, M.op_ies
 RETU 0
*
FUNC setare_st
 SELE tranzact
 IF tranzact.c_adaug=2
      IF tranzact.unit_mas<>6
           M.intr_val = ROUND(tranzact.cantit*tranzact.pret, 2)
      ELSE
           M.intr_val = ROUND(tranzact.pret_comp, 2)
      ENDI
      M.ies_val = 0
      M.intr_cant = tranzact.cantit
      M.ies_cant = 0
      M.stoc_cant = M.stoc_cant+M.intr_cant
      M.stoc_val = M.stoc_val+M.intr_val
 ELSE
      IF tranzact.unit_mas<>6
           M.ies_val = ROUND(tranzact.cantit*tranzact.pret, 2)
      ELSE
           M.ies_val = ROUND(tranzact.pret_comp, 2)
      ENDI
      M.intr_val = 0
      M.ies_cant = tranzact.cantit
      M.intr_cant = 0
      M.stoc_cant = M.stoc_cant-M.ies_cant
      M.stoc_val = M.stoc_val-M.ies_val
 ENDI
 M.stoc_cant = ROUND(M.stoc_cant, 3)
 M.ies_cant = ROUND(M.ies_cant, 3)
 M.intr_cant = ROUND(M.intr_cant, 3)
 M.stoc_val = ROUND(M.stoc_val, 2)
 M.ies_val = ROUND(M.ies_val, 2)
 M.intr_val = ROUND(M.intr_val, 2)
 M.op_int = M.op_int+M.intr_val
 M.op_ies = M.op_ies+M.ies_val
 M.toti_val = ROUND(M.toti_val+M.intr_val, 2)
 M.tote_val = ROUND(M.tote_val+M.ies_val, 2)
 M.toti_cant = ROUND(M.toti_cant+M.intr_cant, 3)
 M.tote_cant = ROUND(M.tote_cant+M.ies_cant, 3)
 M.ti_val = ROUND(M.ti_val+M.intr_val, 2)
 M.te_val = ROUND(M.te_val+M.ies_val, 2)
 M.ti_cant = ROUND(M.ti_cant+M.intr_cant, 3)
 M.te_cant = ROUND(M.te_cant+M.ies_cant, 3)
 RETU 0
*
FUNC ce_conturi
 SELE tranzact
 nr_cur = RECNO()
 M.c_operat = tranzact.c_operat
 GOTO TOP
 SEEK STR(M.c_operat, 10)
 iesire = ''
 intrare = ''
 DO WHILE M.c_operat=tranzact.c_operat
      IF c_adaug=1
           iesire = 'IESIRE DIN CONTUL  '+conturi.cont+'  '+conturi.denumire+stoc_uz.den+gestiuni.denumire+'  '+dispus.denumire
      ENDI
      IF c_adaug=2
           iesire = 'INTRARE IN CONTUL  '+conturi.cont+'  '+conturi.denumire+stoc_uz.den+gestiuni.denumire+'  '+dispus.denumire
      ENDI
      IF LEN(iesire)<>0 .AND. LEN(intrare)<>0
           EXIT
      ENDI
      SKIP 1
      IF EOF()
           EXIT
      ENDI
 ENDD
 SELE tranzact
 GOTO nr_cur
 RETU 0
*
