#!/usr/bin/python

#
# Pack all BooleSim files into
# one standalone HTML5 app
#

from os.path import basename

# open main HTML file
main = open('index.html').read()

# pack all stylesheets
styles = ''
includes = ['css/jquery-ui-1.8.22.custom.css', 'css/visualization-html.css', 'css/simulator.css']
for infile in includes:
	comment = """/*
* """+basename(infile)+"""
*/
"""
	styles += comment+open(infile).read()+'\n'

# pack all JavaScripts
scripts = ''
includes = ['include/jquery-1.7.2.min.js', 'include/jquery-ui-1.8.22.custom.min.js', 'settings.js', 'js/controls.js']
for infile in includes:
	comment = """/*
* """+basename(infile)+"""
*/
"""
	scripts += comment+open(infile).read()+'\n'

# embed images as base64-encoded byte-stream
# ...

# combine all in one file
p = main.find('<body')
packed = """<html>

<head>
<title>BooleSim</title>
<style>
"""+styles+"""
</style>
<script type="text/javascript">
"""+scripts+"""
</script>
</head>

"""+main[p:]

# save
open('BooleSim.html5', 'w').write(packed)
