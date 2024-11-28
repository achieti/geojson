// questa funzione calcola lo standard rate solo dell'ultima colonna del grafico,
// per cui la parte totale (in base ai filtri selezionati)
function standardRate(dataNew, sex = "Maschi", k = 1000) {
    let dataset = null;
    let wi = calculationWi(dataNew, sex);

    let ti = 0;
    let summation = {
        numerator: 0,
        denominator: 0,
    };
    let rates = 0;

    let cases = 0;
    let population = 0;
    dataset = dataNew.filter((d) => d.sesso === sex);

    classes = dataset.reduce((l, i) => (l.indexOf(i.classe_eta) !== -1 ? l : l.concat([i.classe_eta])), []);
    classes.sort();
    classes.forEach((classe) => {
        let cases = 0;
        let population = 0;
        dataset.forEach((row) => {
            if (row.classe_eta === classe) {
                cases += row.casi;
                population += row.popolazione;
            }
        });
        ti = population !== 0 ? cases / population : 0;
        summation.numerator += wi[classe] * ti;
        summation.denominator += wi[classe];
    });

    rates = summation.numerator / summation.denominator;
    rates = k !== 1000 ? (rates = rates * k) : (rates = +(rates * k)); //.toFixed(2)
    return rates;
}

// questa funzione calcola lo standard rate solo dell'ultima colonna del grafico,
// per cui la parte totale (in base ai filtri selezionati)
function standardRate(dataNew, sex = "Maschi", k = 1000) {
    let dataset = null;
    let wi = calculationWi(dataNew, sex);

    let ti = 0;
    let summation = {
        numerator: 0,
        denominator: 0,
    };
    let rates = 0;

    let cases = 0;
    let population = 0;
    dataset = dataNew.filter((d) => d.sesso === sex);

    classes = dataset.reduce((l, i) => (l.indexOf(i.classe_eta) !== -1 ? l : l.concat([i.classe_eta])), []);
    classes.sort();
    classes.forEach((classe) => {
        let cases = 0;
        let population = 0;
        dataset.forEach((row) => {
            if (row.classe_eta === classe) {
                cases += row.casi;
                population += row.popolazione;
            }
        });
        ti = population !== 0 ? cases / population : 0;
        summation.numerator += wi[classe] * ti;
        summation.denominator += wi[classe];
    });

    rates = summation.numerator / summation.denominator;
    rates = k !== 1000 ? (rates = rates * k) : (rates = +(rates * k)); //.toFixed(2)
    return rates;
}

function calculationWi(dataNew, sex = "Maschi") {
    let container = extractTotal(dataNew, "peso_classe", sex);
    let dataset = [];
    let obj = {};
    dataset = dataNew.filter((d) => d.sesso === sex);
    dataset.forEach((row) => {
        obj[row.classe_eta] = row.peso_classe / container;
    });
    return obj;
}
