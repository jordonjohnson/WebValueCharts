/*
* @Author: aaronpmishkin
* @Date:   2016-05-19 11:43:59
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-05-19 14:38:57
*/

// =========================================================================================================================================
// This is the configuration code for SystemJS, the dynamic module loader that Angular 2.0 works with by default. Modules that are added to
// the project need to be registered here so that SystemJS knows their locations, and how to load them.
// =========================================================================================================================================


// This is a self executing anonymous function. The first set of brackets contain the function to be executed, 
// the second set execute it with the given parameters.
(function(global) {

	// This is a map of package names to their locations in our project structure. This is necessary for SystemJS to know how to load packages.
	var map = {
		'app':                        'app', // 'dist',
		'rxjs':                       'node_modules/rxjs',
		'@angular':                   'node_modules/@angular'
	};

	// Defines default extensions and files.
	var packages = {
		'app':                        { main: 'main.js',  defaultExtension: 'js' },
		'rxjs':                       { defaultExtension: 'js' },
	};


	var angularPackages = [
		'@angular/common',
		'@angular/compiler',
		'@angular/core',
		'@angular/http',
		'@angular/platform-browser',
		'@angular/platform-browser-dynamic',
		'@angular/router-deprecated',
		'@angular/testing',
		'@angular/upgrade',
	];

	angularPackages.forEach(function(pkgName) {
		packages[pkgName] = { main: 'index.js', defaultExtension: 'js' };
	});

	var config = {
		map: map,
		packages: packages
	};

	System.config(config);

})(this);