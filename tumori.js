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
        default:
            specification = ' del ';
    }
    return specification;
}
