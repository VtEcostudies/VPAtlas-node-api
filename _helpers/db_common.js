/*
  A place for db queries, etc. common to all db services.
*/

module.exports = {
    visitHasIndicator: visitHasIndicator
}

function visitHasIndicator() {
text = `
("visitWoodFrogAdults">0 OR
"visitWoodFrogLarvae">0 OR
"visitWoodFrogEgg">0 OR
"visitSpsAdults">0 OR
"visitSpsLarvae">0 OR
"visitSpsEgg">0 OR
"visitJesaAdults">0 OR
"visitJesaLarvae">0 OR
"visitJesaEgg">0 OR
"visitBssaAdults">0 OR
"visitBssaLarvae">0 OR
"visitBssaEgg">0 OR
"visitFairyShrimp">0 OR
"visitFingerNailClams">0)`
return text;
}

function visitIndicatorSum() {
text = `
((
"visitWoodFrogAdults"+
"visitWoodFrogLarvae"+
"visitWoodFrogEgg"+
"visitSpsAdults"+
"visitSpsLarvae"+
"visitSpsEgg"+
"visitJesaAdults"+
"visitJesaLarvae"+
"visitJesaEgg"+
"visitBssaAdults"+
"visitBssaLarvae"+
"visitBssaEgg"+
"visitFairyShrimp"+
"visitFingerNailClams"
)>0)`;
return text;
}
