from selenium import webdriver
import unittest, os
from time import sleep

class TestSimulator(unittest.TestCase):
  no_error = True
  
  def checkJSError(self):
    if self.no_error:
      sleep(1)
      JSError = self.driver.find_element_by_tag_name('body').get_attribute('JSError')
      if JSError:
        self.no_error = False
        self.assertIsNone(JSError)

  def setUp(self):
    url = 'http://127.0.0.1:8000/biographer'
    self.driver = webdriver.Chrome()
    self.driver.get(url)
    self.checkJSError()
  
  def tearDown(self):
    self.checkJSError()
    try:
      os.remove('chromedriver.log')
    except:
      pass
    self.driver.quit()
  
  def testUI(self):
    pass
    
    
