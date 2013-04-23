var loadRulesText = function() {
  var text = '';
  $('#textRules').val('');
  for (i in network.rules) {
    text += i + ' = ' + network.rules[i] + '\n';
  }
  $('#textRules').val(text);
}

var reloadUpdateRules = function() {
  var jsbgn = new jSBGN();
  jsbgn.importBooleanNetwork($('#textRules').val(), '=', true);
  
  var added = jsbgn.nodes.filter(function(i) {return !network.rules.hasOwnProperty(i.id);});
  var removed = network.nodes.filter(function(i) {return !jsbgn.rules.hasOwnProperty(i.id);});
  
  for (i in added) {
    var id = added[i].id;
    network.state[id] = controls.getInitialSeed();
    for (j = 0; j <= iterationCounter; j++)
      states[j][id] = network.state[id];
    network.freeze[id] = false;
    ruleFunctions[id] = rule2function(jsbgn.rules[id]);
  }  
  
  for (i in removed) {
    var id = removed[i].id;
    delete network.state[id];
    delete network.freeze[id];
    delete ruleFunctions[id];
  }  
  
  // time consuming, could be reduced
  controls.importNetwork(jsbgn, '#tabNetwork');
  updateAllGraphNodes(network.state, networkGraph);
  
  network.rules = jsbgn.rules;
  network.nodes = jsbgn.nodes;
  network.edges = jsbgn.edges;
  network.left = jsbgn.left;
  network.right = jsbgn.right;
    
  updateTimeseries();
  //~ identifyIONodes(network.left, network.right);
  //~ highlightIONodes();
  //~ createSteadyStates();
}
