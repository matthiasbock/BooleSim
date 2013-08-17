var plotH = 20;
var plotW = 100;
var maxColumns = 40;
var timeseriesLabelCounter = 1;
var skipped = 0;

/**
 * Construct the node label column
 * @param {Object} state Current state of the network.
 */
var createNodesColumn = function (state) {
    var yPos = 0;
    plotW = 100;

    for (i in state) {
        plot.append('svg:text')
            .attr('y', function (d) { return yPos; })
            .attr('dx', 10).attr('dy', 15)
            .text(i)
            .attr('style', 'font-size:14px')
            .attr('id', 'label' + i);

        var width = d3.select('#label' + i).node().getBBox()['width'];
        if (width > plotW)
            plotW = width;
        yPos += plotH;
    }
    plotW += 50;
    plot.attr('height', yPos + 50);
};

/**
 * Construct a column with all the states.
 * @param {Object} state Current state of the network.
 * @param {number} count Iteration Counter.
 */
var createStateColumn = function (state, count) {

    // Calculate position of the column
    var relativeX = count % maxColumns;
    var yPos = 0,
        xPos = plotW + relativeX * plotH;
    var color;

    // Replace previous column
    removeStateColumn(relativeX);

    for (i in state) {
        if (state[i])
            color = yellow;
        else
            color = blue;
        // Add a rectangle of required color
        plot.append('svg:rect')
            .attr('class', 'rect' + relativeX)
            .attr('x', xPos).attr('y', function (d) {
                return yPos;
            })
            .attr('width', plotH).attr('height', plotH)
            .attr('fill', color);
        yPos += plotH;
    }

    // Iteration count text on the bottom
    plot.append('svg:text')
        .attr('class', 'timeseriesLabelCounter')
        .attr('id', 'text' + relativeX)
        .attr('x', xPos).attr('y', function (d) { return yPos; })
        //.attr('dx', 5).attr('dy', 15)
        .text(timeseriesLabelCounter);
        //.attr('transform', 'rotate(90 0,15)');
    timeseriesLabelCounter += 1;

    // Add the marker (cursor) for current iteration
    plot.append('svg:rect').attr('height', yPos).attr('width', 7)
        .attr('id', 'currMarker')
        .attr('x', xPos + plotH);
};

/**
 * Delete a column before replacing it.
 * @param {number} index The index of the column to be deleted.
 */
var removeStateColumn = function (index) {
    index = index % maxColumns;
    $('.rect' + index).remove();
    $('#text' + index).remove();
    $('#currMarker').remove();
};

/**
 * Create the Heatmap Plotter.
 */
var createPlotter = function () {

    if (plot !== null) return;

    $('#divTimeseries > svg').remove();

    // Use d3 to create the initial svg with the start states
    plot = d3.select('#divTimeseries').append('svg:svg').attr('xmlns', 'http://www.w3.org/2000/svg');
    createNodesColumn(network.state);

    for (var j = iterationCounter - iterationCounter % maxColumns; j <= iterationCounter; j++)
        createStateColumn(states[j], j);
    skipped = 0;
};

var resetTimeseries = function () {
    plot = null;
    initialIndex = 0;
    iterationCounter = 0;
    timeseriesLabelCounter = 1;
    skipped = 0;
    $('#textIteration').text(timeseriesLabelCounter);
    states = [];
    states.push({});
    $.extend(states[0], network.state);
    $('#tabs').tabs('select', '#tabTimeseries');
    createPlotter();
};

var updateTimeseries = function () {
    // update Time series
    plot = null;
    timeseriesLabelCounter = parseInt($('#text0').text());
    console.log(timeseriesLabelCounter);
    if (timeseriesLabelCounter === "NaN") timeseriesLabelCounter = 1;
    $('#tabs').tabs('select', '#tabTimeseries');
    createPlotter();
};
