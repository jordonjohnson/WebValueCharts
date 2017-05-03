/*
* @Author: aaronpmishkin
* @Date:   2017-05-02 14:59:35
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-03 12:25:03
*/

exports.config = {
  	seleniumServerJar: './node_modules/protractor/node_modules/webdriver-manager/selenium/selenium-server-standalone-3.4.0.jar',
  	framework: 'mocha',
  	specs: ['/test/e2e/**/*.js'],
  	getPageTimeout: 20000,
  	mochaOpts: {
	 	reporter: "mochawesome",
	 	timeout: 15000,
	 	reporterOptions: {
			reportDir: 'test/reports',
			reportFilename: 'e2e-report'
		}
	}
};