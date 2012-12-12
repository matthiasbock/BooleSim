
all:
	# possible make targets: update-bui

update-bui:
	if [ ! -e 'lib/biographer' ]; then \
		hg clone https://code.google.com/p/biographer/ lib/biographer; \
	else \
		cd lib/biographer; hg pull; \
	fi
	cd lib/biographer/bui/src/main/javascript; \
	cat 'intro' \
           'settings.js' \
           'core.js' \
           'util.js' \
           'observable.js' \
           'edges/connectingArcs.js' \
           'graph.js' \
           'drawable.js' \
           'node/node.js' \
           'node/labelable.js' \
           'node/edgeHandle.js' \
           'node/association.js' \
           'node/dissociation.js' \
           'node/logicalOperator.js' \
           'node/splineEdgeHandle.js' \
           'node/rectangularNode.js' \
           'node/unitOfInformation.js' \
           'node/macromolecule.js' \
           'node/variableValue.js' \
           'node/complex.js' \
           'node/perturbation.js' \
           'node/phenotype.js' \
           'node/tag.js' \
           'node/compartment.js' \
           'node/nucleicAcidFeature.js' \
           'node/stateVariable.js' \
           'node/simpleChemical.js' \
           'node/unspecifiedEntity.js' \
           'node/emptySet.js' \
           'node/process.js' \
           'edges/attachedDrawable.js' \
           'edges/abstractLine.js' \
           'edges/straightLine.js' \
           'edges/spline.js' \
           'edges/edge.js' \
           'sboMappings.js' \
           'importer.js' \
           'layouter.js' \
           'layout-grid.js' \
           'outro' > ../../../../../biographer-ui.js
