/*
* @Author: aaronpmishkin
* @Date:   2016-05-24 09:56:10
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-24 09:54:47
*/


// Library Components
import { bootstrap }				from '@angular/platform-browser-dynamic';

// Our components
import { RootComponent }			from './resources/components/root-component/Root.component';
import { APP_ROUTER_PROVIDERS }		from './app.routes';

bootstrap(RootComponent, [
	APP_ROUTER_PROVIDERS
]);