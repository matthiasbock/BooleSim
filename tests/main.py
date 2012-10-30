import unittest
from simulator import TestSimulator
from fileio import TestImportExport
from graph import TestGraph
from analysis import TestAnalysis, TestStateTransition
from sbml import TestSBML


class Main():
  allTests = []
  
  def loadCase(self, prefix, testCase):
    loader = unittest.TestLoader()
    loader.testMethodPrefix = prefix
    tests = loader.loadTestsFromTestCase(testCase)
    self.allTests.append(tests)

  def main(self):
    self.loadCase('testUI', TestSimulator)
    self.loadCase('testIO', TestImportExport)
    self.loadCase('testGraph', TestGraph)
    self.loadCase('testAnalysis', TestAnalysis)
    self.loadCase('testGraph', TestStateTransition)
    self.loadCase('testSBML', TestSBML)
    
    suite = unittest.TestSuite(self.allTests)
    unittest.TextTestRunner(verbosity = 2).run(suite)

if __name__ == "__main__":
  Main().main()
