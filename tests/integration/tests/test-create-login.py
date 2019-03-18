import time
import os
import simplejson as json
from selenium import webdriver
from tests.integration.helper import Helper

OM_CICD = 'cicd1'
OM_BROWSERSTACK_TOKEN = os.environ['OM_BS_TOKEN']
OM_TESTER_USERNAME = os.environ['OM_TESTEE_USERNAME']
OM_TESTER_PASSWORD = os.environ['OM_TESTEE_PASSWORD']
FE_DESIRED_CAPABILITIES = os.environ['FE_DESIRED_CAPABILITIES']
OM_TESTEE_AUTHORIZED_OUTPUT_ID = 13


def test_the_title_is_openmotics():
    my_helper = Helper(testee_ip='localhost:8088', tester_ip='localhost:8089', global_timeout=10)

    with open('../capabilities/{0}.json'.format(FE_DESIRED_CAPABILITIES)) as f:
        loaded_environment_data = json.load(f)

    desired_cap = loaded_environment_data['desired_capabilities']

    driver = webdriver.Remote(
        command_executor='http://{0}:{1}@hub.browserstack.com:80/wd/hub'.format(OM_CICD, OM_BROWSERSTACK_TOKEN),
        desired_capabilities=desired_cap)

    driver.get("https://{0}/".format(my_helper.testee_ip))
    driver.implicitly_wait(my_helper.global_timeout)  # Wait for page to finish rendering

    elem = my_helper.find_element_where("id=login.create", driver)
    elem.click()

    token = my_helper.get_new_tester_token(OM_TESTER_USERNAME, OM_TESTER_PASSWORD)

    params = {'id': OM_TESTEE_AUTHORIZED_OUTPUT_ID, 'is_on': True}
    my_helper.test_platform_caller(api='set_output', params=params, token=token)
    time.sleep(6.5)

    params = {'id': OM_TESTEE_AUTHORIZED_OUTPUT_ID, 'is_on': False}
    my_helper.test_platform_caller(api='set_output', params=params, token=token)

    assert "OpenMotics" in driver.title
    elem = my_helper.find_element_where('id=create.username', driver)
    elem.send_keys("automatedusername")

    elem = my_helper.find_element_where('id=create.password', driver)
    elem.send_keys("automatedpassword")

    elem = my_helper.find_element_where('id=create.confirmpassword', driver)
    elem.send_keys("automatedpassword")

    elem = my_helper.find_element_where('id=create.create', driver)
    elem.click()

    elem = my_helper.find_element_where('id=create.havelogin', driver)
    elem.click()

    elem = my_helper.find_element_where('id=login.username', driver)
    elem.send_keys("automatedusername")

    elem = my_helper.find_element_where('id=login.password', driver)
    elem.send_keys("automatedpassword")

    elem = my_helper.find_element_where('id=login.signin', driver)
    elem.click()

    elem = my_helper.find_element_where('id=login.acceptterms', driver)
    elem.click()

    elem = my_helper.find_element_where('id=login.signin', driver)
    elem.click()

    driver.implicitly_wait(my_helper.global_timeout)  # Wait for page to finish rendering

    assert "OpenMotics" in driver.title

    # This is where you tell Browser Stack to stop running tests on your behalf.
    # It's important so that you aren't billed after your test finishes.
    driver.quit()
