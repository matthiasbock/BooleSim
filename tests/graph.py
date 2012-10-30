from fileio import TestImportExport
from selenium.webdriver.common.action_chains import ActionChains

class TestGraph(TestImportExport):
  def setUp(self):
    super(TestGraph, self).setUp()
    self.defaultFile()
    self.graph = 'network'
    
  def testGraphZoom(self):
    slider = self.driver.find_element_by_css_selector('.ui-slider-handle')
    action = ActionChains(self.driver).click_and_hold(slider).move_by_offset(20, 0) \
      .release()
    action.perform()
    
  def triggerNodeEvent(self, event):
    if self.graph == 'network':
      i = 0
    else:
      i = 1
    selector = '#graph' + str(i) + ' > g > g:first-child > g:first-child'
    elem = self.driver.find_element_by_css_selector(selector)
    action = ActionChains(self.driver)
    
    if event == 'click':
      action.click(elem)
    elif event == 'right':
      action.context_click(elem)
    else:
      action.move_to_element(elem)
      
    action.perform()
    
  def testGraphNodeClick(self):
    self.triggerNodeEvent('click')
    
  def testGraphEditRule(self):
    if self.graph == 'transition':
      return
    self.triggerNodeEvent('right')
    self.driver.find_element_by_id('buttonEdit').click()
  
  def testGraphInfoBox(self):
    self.triggerNodeEvent('hover')
    self.driver.find_element_by_id('boxInfo')
