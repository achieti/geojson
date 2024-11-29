var yearOptions1 = [{
        val: "2022",
        checked: false
    },
    {
        val: "2021",
        checked: false
    },
    {
        val: "2020",
        checked: true
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

// in base alla patologia restituisce l'articolo determinativo corretto
function pathologySpecification(pathology) {
    var specification = '';
    switch (pathology) {
        case 'Vescica':
            specification = ' del tumore della ';
            break;
        case 'Totale':
            specification = ' di tutti i tumori ';
            break;
        case 'Utero corpo':
            specification = " del tumore dell'";
            break;
        default:
            specification = ' del ';
    }
    return specification;
}


function sexOptionsGenerator(pathology) {
    var sexOptions = [];
    console.log(pathology);
    switch (pathology) {
        case 'Utero corpo':
            sexOptions = [{
                val: "Femmine",
                checked: true
            }];
            break;
        case 'Testicolo':
            sexOptions = [{
                val: "Maschi",
                checked: true
            }];
            break;
        default:
            sexOptions = [{
                    val: "Maschi e Femmine",
                    checked: true
                },
                {
                    val: "Femmine",
                    checked: false
                },
                {
                    val: "Maschi",
                    checked: false
                },
            ];
            break;
    }
    return sexOptions;
}
