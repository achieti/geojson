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
