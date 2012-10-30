from graph import TestGraph
from selenium.webdriver.support.ui import WebDriverWait

class TestAnalysis(TestGraph):
  def testAnalysisSimulate(self):
    self.driver.find_element_by_id('buttonSimulate').click()
    self.checkJSError()
    
  def testAnalysisAnalyse(self):
    self.driver.find_element_by_id('buttonAnalyse').click()
    WebDriverWait(self.driver, 10).until(lambda x: x.find_element_by_id('graph1'))
    self.checkJSError()
    
  def testAnalysisPlot(self):
    self.testAnalysisSimulate()
    self.driver.find_element_by_css_selector('#tabs > ul > li:nth-child(3)').click()
    self.driver.find_element_by_css_selector('#legendNodes > ul :nth-child(2) > span ').click();

class TestStateTransition(TestAnalysis):
  def setUp(self):
    super(TestStateTransition, self).setUp()
    self.graph = 'transition'
    self.testAnalysisAnalyse()
