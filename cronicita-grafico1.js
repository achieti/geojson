const createDataset = (column, array, dataset) => {
    var newDataset = [];
    var temp = [];
    for (var i = 0; i < array.length; i++) {
        temp = dataset.filter((d) => {
            if (column === "anno") {
                return d[column] === parseInt(array[i]);
            } else {
                return d[column] === array[i];
            }
        });
        newDataset = newDataset.concat(temp);
    }
    return newDataset;
};

var ageClassesMap = [
    "40-44",
    "45-49",
    "50-54",
    "55-59",
    "60-64",
    "65-69",
    "70-74",
    "75-79",
    "80-84",
    ">=85",
];

function isAgeClassesNotConsecutive(ageClasses, ageClassesMap) {
    let obj = {
        pointer: null,
        next: null,
    };
    var exit = false;

    for (i = 0; i < ageClasses.length - 1; i++) {
        obj.pointer = ageClasses[i];
        obj.next = ageClasses[i + 1];
        let position = ageClassesMap.findIndex((el) => el == ageClasses[i]);
        if (obj.next !== ageClassesMap[position + 1]) {
            exit = true;
            break;
        }
    }
    return exit;
}

//-------- ESTRAZIONE FORMULE --------

function extractTotal(column, data, references) {
    return references.reduce(
        (obj, riferimento) => ({
            ...obj,
            [riferimento]: data
                .filter((d) => d.riferimento === riferimento)
                .reduce((sum, row) => sum + row[column], 0),
        }), {}
    );
}


function calcoloWi(TotalePesoClasse, data, references) {
    return references.reduce(
        (obj, riferimento) => ({
            ...obj,
            [riferimento]: data
                .filter((d) => d.riferimento === riferimento)
                .reduce(
                    (sum, row) => ({
                        ...sum,
                        [row.classe_eta]: row.peso_classe / TotalePesoClasse[row.riferimento],
                    }), {}
                ),
        }), {}
    );
}

function divStandardRate(wi, riferimento, data) {
    return (
        data
        .filter((d) => d.riferimento === riferimento)
        .reduce(
            (sum, row) =>
            sum +
            wi[riferimento][row.classe_eta] *
            (row.popolazione !== 0 ? row.casi / row.popolazione : 0),
            0
        ) /
        data
        .filter((d) => d.riferimento === riferimento)
        .reduce((sum, row) => sum + wi[riferimento][row.classe_eta], 0)
    );
}

function standardRate(wi, data, references, k = 1000) {
    return references.reduce(
        (obj, riferimento) => ({
            ...obj,
            [riferimento]: data
                .filter((d) => d.riferimento === riferimento)
                .reduce(
                    (sum, row) => ({
                        ...sum,
                        ["tasso"]: (() => {
                            const standardRateResult = divStandardRate(wi, riferimento, data);
                            if (standardRateResult === 0) {
                                return null;
                            } else {
                                return k === 1000 ?
                                    (standardRateResult * k).toFixed(2) :
                                    standardRateResult * k;
                            }
                        })(),
                    }), {}
                ),
        }), {}
    );
}

function relativeRisk(data, references) {
    let tassi = standardRate(
        calcoloWi(extractTotal("peso_classe", data, references), data, references),
        data,
        references,
        1
    );
    var newTassi = {};
    for (const [key, value] of Object.entries(tassi)) {
        if (key === "null") {
            newTassi["Puglia"] = value;
        } else {
            newTassi[key] = value;
        }
    }
    let puglia = newTassi["Puglia"]["tasso"];
    let container = {};
    let temp = null;
    references.forEach((el) => {
        if (el !== null) {
            temp = +(newTassi[el]["tasso"] / puglia).toFixed(4);
            container[el] = {
                tasso: temp,
            };
        }
        if (temp === 0 || temp === 0.00) {
            container[el] = {
                tasso: null,
            }
        }
    });
    return container;
}

function esLogTs(data, references) {
    let wi = calcoloWi(extractTotal("peso_classe", data, references), data, references);
    let rates = standardRate(calcoloWi(extractTotal("peso_classe", data, references), data, references), data,
        references, 1);
    let es = {};
    let value = 0;
    references.forEach((el) => {
        dataset = data.filter((d) => d.riferimento === el);
        let summation = 0;
        dataset.forEach((row) => {
            value = row.casi / Math.pow(row.popolazione, 2);
            summation += Math.pow(wi[el][row.classe_eta], 2) * value;
        });
        summation = Math.sqrt(summation);
        if (summation === 0 || rates[el].tasso === 0) {
            es[el] = 0;
        } else {
            es[el] = summation / rates[el].tasso;
        }
    });
    return es;
}

function intervalTsPrevalenteAsl(references, data) {
    let rate = standardRate(calcoloWi(extractTotal("peso_classe", data, references), data, references), data,
        references, 1);
    let esLog = esLogTs(data, references);
    let container = {};
    let value = 0;
    let obj = {};
    references.forEach((el) => {
        obj = {
            tasso: 0,
            lcl: 0,
            ucl: 0,
        };
        value = 1.96 * esLog[el];
        obj.lcl = +(Math.exp(Math.log(rate[el]["tasso"]) - value) * 1000).toFixed(2);
        obj.ucl = +(Math.exp(Math.log(rate[el]["tasso"]) + value) * 1000).toFixed(2);
        obj.tasso = +(rate[el]["tasso"] * 1000).toFixed(2);
        container[el] = obj;
    });
    return container;
}

function intervalRrPrevalenzaAsl(references, data) {
    let rate = standardRate(calcoloWi(extractTotal("peso_classe", data, references), data, references), data,
        references, 1);
    let rr = relativeRisk(data, references);
    let container = {};
    let esLog = esLogTs(data, references);
    let esRr = 0;
    let obj = {};
    references.forEach((el) => {
        obj = {
            tasso: 0,
            lcl: 0,
            ucl: 0,
        };
        esRr = Math.sqrt(Math.pow(esLog[el], 2) + Math.pow(esLog.Puglia, 2));
        obj.tasso = rr[el].tasso;
        obj.lcl = +Math.exp(Math.log(rr[el].tasso) - 1.96 * esRr).toFixed(4);
        obj.ucl = +Math.exp(Math.log(rr[el].tasso) + 1.96 * esRr).toFixed(4);
        container[el] = obj;
    });
    return container;
}

function crudeRate(casi, popolazione, data, references, k = 1000) {
    return references.reduce(
        (obj, riferimento) => ({
            ...obj,
            [riferimento]: data
                .filter((d) => d.riferimento === riferimento)
                .reduce(
                    (sum, row) => ({
                        ...sum,
                        ["tasso"]: popolazione[riferimento] === 0 ?
                            null : k === 1000 ?
                            ((casi[riferimento] / popolazione[riferimento]) * k).toFixed(2) : (casi[
                                riferimento] / popolazione[riferimento]) * k,
                    }), {}
                ),
        }), {}
    );
}

function intervalTgPrevalenzaAsl(references, data) {
    let rate = crudeRate(extractTotal("casi", data, references), extractTotal("popolazione", data, references), data,
        references, 1);
    let population = extractTotal("popolazione", data, references);
    let sqrt = 0;
    let container = {};
    let obj = {};
    references.forEach((el) => {
        obj = {
            tasso: 0,
            lcl: 0,
            ucl: 0,
        };
        sqrt = Math.sqrt(rate[el]["tasso"] / population[el]);
        obj.lcl = +(Math.max(0, rate[el]["tasso"] - 1.96 * sqrt) * 1000).toFixed(2);
        obj.ucl = +(Math.min(1, rate[el]["tasso"] + 1.96 * sqrt) * 1000).toFixed(2);
        obj.tasso = +(rate[el]["tasso"] * 1000).toFixed(2);
        container[el] = obj;
    });
    return container;
}

const sorter = (a, b) => {
    a = a[1].tasso;
    b = b[1].tasso;
    if (a > b) return -1;
    if (a == b) return 0;
    if (a < b) return 1;
};

function sameValues(arr1, arr2) {
    return (
        arr1.length === arr2.length &&
        arr1.every((value) => (arr2.indexOf(value) !== -1 ? true : false))
    );
}

function extractOptions(array) {
    var obj = {};
    var value = "";
    for (var i = 0; i < array.length; i++) {
        value = "value" + (i + 1);
        obj[value] = array[i];
    }
    return obj;
}

function createFilterText(patology, tasso, anno, genere, eta) {
    let filters = patology.toString();
    filters = filters.concat(", ");
    filters = filters.concat(anno);
    filters = filters.concat(", ");
    filters = filters.concat(tasso);
    filters = filters.concat(", ");
    filters = filters.concat(genere);
    filters = filters.concat(", ");
    filters = filters.concat(eta);
    return filters;
}

function calcolaMediana(tassi) {
    var arrayNew = [];
    Object.keys(tassi).forEach(function (key) {
        arrayNew.push(parseFloat(tassi[key]["tasso"]));
    });
    const sorted = Array.from(arrayNew).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

function calcolaGradualita(tassi) {
    var lowest = [];
    Object.keys(tassi).forEach(function (key) {
        lowest.push(parseFloat(tassi[key]["tasso"]));
    });
    lowest = _.min(lowest);

    var average = [];
    Object.keys(tassi).forEach(function (key) {
        average.push(parseFloat(tassi[key]["tasso"]));
    });
    average = _.mean(average);

    var median = calcolaMediana(tassi);
    var delta = (median - lowest) / 5;

    value1 = median - delta * 2;
    value2 = median - delta;
    value3 = median;
    value4 = median + delta;

    var dataC = [];

    Object.keys(tassi).forEach(function (key, index) {
        dataC.push([key, tassi[key]["tasso"]]);
    });

    return dataC;
}

function extractSelectedValues(options) {
    var selected = [];
    $.each(options, function (index, option) {
        if (option.checked) {
            selected.push(option.val);
        }
    });
    return selected;
}

var rateOptions = [{
        val: "Tasso standardizzato",
        checked: true
    },
    {
        val: "Tasso grezzo",
        checked: false
    },
    {
        val: "Rischio relativo",
        checked: false
    },
];


var ageOptions = [{
        val: "40-44",
        checked: true
    },
    {
        val: "45-49",
        checked: true
    },
    {
        val: "50-54",
        checked: true
    },
    {
        val: "55-59",
        checked: true
    },
    {
        val: "60-64",
        checked: true
    },
    {
        val: "65-69",
        checked: true
    },
    {
        val: "70-74",
        checked: true
    },
    {
        val: "75-79",
        checked: true
    },
    {
        val: "80-84",
        checked: true
    },
    {
        val: ">=85",
        checked: true
    },
];

var sexOptions = [{
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

function createFilter(options, labelText, container, includeSelectButtons, singleSelection, filterName = "") {
    var $dropdown = $("<div />").addClass("dropdown");
    var $button = $("<button />").text(labelText);
    var $dropdownMenu = $("<ul />").addClass("dropdown-menu");

    $.each(options, function (index, option) {
        var $input;
        if (singleSelection) {
            $input = $("<input />").attr({
                type: "radio",
                name: labelText.replace(/\s+/g, "_"),
                value: option.val,
                checked: option.checked,
            });
        } else {
            $input = $("<input />").attr({
                type: "checkbox",
                value: option.val,
                checked: option.checked,
            });
        }

        var $label = $("<label />").append($input, $("<span />").text(option.val));

        var $menuItem = $("<li />").append($label);
        $dropdownMenu.append($menuItem);

        $input.on("change", function () {
            if (singleSelection) {
                $dropdownMenu
                    .find("input[type='radio']")
                    .not(this)
                    .prop("checked", false);
            }
            updateButtonText();
        });
    });

    function updateButtonText() {
        var selectedOptions = $dropdownMenu.find("input:checked");
        var numSelected = selectedOptions.length;
        if (numSelected > 0 && numSelected <= 3) {
            var buttonText = "";
            selectedOptions.each(function () {
                buttonText += $(this).val() + ", ";
            });
            buttonText = buttonText.slice(0, -2);
            $button.text(buttonText);
        } else if (numSelected > 3) {
            $button.text(numSelected + " opzioni selezionate");
        } else {
            $button.text(labelText);
        }
    }

    $dropdownMenu.css({
        display: "none",
        position: "absolute",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "5px",
        listStyle: "none",
        margin: "0",
        width: "auto",
        maxWidth: "200px",
        maxHeight: "200px",
        overflowX: "hidden",
        overflowY: "auto",
    });

    $dropdownMenu.find("li").css({
        padding: "5px",
    });

    $dropdownMenu.find("label").css({
        display: "flex",
        alignItems: "center",
    });

    $dropdownMenu.find("input[type='checkbox']").css({
        marginRight: "5px",
    });

    $dropdownMenu.find("label span").css({
        marginLeft: "5px",
    });

    $button.css({
        padding: "4px 8px",
        marginRight: "4px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        backgroundColor: "#f9f9f9",
        cursor: "pointer",
    });

    $button.hover(
        function () {
            $(this).css("backgroundColor", "#f0f0f0");
        },
        function () {
            $(this).css("backgroundColor", "#f9f9f9");
        }
    );

    $button.on("click", function () {
        $(".dropdown-menu").not($dropdownMenu).hide();
        $dropdownMenu.toggle();
    });

    $dropdown.append($button, $dropdownMenu);

    if (includeSelectButtons) {
        var $searchBox = $("<input />")
            .css({
                width: "100%",
                border: "0px",
                marginBottom: "6px",
            })
            .attr({
                type: "text",
                placeholder: "Cerca...",
            })
            .on("input", function () {
                var searchValue = $(this).val().toLowerCase();
                $dropdownMenu.find("label").each(function () {
                    var text = $(this).text().toLowerCase();
                    $(this).parent().toggle(text.includes(searchValue));
                });
            });

        var $searchItem = $("<li />").append($searchBox);
        $dropdownMenu.append($searchItem);

        var $selectAllButton = $("<button />")
            .text("Seleziona Tutto")
            .css({
                width: "100%",
                border: "1px solid",
                borderRadius: "4px",
                backgroundColor: "white",
                cursor: "pointer",
                marginY: "6px",
            })
            .on("click", function () {
                $dropdownMenu.find("input[type='checkbox']").prop("checked", true);
                var newOptions = options.map((el) => {
                    return el.val;
                });
                selectedFilters[filterName] = newOptions;
                updateChart(selectedFilters);
                updateButtonText();
            })
            .hover(
                function () {
                    $(this).css({
                        backgroundColor: "grey",
                        color: "white"
                    });
                },
                function () {
                    $(this).css({
                        backgroundColor: "white",
                        color: "black"
                    });
                }
            );

        var $deselectAllButton = $("<button />")
            .text("Pulisci")
            .css({
                width: "100%",
                border: "1px solid",
                borderRadius: "4px",
                marginBottom: "5px",
                backgroundColor: "white",
                cursor: "pointer",
                marginY: "6px",
            })
            .on("click", function () {
                $dropdownMenu.find("input[type='checkbox']").prop("checked", false);
                updateChart(selectedFilters, "Nessuna opzione selezionata");
                updateButtonText();
            })
            .hover(
                function () {
                    $(this).css({
                        backgroundColor: "grey",
                        color: "white"
                    });
                },
                function () {
                    $(this).css({
                        backgroundColor: "white",
                        color: "black"
                    });
                }
            );
        var $buttonsContainer = $("<div />")
            .addClass("dropdown-buttons")
            .append($searchBox, $deselectAllButton, $selectAllButton);
        $dropdownMenu.prepend($buttonsContainer);
    }
    container.append($dropdown);
}
var selectedFilters = {
    rateOptions: extractSelectedValues(rateOptions),
    yearOptions: extractSelectedValues(yearOptions),
    sexOptions: extractSelectedValues(sexOptions),
    ageOptions: extractSelectedValues(ageOptions),
};
