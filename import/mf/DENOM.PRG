set talk off
use tranzact
replace all pret with round(pret/10000,2)
replace all pret with 0.01 for pret=0
use
