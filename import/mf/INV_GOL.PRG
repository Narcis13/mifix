 SET TALK OFF
 SET ECHO OFF
 SET EXACT OFF
 SET DATE TO GERMAN
 SET CENTURY ON
 SET DECIMALS TO 3
 CLOS ALL
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
 CLEA
 @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
 CLOS ALL
 SELE 1
 USE TRANZACT
 SELE 2
 USE MATERIAL
 SET ORDER TO COD
 SELE DISTINCT tranzact.cod_den FROM TRANZACT WHERE IIF(i(2)=-1, -1, cod_den)=i(2) AND IIF(i(3)=-1, -1, cod_ges)=i(3) AND IIF(i(4)=-1, -1, c_stoc)=i(4) AND IIF(i(5)=-1, -1, sect)=i(5) AND IIF(i(6)=-1, -1, cod_prov)=i(6) AND IIF(i(8)=-1, -1, stare)=i(8) GROUP BY tranzact.cod_den ORDER BY tranzact.cod_den INTO CURSOR QUERY
 SELE query
 SET RELATION TO query.cod_den INTO material ADDITIVE
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
 USE inv_gol.FRX
 REPL height WITH _PLENGTH
 USE
 SELE query
 IF se_listeaz=.T.
      PRIN
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE LISTEAZA LA IMPRIMANTA ' COLOR GR+/B,R/W 
      REPO FORMAT inv_gol TO PRINTER NOCONSOLE
      ENDP
 ELSE
      DEFI WINDOW vizualiz FROM 0, 0 TO 24, 79 SYSTEM COLOR ,,,,BG/N,W+/B,,,B/W 
      IF FILE('inv_gol.TXT')
           ERAS 'inv_gol.TXT'
      ENDI
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
      SET PRINTER TO inv_gol.txt
      PRIN
      REPO FORMAT inv_gol TO PRINTER NOCONSOLE
      ENDP
      SET PRINTER TO
      MODI COMMAND 'inv_gol.TXT' NOEDIT WINDOW vizualiz
      RELE WINDOW vizualiz
 ENDI
 CLEA
 SET EXACT OFF
 CLOS ALL
 CLEA MEMO
*
