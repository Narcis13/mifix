 SET TALK OFF
 SET ECHO OFF
 CLOS ALL
 SELE 1
 USE solduri
 SELE 2
 USE gestiuni
 SET ORDER TO cod
 SELE 3
 USE stoc_uz
 SET ORDER TO cod
 SELE 4
 USE dispus
 SET ORDER TO cod
 SELE DISTINCT solduri.cod_ges, solduri.c_stoc, solduri.sect FROM SOLDURI WHERE solduri.cantit>0 GROUP BY solduri.cod_ges, solduri.c_stoc, solduri.sect ORDER BY solduri.cod_ges, solduri.c_stoc, solduri.sect INTO CURSOR QUERY
 SELE query
 SET RELATION TO query.cod_ges INTO gestiuni ADDITIVE
 SET RELATION TO query.c_stoc INTO stoc_uz ADDITIVE
 SET RELATION TO query.sect INTO dispus ADDITIVE
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
 USE LOCURI.FRX
 REPL height WITH _PLENGTH
 USE
 SELE query
 IF se_listeaz=.T.
      PRIN
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE LISTEAZA LA IMPRIMANTA ' COLOR GR+/B,R/W 
      REPO FORMAT LOCURI.FRX TO PRINTER NOCONSOLE
      ENDP
 ELSE
      DEFI WINDOW vizualiz FROM 0, 0 TO 24, 79 SYSTEM COLOR ,,,,BG/N,W+/B,,,B/W 
      IF FILE('LOCURI.TXT')
           ERAS 'LOCURI.TXT'
      ENDI
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
      SET PRINTER TO LOCURI.txt
      PRIN
      REPO FORMAT LOCURI TO PRINTER NOCONSOLE
      ENDP
      SET PRINTER TO
      MODI COMMAND 'LOCURI.TXT' NOEDIT WINDOW vizualiz
      RELE WINDOW vizualiz
 ENDI
 CLEA
 SET EXACT OFF
 CLOS ALL
 CLEA MEMO
*
