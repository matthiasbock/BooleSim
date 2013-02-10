var plotH = 20;
var plotW = 100;
var maxColumns = 40;
//~ #don't have a node change it's state, when it's moved
//~ #jSBGN export and import,which includes the node positions and the update rules
//~ #width for node names in the timeseries too narrow
//~ #big iteration number in timeseries graph

/**
   * Construct the node label column
   * @param {Object} state Current state of the network.
   */
  var createNodesColumn = function(state) {
    var yPos = 0; 
    
    for (i in state) {
      plot.append('svg:text').attr('y', function(d) { return yPos; })
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
  }
  
  /**
   * Construct a column with all the states.
   * @param {Object} state Current state of the network.
   * @param {number} count Iteration Counter.
   */
  var createStateColumn = function(state, count) {
    
    // Calculate position of the column
    var yPos = 0, xPos = plotW + (count % maxColumns) * plotH; 
    var color;
    
    // Replace previous column
    removeStateColumn(count - maxColumns);
    
    for (i in state) {
      if (state[i]) color = 'green'; else color = 'red';
      // Add a rectangle of required color
      plot.append('svg:rect').attr('y', function(d) { return yPos; }).attr('x', xPos)
          .attr('height', plotH).attr('width', plotH)
          .attr('fill', color)
          .attr('class', count);
      yPos += plotH;
    }  
    // Iteration count text on the bottom
    plot.append('svg:text').attr('y', function(d) { return yPos; }).attr('x', xPos)
          .attr('dx', 5).attr('dy', 15)
          .attr('class', count)
          .text(count % maxColumns);
    // Add the marker for current iteration
    plot.append('svg:rect').attr('height', yPos).attr('width', 7)
          .attr('id', 'currMarker')
          .attr('x', xPos + plotH);      
  }
  
  /**
   * Delete a column before replacing it.
   * @param {number} index The index of the column to be deleted.
   */
  var removeStateColumn = function(index) {
    $('rect.' + index).remove();
    $('text.' + index).remove();
    d3.selectAll('#currMarker').remove();
  }
  /**
   * Create the Heatmap Plotter. 
   */
  var createPlotter = function() {
    
    if (plot !== null) return;
    
    $('#divTimeseries > svg').remove();
    
    // Use d3 to create the initial svg with the start states
    plot = d3.select('#divTimeseries').append('svg:svg').attr('xmlns','http://www.w3.org/2000/svg');
    createNodesColumn(network.state);
    
    for (j = iterationCounter - iterationCounter % maxColumns; j <= iterationCounter; j++)
      createStateColumn(states[j], j);
    
  };
  
  var resetTimeseries = function() {
    plot = null;
    iterationCounter = 0;
    states = [];
    states.push({});
    $.extend(states[0], network.state);
    $('#tabs').tabs('select', '#tabTimeseries');
    createPlotter();
  }
  
  var addWhitespaceTS = function() {
    iterationCounter += 2;
    createStateColumn(network.state, iterationCounter);
  }
  
