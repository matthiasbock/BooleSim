import os
from simulator import TestSimulator
from selenium.webdriver.support.ui import WebDriverWait

class TestImportExport(TestSimulator):
  testFiles = {}
  testFiles['formatSBML'] = 'simpleX0-T-X1.sbml'
  testFiles['formatRBoolNet'] = 'mammal.r'
  testFiles['formatGINML'] = 'boolean_cell_cycle.ginml'
  testFiles['formatPyBooleanNet'] = 'Whi2.boolenet'
  
  def importFile(self, fileType, seed = 'seedTrue'):
    self.driver.find_element_by_id('buttonImportDialog').click()
    self.driver.find_element_by_id('fileNetwork').send_keys(os.path.join(os.getcwd(), \
      'examples', self.testFiles[fileType]))
    self.driver.find_element_by_id(seed).click()
    self.driver.find_element_by_id(fileType).click()
    self.driver.find_element_by_id('buttonImportFile').click()
    WebDriverWait(self.driver, 10).until(lambda x: x.find_element_by_id('graph0'))
    self.checkJSError()
  
  def testIOR(self):
    self.importFile('formatRBoolNet')
    
  def testIOPython(self):
    self.importFile('formatPyBooleanNet')
    
  def testIOGINML(self):
    self.importFile('formatGINML')
  
  def defaultFile(self):
    self.testIOR()
      
  
  def exportFile(self, click):
    self.defaultFile()
    self.driver.find_element_by_id('buttonExportDialog').click()
    for i in click:
      self.driver.find_element_by_id(i).click()
    self.driver.find_element_by_id('buttonExportFile').click()
    
  def testIOExportNetworkSVG(self):
    self.exportFile(['exportNetwork', 'graphSVG'])
    
  def testIOExportNetworkjSBGN(self):
    self.exportFile(['exportNetwork', 'graphjSBGN'])
    
  def testIOExportNetworkSBGN(self):
    self.exportFile(['exportNetwork', 'graphSBGN'])
    
  def testIOExportRBoolNet(self):
    self.exportFile(['exportNetworkRBoolNet'])

  def testIOExportPythonBooleanNet(self):
    self.exportFile(['exportNetworkPyBooleanNet'])
    
