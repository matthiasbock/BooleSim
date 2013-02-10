
/*
 * The event handler for right clicking a node. Opens the Edit rule
 * dialog box.
 * @param {Event} event The event object.
 */
onEditRuleDialogOpen = function (event) {
	event.preventDefault();

	var id = $(this)
		.attr('id');
	$('#textID')
		.text(id);
	$('#textRule')
		.val(network.rules[id]);
	$('#buttonEdit')
		.click(onEditRuleDialogSave);
  $('#dialogEdit')
		.dialog('open');
      
  $('#buttonCancel').click(function() {
      $('#dialogEdit').dialog('close');
    });
};

/*
 * The event handler for clicking the Update rule button of the edit
 * rule dialog box. The corresponding update rule function is updated.
 */
onEditRuleDialogSave = function (event) {
	var rule = $('#textRule')
		.val();
	var id = $('#textID')
		.text();
	
	// Update the rule and it's corresponding function
	network.rules[id] = rule;
	ruleFunctions[id] = rule2function(network.rules[id]);

	$('#buttonEdit')
		.unbind('click', onEditRuleDialogSave);
	$('#dialogEdit')
		.dialog('close');
};
