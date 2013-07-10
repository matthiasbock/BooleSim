/*
 * Export the update rules to a R BoolNet file. Take care of the
 * difference is logical operators between JS and R.
 * @returns {string} The R BoolNet file data.
 */
exportRBoolNet = function (network) {
    var rbn = 'targets, factors\n';
    var i, r;

    // Replace the JS logical operators with those of R for each update
    // rule
    for (i in network.rules) {
        r = network.rules[i].replace(/&&/g, '&')
            .replace(/\|\|/g, '|')
            .replace(/true/g, 'TRUE')
            .replace(/false/g, 'FALSE');
        rbn += i + ', ' + r + '\n';
    }
    return rbn;
};

/*
 * Export the update rules to a Python BooleanNet file. Take care of the
 * difference is logical operators between JS and Python.
 * @returns {string} The Python BooleanNet file data.
 */
exportPythonBooleanNet = function (network) {
    var pbn = '';
    var i, r;

    // Replace the JS logical operators with those of Python for each update
    // rule
    for (i in network.rules) {
        r = network.rules[i].replace(/&&/g, ' and ')
            .replace(/\|\|/g, ' or ')
            .replace(/true/g, 'True')
            .replace(/false/g, 'False')
            .replace(/[!]/g, ' not ')
            .replace(/ +/g, ' ');
        pbn += i + '* = ' + r + '\n';
    }
    return pbn;
};


/*
 * Export all states to JSON. Required for the simulation of SBML files
 * using libscopes on the server.
 * @param {Array} states A list of the states which have to exported.
 * @returns {string} The JSON string for the exported states.
 */
exportStateJSON = function (states) {
    var i, j;
    var exportStates = [];
    // Loop over all states and convert Boolean to 0/1 for the Python
    // libscopes library
    for (i in states) {
        exportStates.push({});
        for (j in states[i]) {
            if (states[i][j]) exportStates[i][j] = 1;
            else exportStates[i][j] = 0;
        }
    }
    return JSON.stringify(exportStates);
};