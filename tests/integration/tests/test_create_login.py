import time
import os
import unittest

MAX_ALLOWED_RETRIES = 3


class TestCreateLogin(unittest.TestCase):
    driver = None
    helper = None

    def test_the_title_is_openmotics(self):
        attempt = 0
        while attempt < MAX_ALLOWED_RETRIES:
            try:
                self.driver.get('https://{0}/'.format(self.helper.testee_ip))
                self.driver.implicitly_wait(self.helper.global_timeout)  # Wait for the landing page to finish rendering

                elem = self.helper.find_element_where("id=login.create", self.driver)
                elem.click()

                token = self.helper.get_new_tester_token()
                self.helper.enter_testee_authorized_mode(token, timeout=None)

                if 'OpenMotics' not in self.driver.title:
                    raise Exception('Title validation failed')

                elem = self.helper.find_element_where('id=create.username', self.driver)
                elem.send_keys('automatedusername')
                elem = self.helper.find_element_where('id=create.password', self.driver)
                elem.send_keys('automatedpassword')
                elem = self.helper.find_element_where('id=create.confirmpassword', self.driver)
                elem.send_keys('automatedpassword')
                elem = self.helper.find_element_where('id=create.create', self.driver)
                elem.click()
                elem = self.helper.find_element_where('id=create.havelogin', self.driver)
                elem.click()
                elem = self.helper.find_element_where('id=login.username', self.driver)
                elem.send_keys('automatedusername')
                elem = self.helper.find_element_where('id=login.password', self.driver)
                elem.send_keys('automatedpassword')
                elem = self.helper.find_element_where('id=login.signin', self.driver)
                elem.click()
                elem = self.helper.find_element_where('id=login.acceptterms', self.driver)
                elem.click()
                elem = self.helper.find_element_where('id=login.signin', self.driver)
                elem.click()

                if 'OpenMotics' not in self.driver.title:
                    raise Exception('Title validation failed')
                break
            except Exception as ex:  # Should be NoSuchElementException, but will retry on any failure
                attempt += 1
                time.sleep(2)

        self.driver.quit()
        self.assertTrue(attempt < MAX_ALLOWED_RETRIES, 'Maximum retries reached.')
