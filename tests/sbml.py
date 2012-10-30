from analysis import TestAnalysis
from graph import TestGraph

class TestSBML(TestAnalysis):  
  def setUp(self):
    super(TestGraph, self).setUp()
  
  def testSBML(self):
    self.importFile('formatSBML')
  
  def testSBMLGuessSeed(self):
    self.importFile('formatSBML', seed='seedGuess')
    
  def testSBMLSimulate(self):
    self.testSBML()
    self.testAnalysisSimulate()
  
  def testSBMLAnalyse(self):
    self.testSBML()
    self.testAnalysisAnalyse()
