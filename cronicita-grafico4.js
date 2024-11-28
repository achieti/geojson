function standardRateArea(years, data, k = 1000) {
    let dataset = null;
    let wi = calculationWiArea(years, data);
    let ti = 0;

    let rates = {
        Area: {},
    };
    let classes = [];
    years.forEach((el) => {
        let summation = {
            numeratore: 0,
            denominatore: 0,
        };
        dataset = data.filter((d) => d.anno === el);
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
            summation.numeratore += wi["Area"][el][classe] * ti;
            summation.denominatore += wi["Area"][el][classe];
        });
        rates["Area"][el] = summation.numeratore / summation.denominatore;
        rates["Area"][el] =
            k !== 1000 ?
            (rates["Area"][el] = rates["Area"][el] * k) :
            (rates["Area"][el] = +(rates["Area"][el] * k).toFixed(2));
    });
    return rates;
}

function calculationWiArea(years, data) {
    let popEu = extractTotalArea("peso_classe", years, data);
    let container = {
        Area: {},
    };
    years.forEach((el) => {
        let obj = {};
        data.forEach((row) => {
            obj[row.classe_eta] = row.peso_classe / popEu["Area"][row.anno];
        });
        container["Area"][el] = obj;
    });
    return container;
}

function extractTotalArea(column, years, data) {
    let dataset = null;
    let sum = 0;
    let container = {
        Area: {},
    };
    years.forEach((el) => {
        sum = 0;
        dataset =
            column === "peso_classe" ?
            data.filter((d) => d.anno === el && d.riferimento === data[0].riferimento) :
            data.filter((d) => d.anno === el);
        dataset.forEach((row) => (sum += row[column]));
        container["Area"][el] = sum;
    });
    return container;
}

function extractTotal(column, references, years, data) {
    let dataset = null;
    let container = {};
    references.forEach((riferimento) => {
        container[riferimento] = {};
        years.forEach((el) => {
            let sum = 0;
            dataset = data.filter(
                (d) => d.anno === el && d.riferimento === riferimento
            );
            dataset.forEach((row) => (sum += row[column]));
            container[riferimento][el] = sum;
        });
    });
    return container;
}

function calculationWi(references, years, data) {
    let popEu = extractTotal("peso_classe", references, years, data);
    let dataset = [];
    let container = {};
    references.forEach((riferimento) => {
        container[riferimento] = {};
        years.forEach((el) => {
            let obj = {};
            dataset = data.filter(
                (d) => d.anno === el && d.riferimento === riferimento
            );
            dataset.forEach((row) => {
                obj[row.classe_eta] = row.peso_classe / popEu[riferimento][row.anno];
            });
            container[riferimento][el] = obj;
        });
    });
    return container;
}

function standardRate(references, years, data, k = 100000) {
    let dataset = null;
    let wi = calculationWi(references, years, data);
    let ti = 0;
    let rates = {};
    references.forEach((riferimento) => {
        rates[riferimento] = {};
        years.forEach((el) => {
            let summation = {
                numeratore: 0,
                denominator: 0,
            };
            dataset = data.filter((d) => d.anno === el && d.riferimento === riferimento);
            dataset.forEach((row) => {
                ti = row.popolazione !== 0 ? row.casi / row.popolazione : 0;
                summation.numeratore += wi[riferimento][el][row.classe_eta] * ti;
                summation.denominator += wi[riferimento][el][row.classe_eta];
            });
            rates[riferimento][el] = summation.numeratore / summation.denominator;
            rates[riferimento][el] =
                k !== 100000 ?
                (rates[riferimento][el] = rates[riferimento][el] * k) :
                (rates[riferimento][el] = +(rates[riferimento][el] * k).toFixed(2));
        });
    });
    return rates;
}
