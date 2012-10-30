#!/usr/bin/env python

import sys, logging, os
from PyQt4.QtCore import *
from PyQt4.QtGui import *
from PyQt4.QtWebKit import *

class WebPage(QWebPage):
    """
    Makes it possible to use a Python logger to print javascript console messages
    """
    def __init__(self, logger=None, parent=None):
        super(WebPage, self).__init__(parent)
        if not logger:
            logger = logging
        self.logger = logger

    def javaScriptConsoleMessage(self, msg, lineNumber, sourceID):
        self.logger.warning("JsConsole(%s:%d): %s" % (sourceID, lineNumber, msg))

class Window(QWidget):
    def __init__(self):
        super(Window, self).__init__()
        self.view = QWebView(self)
        self.view.setPage(WebPage())

        layout = QVBoxLayout(self)
        layout.setMargin(0)
        layout.addWidget(self.view)
        
        self.resize(1024, 600)

def main():
    app = QApplication(sys.argv)
    window = Window()
    window.show()
    window.view.load(QUrl(sys.argv[1]))
    app.exec_()

if __name__ == "__main__":
    main()
