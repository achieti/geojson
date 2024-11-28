// funzione che restituisce i valori della legenda della mappa
function legendPoints(pathology) {
    var points = [];
    switch (pathology) {
        case 'Scompenso Cardiaco':
            points['to1'] = 87.87;
            points['from1'] = points['to1'];
            points['to2'] = 94.69;
            points['from2'] = points['to2'];
            points['to3'] = 102.16;
            points['from3'] = points['to3'];
            points['to4'] = 112.61;
            points['from4'] = points['to4'];
            break;
        case 'BPCO':
            article = 'della ';
            break;
        case 'Ipertensione':
            points['to1'] = 397.35;
            points['from1'] = points['to1'];
            points['to2'] = 412.84;
            points['from2'] = points['to2'];
            points['to3'] = 428.68;
            points['from3'] = points['to3'];
            points['to4'] = 112.61;
            points['from4'] = points['to4'];
            break;
        default:
            article = ' del ';
    }
    return points;
}
