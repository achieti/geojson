var yearOptions = [{
        val: "2022",
        checked: true
    },
    {
        val: "2021",
        checked: false
    },
    {
        val: "2020",
        checked: false
    },
    {
        val: "2019",
        checked: false
    },
    {
        val: "2018",
        checked: false
    },
    {
        val: "2017",
        checked: false
    },
    {
        val: "2016",
        checked: false
    },
    {
        val: "2015",
        checked: false
    },
    {
        val: "2014",
        checked: false
    },
    {
        val: "2013",
        checked: false
    },
    {
        val: "2012",
        checked: false
    },
    {
        val: "2011",
        checked: false
    },
    {
        val: "2010",
        checked: false
    },
    {
        val: "2009",
        checked: false
    },
    {
        val: "2008",
        checked: false
    },
    {
        val: "2007",
        checked: false
    },
    {
        val: "2006",
        checked: false
    },
];

var yearSelectedForFilter = "2022";

var minYearStarting = 1;
var maxYearStopping = 17;

// è la linea rossa del grafico Trend di Prevalenza del XXXX per Area Geografica
// quando è selezionato il "Rischio Relativo"
var geoAreaRedLineMatrix = [
    [1, 1, 1], //pre 2006
    [1, 1, 1], //2006
    [1, 1, 1], //2007
    [1, 1, 1], //2008
    [1, 1, 1], //2009
    [1, 1, 1], //2010
    [1, 1, 1], //2011
    [1, 1, 1], //2012
    [1, 1, 1], //2013
    [1, 1, 1], //2014
    [1, 1, 1], //2015
    [1, 1, 1], //2016
    [1, 1, 1], //2017
    [1, 1, 1], //2018
    [1, 1, 1], //2019
    [1, 1, 1], //2020
    [1, 1, 1], //2021
    [1, 1, 1], //2022
    [1, 1, 1], //2023
];

// in base alla patologia restituisce l'articolo determinativo corretto
function pathologyArticle(pathology) {
    var article = '';
    switch (pathology) {
        case 'Scompenso Cardiaco':
            article = ' dello ';
            break;
        case 'BPCO':
            article = 'della ';
            break;
        case 'Ipertensione':
            article = " dell'";
            break;
        default:
            article = ' del ';
    }
    return article;
}
