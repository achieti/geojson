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
            points['to1'] = 54.91;
            points['from1'] = points['to1'];
            points['to2'] = 60.91;
            points['from2'] = points['to2'];
            points['to3'] = 65.43;
            points['from3'] = points['to3'];
            points['to4'] = 72.44;
            points['from4'] = points['to4'];
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
            points['to1'] = 102.02;
            points['from1'] = points['to1'];
            points['to2'] = 109.77;
            points['from2'] = points['to2'];
            points['to3'] = 118.33;
            points['from3'] = points['to3'];
            points['to4'] = 125.94;
            points['from4'] = points['to4'];
    }
    return points;
}
