 CLEA
 SET TALK OFF
 SET ECHO OFF
 DEFI WINDOW vizualiz FROM 0, 0 TO 24, 79 SYSTEM COLOR ,,,,BG/N,W+/B,,,B/W 
 CLOS ALL
 SELE 1
 USE GESTIUNI
 IF  .NOT. WEXIST('_rhr0ru13x')
      DEFI WINDOW _rhr0ru13x FROM INT((SROWS()-13)/2), INT((SCOLS()-35)/2) TO INT((SROWS()-13)/2)+12, INT((SCOLS()-35)/2)+34 NOFLOAT NOCLOSE SHADOW NOMINIMIZE COLOR SCHEME 1
 ENDI
 PUBL M.arma
 M.arma = 1
 SHOW GETS
 DEFI POPUP _rhr0ru1ur PROMPT FIELDS denumire MARK '' MARGIN SCROLL
 IF WVISIBLE('_rhr0ru13x')
      ACTI WINDOW SAME _rhr0ru13x
 ELSE
      ACTI WINDOW NOSHOW _rhr0ru13x
 ENDI
 @ 2,2 GET m.arma  PICTURE "@&T"  POPUP _rhr0ru1ur  SIZE 9,28  DEFAULT " "  COLOR SCHEME 2
 @ 0, 13 SAY 'GESTIUNEA' SIZE 1, 9, 0
 @ 1, 13 SAY '---------' SIZE 1, 9, 0
 IF  .NOT. WVISIBLE('_rhr0ru13x')
      ACTI WINDOW _rhr0ru13x
 ENDI
 READ CYCLE
 M.arma = gestiuni.cod
 RELE WINDOW _rhr0ru13x
 IF USED('GESTIUNI')
      SELE gestiuni
      USE
 ENDI
 CLOS ALL
 SELE 1
 USE SOLDURI
 SELE 2
 USE CONTURI
 SET ORDER TO COD_CONT
 SELE 3
 USE MATERIAL
 SET ORDER TO COD
 SELE DISTINCT solduri.cod_den, solduri.cont FROM SOLDURI WHERE solduri.cod_ges=M.arma GROUP BY solduri.cod_den, solduri.cont ORDER BY solduri.cod_den, solduri.cont INTO CURSOR QUERY
 SELE query
 SET RELATION TO query.cod_den INTO material ADDITIVE
 SET RELATION TO query.cont INTO conturi ADDITIVE
 SELE query
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
 USE MAT_CONT.FRX
 REPL height WITH _PLENGTH
 USE
 SELE query
 IF se_listeaz=.T.
      PRIN
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE LISTEAZA LA IMPRIMANTA ' COLOR GR+/B,R/W 
      REPO FORMAT MAT_CONT TO PRINTER NOCONSOLE
      ENDP
 ELSE
      DEFI WINDOW vizualiz FROM 0, 0 TO 24, 79 SYSTEM COLOR ,,,,BG/N,W+/B,,,B/W 
      IF FILE('MAT_CONT.TXT')
           ERAS 'MAT_CONT.TXT'
      ENDI
      CLEA
      @ 5, 5 SAY 'ASTEPTATI PANA SE GENEREAZA RAPORTUL' COLOR GR+/B,R/W 
      SET PRINTER TO MAT_CONT.txt
      PRIN
      REPO FORMAT MAT_CONT TO PRINTER NOCONSOLE
      ENDP
      SET PRINTER TO
      MODI COMMAND 'MAT_CONT.TXT' NOEDIT WINDOW vizualiz
      RELE WINDOW vizualiz
 ENDI
 CLOS ALL
 CLEA
 CLEA MEMO
*
