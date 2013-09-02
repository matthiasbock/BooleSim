
var plotH = 20;
var plotW = 100;
var maxColumns = 40;
var timeseriesLabelCounter = 1;
var skipped = 0;

/**
 * Construct the node label column
 * @param {Object} state Current state of the network.
 */
var createNodeLabelColumn = function (state) {
    var yPos = 0;
    plotW = 100;

    for (node in state) {
        plot.append('svg:text')
            .attr('x', 0)
            .attr('y', function (d) { return yPos+2; })
            .attr('dx', 10)
            .attr('dy', 15)
            .attr('id', 'label'+node)
            .text(node);

        var width = d3.select('#label'+node).node().getBBox()['width'];
        if (width > plotW)
            plotW = width;
        yPos += plotH;
    }
    
    plotW += 20; // padding-right
    
    plot.attr('height', yPos + 50);
};

/**
 * Construct a column with all the states.
 * @param {Object} state Current state of the network.
 * @param {number} count Iteration Counter.
 */
var createNodeStateColumn = function (state, count) {

    // Calculate position of the column
    var relativeX = count % maxColumns;
    var yPos = 0,
        xPos = plotW + relativeX * plotH;
    var color;

    // Replace previous column
    removeNodeStateColumn(relativeX);

    for (node in state) {
        if (state[node])
            color = yellow;
        else
            color = blue;
        // Add a rectangle of required color
        plot.append('svg:rect')
            .attr('class', 'rect' + relativeX)
            .attr('x', xPos)
            .attr('y', function (d) {
                return yPos;
            })
            .attr('width', plotH)
            .attr('height', plotH)
            .attr('fill', color);
        yPos += plotH;
    }

    // Iteration count text on the bottom
    plot.append('svg:text')
        .attr('class', 'timeseriesLabelCounter')
        .attr('id', 'text' + relativeX)
        .attr('x', xPos).attr('y', function (d) { return yPos; })
        .attr('dx', 5).attr('dy', 15)
        //.attr('transform', 'rotate(90 2,2)')
        .text(timeseriesLabelCounter);
        //.attr('transform', 'rotate(90 0,15)');
    timeseriesLabelCounter += 1;

    // Add the marker (cursor) for current iteration
/*    plot.append('svg:rect')
        .attr('height', yPos)
        .attr('width', 15)
        .attr('id', 'currMarker')
        .attr('x', xPos + plotH);
        */
    plot.append('svg:polygon')
        .attr('id', 'currMarker')
        .attr('points', (xPos+plotH)+',0 '+(xPos+(plotH*2))+','+parseInt(yPos/2)+' '+(xPos+plotH)+','+yPos);
};

/**
 * Delete a column before replacing it.
 * @param {number} index The index of the column to be deleted.
 */
var removeNodeStateColumn = function (index) {
    index = index % maxColumns;
    $('.rect' + index).remove();
    $('#text' + index).remove();
    $('#currMarker').remove();
};

/*
 * Create the Heatmap Plotter.
 */
var createPlotter = function () {

    if (plot !== null) return;

    // remove old plot
    $('#divTimeseries > svg').remove();

    // Use d3 to create the initial svg with the start states
    plot = d3.select('#divTimeseries').append('svg:svg').attr('xmlns', 'http://www.w3.org/2000/svg');
    createNodeLabelColumn(network.state);

    for (var j = iterationCounter - iterationCounter % maxColumns; j <= iterationCounter; j++)
        createNodeStateColumn(states[j], j);
    skipped = 0;
};

/*
 * Re-create time series plot,
 * reset cursor to position 1 
 */
var resetTimeseries = function () {
    initialIndex = 0;
    iterationCounter = 0;
    timeseriesLabelCounter = 1;
    skipped = 0;
    $('#textIteration').text(timeseriesLabelCounter);
    states = [];
    states.push({});
    $.extend(states[0], network.state);
    plot = null;
    createPlotter();
};

/*
 * Re-create time series plot
 */
var updateTimeseries = function () {
    // update Time series
    plot = null;
    timeseriesLabelCounter = parseInt($('#text0').text());
    console.log(timeseriesLabelCounter);
    if (timeseriesLabelCounter === "NaN")
        timeseriesLabelCounter = 1;
    createPlotter();
};
