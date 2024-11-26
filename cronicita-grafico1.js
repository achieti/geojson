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
