/**
 * VARIABILI COMUNI
 * Sezioni: Cronicità
 * Grafico: 1
 * Titolo: Prevalenza del XXXX per Comuni
 * Descrizione: Grafico con la mappa dei comuni della Puglia
 */
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


/**
 * FUNZIONI COMUNI
 * Sezioni: Cronicità
 * Grafico: 1
 * Titolo: Prevalenza del XXXX per Comuni
 * Descrizione: Grafico con la mappa dei comuni della Puglia
 */

/**
 * @param {*} column
 * @param {*} array
 * @param {*} dataset
 * @returns
 */
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

/**
 * @param {*} ageClasses
 * @param {*} ageClassesMap
 * @returns
 */
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

const extractFilter = (column) => {
    return data.reduce(
        (values, row) =>
        values.indexOf(row[column]) === -1 ?
        values.concat([row[column]]) :
        values,
        []
    );
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

//---------------------filters------------------------
$(element).empty();
$(element).css({
    overflow: "hidden",
});

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

var $mainContainer = $("<div />").addClass("main-container").css({
    display: "flex",
    justifyContent: "space-between",
});
$(element).append($mainContainer);

var $dropdownsContainer = $("<div />").addClass("dropdowns-container").css({
    display: "flex",
});
$mainContainer.append($dropdownsContainer);

var $rightContainer = $("<div />").addClass("right-container").css({
    display: "flex",
});
$mainContainer.append($rightContainer);

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

var $rateContainer = $("<div />").addClass("filter-container");
createFilter(rateOptions, "Tasso standardizzato", $rateContainer, false, true);
$rateContainer
    .find(".dropdown-menu input[type='radio']")
    .on("change", function () {
        $chartM.LoadingOverlay("show");
        selectedFilters.rateOptions = $rateContainer
            .find("input:checked")
            .map(function () {
                return $(this).val();
            })
            .get();
        if (
            isAgeClassesNotConsecutive(selectedFilters.ageOptions, ageClassesMap) &&
            selectedFilters.ageOptions.length > 1
        ) {
            updateChart(
                selectedFilters,
                "Le classi di etÃ  selezionate non sono consecutive!"
            );
        } else if (selectedFilters.ageOptions.length === 0) {
            updateChart(selectedFilters, "Nessuna opzione selezionata");
        } else {
            updateChart(selectedFilters);
        }
    });
$dropdownsContainer.append($rateContainer);

var $yearContainer = $("<div />").addClass("filter-container");
//"2019"
createFilter(yearOptions, yearSelectedForFilter, $yearContainer, true, true, "yearOptions");
$yearContainer
    .find(".dropdown-menu input[type='radio']")
    .on("change", function () {
        $chartM.LoadingOverlay("show");
        var selectedYear = $yearContainer.find("input:checked").val();
        selectedFilters.yearOptions = selectedYear ? [selectedYear] : [];

        if (
            isAgeClassesNotConsecutive(selectedFilters.ageOptions, ageClassesMap) &&
            selectedFilters.ageOptions.length > 1
        ) {
            updateChart(
                selectedFilters,
                "Le classi di etÃ  selezionate non sono consecutive!"
            );
        } else if (selectedFilters.ageOptions.length === 0) {
            updateChart(selectedFilters, "Nessuna opzione selezionata");
        } else {
            updateChart(selectedFilters);
        }
    });
$dropdownsContainer.append($yearContainer);
$yearContainer.find(".dropdown-buttons button").hide();

var $sexContainer = $("<div />").addClass("filter-container");
createFilter(sexOptions, "Maschi e Femmine", $sexContainer, false, true);
$sexContainer
    .find(".dropdown-menu input[type='radio']")
    .on("change", function () {
        $chartM.LoadingOverlay("show");
        selectedFilters.sexOptions = $sexContainer
            .find("input:checked")
            .map(function () {
                return $(this).val();
            })
            .get();
        if (
            isAgeClassesNotConsecutive(selectedFilters.ageOptions, ageClassesMap) &&
            selectedFilters.ageOptions.length > 1
        ) {
            updateChart(
                selectedFilters,
                "Le classi di etÃ  selezionate non sono consecutive!"
            );
        } else if (selectedFilters.ageOptions.length === 0) {
            updateChart(selectedFilters, "Nessuna opzione selezionata");
        } else {
            updateChart(selectedFilters);
        }
    });
$dropdownsContainer.append($sexContainer);

var $ageContainer = $("<div />").addClass("filter-container");
createFilter(ageOptions, "Classe EtÃ ", $ageContainer, true, false, "ageOptions");
$ageContainer
    .find(".dropdown-menu input[type='checkbox']")
    .on("change", function () {
        $chartM.LoadingOverlay("show");
        selectedFilters.ageOptions = $ageContainer
            .find("input:checked")
            .map(function () {
                return $(this).val();
            })
            .get();
        if (
            isAgeClassesNotConsecutive(selectedFilters.ageOptions, ageClassesMap) &&
            selectedFilters.ageOptions.length > 1
        ) {
            updateChart(
                selectedFilters,
                "Le classi di etÃ  selezionate non sono consecutive!"
            );
        } else if (selectedFilters.ageOptions.length === 0) {
            updateChart(selectedFilters, "Nessuna opzione selezionata");
        } else {
            updateChart(selectedFilters);
        }
    });
$dropdownsContainer.append($ageContainer);

var $resetButton = $("<button />")
    .text("Ripristina")
    .css({
        padding: "4px 8px",
        marginRight: "4px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        backgroundColor: "#f9f9f9",
        cursor: "pointer",
    })
    .on("click", function () {
        $chartM.LoadingOverlay("show");
        $rateContainer.empty();
        createFilter(
            rateOptions,
            "Tasso Standardizzato",
            $rateContainer,
            false,
            true
        );
        $rateContainer
            .find(".dropdown-menu input[type='radio']")
            .on("change", function () {
                $chartM.LoadingOverlay("show");
                selectedFilters.rateOptions = $rateContainer
                    .find("input:checked")
                    .map(function () {
                        return $(this).val();
                    })
                    .get();
                if (
                    isAgeClassesNotConsecutive(selectedFilters.ageOptions, ageClassesMap) &&
                    selectedFilters.ageOptions.length > 1
                ) {
                    updateChart(
                        selectedFilters,
                        "Le classi di etÃ  selezionate non sono consecutive!"
                    );
                } else if (selectedFilters.ageOptions.length === 0) {
                    updateChart(selectedFilters, "Nessuna opzione selezionata");
                } else {
                    updateChart(selectedFilters);
                }
            });

        $yearContainer.empty();
        //"2019"
        createFilter(yearOptions, yearSelectedForFilter, $yearContainer, true, true, "yearOptions");
        $yearContainer
            .find(".dropdown-menu input[type='radio']")
            .on("change", function () {
                $chartM.LoadingOverlay("show");
                selectedFilters.yearOptions = $yearContainer
                    .find("input:checked")
                    .map(function () {
                        return $(this).val();
                    })
                    .get();
                if (
                    isAgeClassesNotConsecutive(selectedFilters.ageOptions, ageClassesMap) &&
                    selectedFilters.ageOptions.length > 1
                ) {
                    updateChart(
                        selectedFilters,
                        "Le classi di etÃ  selezionate non sono consecutive!"
                    );
                } else if (selectedFilters.ageOptions.length === 0) {
                    updateChart(selectedFilters, "Nessuna opzione selezionata");
                } else {
                    updateChart(selectedFilters);
                }
            });
        $yearContainer.find(".dropdown-buttons button").hide();

        $sexContainer.empty();
        createFilter(sexOptions, "Maschi e Femmine", $sexContainer, false, true);
        $sexContainer
            .find(".dropdown-menu input[type='radio']")
            .on("change", function () {
                $chartM.LoadingOverlay("show");
                selectedFilters.sexOptions = $sexContainer
                    .find("input:checked")
                    .map(function () {
                        return $(this).val();
                    })
                    .get();
                if (
                    isAgeClassesNotConsecutive(selectedFilters.ageOptions, ageClassesMap) &&
                    selectedFilters.ageOptions.length > 1
                ) {
                    updateChart(
                        selectedFilters,
                        "Le classi di etÃ  selezionate non sono consecutive!"
                    );
                } else if (selectedFilters.ageOptions.length === 0) {
                    updateChart(selectedFilters, "Nessuna opzione selezionata");
                } else {
                    updateChart(selectedFilters);
                }
            });
        $ageContainer.empty();
        createFilter(ageOptions, "Classe EtÃ ", $ageContainer, true, false, "ageOptions");
        $ageContainer
            .find(".dropdown-menu input[type='checkbox']")
            .on("change", function () {
                $chartM.LoadingOverlay("show");
                selectedFilters.ageOptions = $ageContainer
                    .find("input:checked")
                    .map(function () {
                        return $(this).val();
                    })
                    .get();
                if (
                    isAgeClassesNotConsecutive(selectedFilters.ageOptions, ageClassesMap) &&
                    selectedFilters.ageOptions.length > 1
                ) {
                    updateChart(
                        selectedFilters,
                        "Le classi di etÃ  selezionate non sono consecutive!"
                    );
                } else if (selectedFilters.ageOptions.length === 0) {
                    updateChart(selectedFilters, "Nessuna opzione selezionata");
                } else {
                    updateChart(selectedFilters);
                }
            });
        selectedFilters = {
            rateOptions: extractSelectedValues(rateOptions),
            yearOptions: extractSelectedValues(yearOptions),
            sexOptions: extractSelectedValues(sexOptions),
            ageOptions: extractSelectedValues(ageOptions),
        };
        updateChart(selectedFilters);
    });

let patology = extractFilter("patologia", data);
patology = patology.toString();

var $chartM = $("<div />");
$rightContainer.append($resetButton);
$(element).append($mainContainer);
$(element).append($chartM);

var comuniDataset = createDataset("tipo_riferimento", ["Comune"], data);
var comuniDataset2 = createDataset("tipo_riferimento", ["Comune", "Regione"], data);
let riferimentiWithRegione = comuniDataset2.reduce((l, i) => (l.indexOf(i.riferimento) !== -1 ? l : l.concat([i
    .riferimento
])), []);
const riferimentiComuni = comuniDataset.reduce((l, i) => (l.indexOf(i.riferimento) !== -1 ? l : l.concat([i
    .riferimento
])), []);
const geojson = dataMapComuni();

// ---------- UPDATE  DATI ----------

function updateChart(selectedFilters, messageError = "") {
    if (messageError !== "") {
        tassi = [];
        filters = messageError;

        chartM = Highcharts.chart($chartM.get(0), {
            credits: {
                enabled: false,
            },
            exporting: {
                enabled: false
            },
            title: {
                text: text,
                style: {
                    fontSize: "28px",
                },
            },
            subtitle: {
                text: filters,
                style: {
                    fontSize: "18px",
                },
            },

        });
    } else {
        var newDataset = createDataset("tipo_riferimento", ["Comune"], data);
        newDataset = createDataset("anno", selectedFilters.yearOptions, newDataset);
        newDataset = createDataset("sesso", selectedFilters.sexOptions, newDataset);
        newDataset = createDataset("classe_eta", selectedFilters.ageOptions, newDataset);

        var newDatasetWithRegion = createDataset("tipo_riferimento", ["Comune", "Regione"], data);
        newDatasetWithRegion = createDataset("anno", selectedFilters.yearOptions, newDatasetWithRegion);
        newDatasetWithRegion = createDataset("sesso", selectedFilters.sexOptions, newDatasetWithRegion);
        newDatasetWithRegion = createDataset("classe_eta", selectedFilters.ageOptions, newDatasetWithRegion);

        let tassi = selectedFilters.rateOptions[0] === 'Tasso standardizzato' ?
            standardRate(calcoloWi(
                    extractTotal("peso_classe", newDataset, riferimentiComuni),
                    newDataset,
                    riferimentiComuni
                ),
                newDataset,
                riferimentiComuni
            ) :
            selectedFilters.rateOptions[0] === 'Tasso grezzo' ?
            crudeRate(
                extractTotal("casi", newDataset, riferimentiComuni),
                extractTotal("popolazione", newDataset, riferimentiComuni),
                newDataset,
                riferimentiComuni
            ) :
            relativeRisk(newDatasetWithRegion, riferimentiWithRegione);

        dataC = calcolaGradualita(tassi);

        tassoText = selectedFilters.rateOptions[0] === 'Tasso standardizzato' ?
            "Tasso standardizzato" :
            selectedFilters.rateOptions[0] === 'Tasso grezzo' ?
            "Tasso grezzo" :
            "Rischio Relativo";

        let filters = createFilterText(
            patology,
            tassoText,
            selectedFilters.yearOptions,
            selectedFilters.sexOptions,
            selectedFilters.ageOptions.length == 10 ? "Tutte le classi etÃ " : selectedFilters.ageOptions
        );

        const newDataC = [];

        for (let i = 0; i < dataC.length; i++) {
            const array = dataC[i];
            const internalArray = [];

            for (let j = 0; j < array.length; j++) {
                if (array[j] === null) {
                    internalArray.push("");
                } else {
                    internalArray.push(array[j]);
                }
            }
            newDataC.push(internalArray);
        }

        chartM = Highcharts.mapChart($chartM.get(0), {
            credits: {
                enabled: false,
            },
            chart: {
                map: geojson,
            },
            title: {
                text: text,
                style: {
                    fontSize: "28px",
                },
            },
            subtitle: {
                text: filters,
                style: {
                    fontSize: "18px",
                },
            },
            mapNavigation: {
                enabled: true,
                enableDoubleClickZoomTo: true,
                buttonOptions: {
                    verticalAlign: "top",
                },
            },
            colors: ["#fff5f0", "#ebc9cb", "#d397aa", "#c45773", "#bc2c4f"],
            colorAxis: {
                dataClassColor: "category",
                dataClasses: selectedFilters.rateOptions != "Rischio relativo" ? [{
                        to: to1,
                    },
                    {
                        from: to1,
                        to: to2,
                    },
                    {
                        from: to2,
                        to: to3,
                    },
                    {
                        from: to3,
                        to: to4,
                    },
                    {
                        from: to4,
                    },
                ] : [{
                        to: value1.toFixed(3),
                    },
                    {
                        from: parseFloat(value1 + 0.001).toFixed(3),
                        to: value2,
                    },
                    {
                        from: parseFloat(value2 + 0.001).toFixed(3),
                        to: value3,
                    },
                    {
                        from: parseFloat(value3 + 0.001).toFixed(3),
                        to: value4,
                    },
                    {
                        from: parseFloat(value4 + 0.001).toFixed(3),
                    },
                ]

            },
            exporting: {
                enabled: false,
            },
            legend: {
                title: {
                    text: "Legenda",
                },
                align: "left",
                verticalAlign: "bottom",
                floating: true,
                layout: "vertical",
                valueDecimals: 3,
                backgroundColor: "rgba(255,255,255,0.9)",
                symbolRadius: 2,
                symbolHeight: 14,
                labelFormatter: function () {
                    if (
                        this.colorIndex === 1 ||
                        this.colorIndex === 2 ||
                        this.colorIndex === 3
                    )
                        return ">" + this.from + " - <=" + this.to.toFixed(3);
                    else if (this.colorIndex === 0) return "<=" + this.to;
                    else if (this.colorIndex === 4) return ">" + this.from;
                },
            },
            caption: {
                text: selectedFilters.rateOptions == "Tasso standardizzato" ?
                    "Prevalenza per 1.000 residenti" :
                    selectedFilters.rateOptions == "Tasso grezzo" ?
                    "Prevalenza per 1.000 residenti" :
                    selectedFilters.rateOptions == "Rischio relativo" ?
                    "Rischio relativo" :
                    "",
                align: 'center',
                verticalAlign: 'bottom',
                style: {
                    fontSize: '12px',
                    color: '#333'
                },
                margin: 10
            },
            tooltip: {
                backgroundColor: "black",
                borderColor: "black",
                borderRadius: 5,
                borderWidth: 1,
                style: {
                    color: "white",
                    fontSize: "12px",
                },
            },
            series: [{
                data: newDataC,
                keys: ["NAME_1", "value"],
                joinBy: "NAME_1",
                name: tassoText,
                dataLabels: {
                    enabled: false,
                    format: "{point.properties.NAME_1}",
                },
                tooltip: {
                    pointFormat: "{point.properties.NAME_1} :" + (" {point.value}" == null ? "" :
                        " {point.value}"),
                },
            }, ],
        });
    }
    $chartM.LoadingOverlay("hide");
}
updateChart(selectedFilters)

//----------------------export---------------------------

function downloadCSV(array, filename) {
    csv = "data:text/csv;charset=utf-8," + array;
    excel = encodeURI(csv);
    link = document.createElement("a");
    link.setAttribute("href", excel);
    link.setAttribute("download", filename);
    link.click();
}

function dataToCsv(config, keys, header = true) {
    let headerRow = config.map((obj) => obj.field).join(";");
    let content = keys.reduce((rows, key) => {
        let csvRow = config
            .reduce((row, obj) => {
                let varType = typeof obj.value;
                obj.value === null ?
                    row.push(key) :
                    varType === "function" ?
                    row.push(obj.value(key)) :
                    varType === "string" || varType === "number" ?
                    row.push(obj.value) :
                    varType === "object" && obj.valueKey === null ?
                    row.push(obj.value[key]) :
                    row.push(obj.value[key][obj.valueKey]);
                return row;
            }, [])
            .join(";");
        return rows.concat("\n", csvRow);
    }, "");
    if (!header) {
        return content;
    }
    return headerRow.concat(content);
}

function configExport(newDataset, newDatasetWithRegion, riferimentiComuni, riferimentiWithRegione) {
    let population = extractTotal("popolazione", newDataset, riferimentiComuni);
    let cases = extractTotal("casi", newDataset, riferimentiComuni);
    let ts = intervalTsPrevalenteAsl(riferimentiComuni, newDataset);
    let tg = intervalTgPrevalenzaAsl(riferimentiComuni, newDataset);
    let rr = intervalRrPrevalenzaAsl(riferimentiWithRegione, newDatasetWithRegion);
    return [ts, tg, rr, population, cases];
}

function checkCases(cases) {
    let result = {};
    for (const key in cases) {
        if (cases.hasOwnProperty(key)) {
            result[key] = cases[key] == 0 ? 0 : cases[key] <= 3 ? "(*)" : cases[key];
        }
    }
    return result;
}

function createExport(newDataset, newDatasetWithRegion, riferimentiComuni, riferimentiWithRegione) {
    let [ts, tg, rr, population, cases] = configExport(newDataset, newDatasetWithRegion, riferimentiComuni,
        riferimentiWithRegione);
    var rrForExp = {};
    var tsForExp = {};
    var tgForExp = {};

    for (const [key, value] of Object.entries(ts)) {
        if (value["tasso"] != 0) {
            tsForExp[key] = {
                tasso: value["tasso"].toFixed(2),
                lcl: value["lcl"].toFixed(2),
                ucl: value["ucl"].toFixed(2),
            };
        } else {
            tsForExp[key] = {
                tasso: "",
                lcl: "",
                ucl: "",
            };
        }
    }

    for (const [key, value] of Object.entries(tg)) {
        if (value["tasso"] != 0) {
            tgForExp[key] = {
                tasso: value["tasso"].toFixed(2),
                lcl: value["lcl"].toFixed(2),
                ucl: value["ucl"].toFixed(2),
            };
        } else {
            tgForExp[key] = {
                tasso: "",
                lcl: "",
                ucl: "",
            };
        }
    }

    for (const [key, value] of Object.entries(rr)) {
        if (value["tasso"] != null) {
            rrForExp[key] = {
                tasso: value["tasso"].toFixed(3),
                lcl: value["lcl"].toFixed(3),
                ucl: value["ucl"].toFixed(3),
            };
        } else {
            rrForExp[key] = {
                tasso: "",
                lcl: "",
                ucl: "",
            };
        }
    }

    let fields = [{
            field: "Tipo Area Geografica",
            value: "Comune",
            valueKey: null,
        },
        {
            field: "Area Geografica",
            value: null,
            valueKey: null,
        },
        {
            field: "Patologia",
            value: patology,
            valueKey: null,
        },
        {
            field: "Anno",
            value: selectedFilters.yearOptions.join(","),
            valueKey: null,
        },
        {
            field: "Genere",
            value: selectedFilters.sexOptions.join(","),
            valueKey: null,
        },
        {
            field: "Classi eta" + "\u0060",
            value: selectedFilters.ageOptions.join(","),
            valueKey: null,
        },
        {
            field: "Casi",
            value: checkCases(cases),
            valueKey: null,
        },
        {
            field: "Popolazione",
            value: population,
            valueKey: null,
        },
        {
            field: "Tasso standardizzato",
            value: tsForExp,
            valueKey: "tasso",
        },
        {
            field: "lcl",
            value: tsForExp,
            valueKey: "lcl",
        },
        {
            field: "ucl",
            value: tsForExp,
            valueKey: "ucl",
        },
        {
            field: "Tasso grezzo",
            value: tgForExp,
            valueKey: "tasso",
        },
        {
            field: "lcl",
            value: tgForExp,
            valueKey: "lcl",
        },
        {
            field: "ucl",
            value: tgForExp,
            valueKey: "ucl",
        },
        {
            field: "Rischio relativo",
            value: rrForExp,
            valueKey: "tasso",
        },
        {
            field: "lcl",
            value: rrForExp,
            valueKey: "lcl",
        },
        {
            field: "ucl",
            value: rrForExp,
            valueKey: "ucl",
        },
    ];
    return [fields, riferimentiComuni, riferimentiWithRegione];
}

var $export = $("<a />")
    .text("Esporta CSV")
    .css({
        width: "100%",
        padding: "1px",
        display: "inline-block",
        textDecoration: "none",
        color: "black",
        backgroundColor: "transparent",
    })
    .on("mouseenter", function () {
        $(this).css("background-color", "#f0f0f0");
    })
    .on("mouseleave", function () {
        $(this).css("background-color", "transparent");
    })
    .on("click", function (e) {
        var typeAreaGSelected = ["Comune"];
        var newDataset = createDataset("anno", selectedFilters.yearOptions, data);
        newDataset = createDataset("sesso", selectedFilters.sexOptions, newDataset);
        newDataset = createDataset("classe_eta", selectedFilters.ageOptions, newDataset);
        newDataset = createDataset("tipo_riferimento", typeAreaGSelected, newDataset);
        var selectedAreaG = extractFilter("riferimento", newDataset);
        newDataset = createDataset("riferimento", selectedAreaG, newDataset);

        var newDatasetWithRegion = createDataset("tipo_riferimento", ["Comune", "Regione"], data);
        newDatasetWithRegion = createDataset("anno", selectedFilters.yearOptions, newDatasetWithRegion);
        newDatasetWithRegion = createDataset("sesso", selectedFilters.sexOptions, newDatasetWithRegion);
        newDatasetWithRegion = createDataset("classe_eta", selectedFilters.ageOptions, newDatasetWithRegion);

        if (newDataset.length === 0) {
            var headerExp = [{
                    field: "Tipo Area Geografica",
                },
                {
                    field: "Area Geografica",
                },
                {
                    field: "Patologia",
                },
                {
                    field: "Anno",
                },
                {
                    field: "Genere",
                },
                {
                    field: "Classi eta" + "\u0060",
                },
                {
                    field: "Casi",
                },
                {
                    field: "Popolazione",
                },
                {
                    field: "Tasso standardizzato",
                },
                {
                    field: "lcl",
                },
                {
                    field: "ucl",
                },
                {
                    field: "Tasso grezzo",
                },
                {
                    field: "lcl",
                },
                {
                    field: "ucl",
                },
                {
                    field: "Rischio relativo",
                },
                {
                    field: "lcl",
                },
                {
                    field: "ucl",
                },
            ];

            downloadCSV(
                headerExp.map((obj) => obj.field).join(";"),
                text + ".csv"
            );
        } else {
            var [fields, keys] = createExport(newDataset, newDatasetWithRegion, riferimentiComuni,
                riferimentiWithRegione);

            var cc = dataToCsv(fields, keys);
            downloadCSV(cc, text + ".csv");
        }
        $modal.hide();
    });

//LINK EXPORT PNG
var $exportImagePNG = $("<a/>")
    .css({
        display: "inline-block",
        textDecoration: "none",
        color: "black",
        backgroundColor: "transparent",
    })
    .on("mouseenter", function () {
        $(this).css("background-color", "#f0f0f0");
    })
    .on("mouseleave", function () {
        $(this).css("background-color", "transparent");
    })
    .on("click", function () {
        var originalWidth = chartM.chartWidth;
        var originalHeight = chartM.chartHeight;
        chartM.setSize(1200, 600);
        chartM.exportChart({
            type: "image/png",
            filename: text,
            width: 1800,
        });
        chartM.setSize(originalWidth, originalHeight);
        $modal.hide();
    })
    .text("Esporta PNG");

//LINK EXPORT JPEG
var $exportImageJPEG = $("<a/>")
    .css({
        display: "inline-block",
        textDecoration: "none",
        color: "black",
        backgroundColor: "transparent",
    })
    .on("mouseenter", function () {
        $(this).css("background-color", "#f0f0f0");
    })
    .on("mouseleave", function () {
        $(this).css("background-color", "transparent");
    })
    .on("click", function () {
        var originalWidth = chartM.chartWidth;
        var originalHeight = chartM.chartHeight;
        chartM.setSize(1200, 600);
        chartM.exportChart({
            type: "image/jpeg",
            filename: text,
            width: 1800,
        });
        chartM.setSize(originalWidth, originalHeight);
        $modal.hide();
    })
    .text("Esporta JPEG");

//LINK EXPORT PDF
var $exportImagePDF = $("<a/>")
    .css({
        display: "inline-block",
        textDecoration: "none",
        color: "black",
        backgroundColor: "transparent",
    })
    .on("mouseenter", function () {
        $(this).css("background-color", "#f0f0f0");
    })
    .on("mouseleave", function () {
        $(this).css("background-color", "transparent");
    })
    .on("click", function () {
        var originalWidth = chartM.chartWidth;
        var originalHeight = chartM.chartHeight;
        chartM.setSize(1200, 600);
        chartM.exportChart({
            type: "application/pdf",
            filename: text,
            width: 1800,
        });
        chartM.setSize(originalWidth, originalHeight);
        $modal.hide();
    })
    .text("Esporta PDF");

//LINK EXPORT SVG
var $exportSVG = $("<a/>")
    .css({
        display: "inline-block",
        textDecoration: "none",
        color: "black",
        backgroundColor: "transparent",
    })
    .on("mouseenter", function () {
        $(this).css("background-color", "#f0f0f0");
    })
    .on("mouseleave", function () {
        $(this).css("background-color", "transparent");
    })
    .on("click", function () {
        var svgMarkup = chartM.getSVG();
        var blob = new Blob([svgMarkup], {
            type: "image/svg+xml"
        });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = text;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        $modal.hide();
    })
    .text("Esporta SVG");

//LINK PRINT IMMAGINE
var $printChartLink = $("<a/>")
    .css({
        display: "inline-block",
        textDecoration: "none",
        color: "black",
        backgroundColor: "transparent",
    })
    .on("mouseenter", function () {
        $(this).css("background-color", "#f0f0f0");
    })
    .on("mouseleave", function () {
        $(this).css("background-color", "transparent");
    })
    .on("click", function () {
        chartM.print();
        $modal.hide();
    })
    .text("Stampa");

var $exportButton = $("<button />")
    .text("Esporta")
    .css({
        padding: "4px 8px",
        marginRight: "4px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        backgroundColor: "#f9f9f9",
        cursor: "pointer",
    })
    .on("click", function () {
        if ($modal.is(":visible")) {
            $modal.hide();
            return;
        }
        $modal.show();
    });

var $modal = $("<div/>").hide().css({
    display: "none",
    marginTop: "33px",
    marginLeft: "40px",
    position: "absolute",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "5px",
    width: "100px",
    overflowX: "hidden",
    overflowY: "auto",
    zIndex: "9999",
});

$modal.append(
    $export,
    $("<br>"),
    $exportImagePNG,
    $("<br>"),
    $exportImageJPEG,
    $("<br>"),
    $exportSVG,
    $("<br>"),
    $exportImagePDF,
    $("<br>"),
    $printChartLink
);
$rightContainer.append($exportButton, $modal);

$resetButton.hover(
    function () {
        $(this).css("backgroundColor", "#f0f0f0");
    },
    function () {
        $(this).css("backgroundColor", "#f9f9f9");
    }
);

$exportButton.hover(
    function () {
        $(this).css("backgroundColor", "#f0f0f0");
    },
    function () {
        $(this).css("backgroundColor", "#f9f9f9");
    }
);