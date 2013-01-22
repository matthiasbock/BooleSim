/**
   * Construct the node label column
   * @param {Object} state Current state of the network.
   * @param {number} w Width of the labels.
   * @param {number} h Height of the labels.
   */
  var createNodesColumn = function(state, w, h) {
    var yPos = 0; 
    
    for (i in state) {
      plot.append('svg:rect').attr('y', function(d) { return yPos; })
          .attr('height', h).attr('width', w)
          .attr('class', 'labels');
      plot.append('svg:text').attr('y', function(d) { return yPos; })
          .attr('dx', 10).attr('dy', 15)
          .text(i)
      yPos += h;
    }  
  }
  
  /**
   * Construct a column with all the states.
   * @param {Object} state Current state of the network.
   */
  var createStateColumn = function(state) {
    var xOffset = parseInt($('rect.labels').attr('width'));
    var h = parseInt($('rect.labels').attr('height'));
    var maxColumns = 40;
    
    // Calculate position of the column
    var yPos = 0, xPos = xOffset + (iterationCounter % maxColumns) * h; 
    var color;
    
    // Replace previous column
    removeStateColumn(iterationCounter - maxColumns);
    
    for (i in state) {
      if (state[i]) color = 'red'; else color = 'green';
      // Add a rectangle of required color
      plot.append('svg:rect').attr('y', function(d) { return yPos; }).attr('x', xPos)
          .attr('height', h).attr('width', h)
          .attr('fill', color)
          .attr('class', iterationCounter);
      yPos += h;
    }  
    // Iteration count text on the bottom
    plot.append('svg:text').attr('y', function(d) { return yPos; }).attr('x', xPos)
          .attr('dx', 5).attr('dy', 15)
          .attr('class', iterationCounter)
          .text(iterationCounter);
    // Add the marker for current iteration
    plot.append('svg:rect').attr('height', yPos).attr('width', 7)
          .attr('id', 'currMarker')
          .attr('x', xPos + h);      
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
   * @param {Array} nodes The list of nodes in the graph.
   * @param {Object} state The state of the network.
   */
  var createPlotter = function(nodes, state) {
    
    // Clear any previous plots
    $('#tabTimeseries').html('');
    var w = 100, h = 20;
    
    // Use d3 to create the initial svg with the start states
    plot = d3.select('#tabTimeseries').append('svg:svg');
    createNodesColumn(state, w, h);
    createStateColumn(state);
  };
