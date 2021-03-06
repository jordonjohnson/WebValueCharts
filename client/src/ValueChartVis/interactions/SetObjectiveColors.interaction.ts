/*
* @Author: aaronpmishkin
* @Date:   2016-06-27 17:36:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-31 18:02:32
*/

// Import Angular Classes:
import { Injectable } 															from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';
import { Observable }															from 'rxjs/Observable';
import { Subscription }				 											from 'rxjs/Subscription';
import '../../app/utilities/rxjs-operators';

// Import Application Classes:
import { ChangeDetectionService }												from '../services';
import { LabelDefinitions }														from '../definitions';

// Import Model Classes: 
import { PrimitiveObjective }													from '../../model';

/*
	This class implements the Set Objective Colors ValueChart user interaction. When it is enabled, a user can click on a PrimitiveObjective's
	label in the label area to open a color picker. The color picker can be used to change the selection objective's color, with the ValueChart
	re-rendering to be whatever color is currently selected. 
*/

@Injectable()
export class SetObjectiveColorsInteraction {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	private clicks: Observable<Event>;
	private onClick: Subscription;


	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	constructor(
		private changeDetectionService: ChangeDetectionService) { }


	// ========================================================================================
	// 									Methods
	// ========================================================================================
	
	/*
		@param enableExpanding - Whether or not to enable clicking on a PrimitiveObjective's label in the label area to open a color picker that can be used to
								 change that objective's color.
		@returns {void}
		@description 	Toggles clicking on a PrimitiveObjective's label in the label area to open a color picker that can be used to
						change that objective's color. Only one objective's color can be modified at one time using the color picker.
	*/
	public toggleSettingObjectiveColors(setObjectiveColors: boolean, rootContainer: Element): void {
		// Initialize the observable that is used to detect clicks and notifies handlers.
		let primitiveObjectiveLabels = rootContainer.querySelectorAll('.' + LabelDefinitions.PRIMITIVE_OBJECTIVE_LABEL);
		this.clicks = Observable.fromEvent(primitiveObjectiveLabels, 'click');

		if (this.onClick != undefined)
			this.onClick.unsubscribe();
		
		// Attach the click listener to the labels if setObjectiveColors is true. The body of this listener will be executed whenever a user
		// clicks on one of the labels.
		if (setObjectiveColors) {
			this.onClick = this.clicks.subscribe(this.handleColorChange);
		}
	}

	/*
		@param eventObject - The click event generated by a user click on an objective label.
		@returns {void}
		@description 	Helper function that is the callback for when the onClick observable detects a click event and then pushes it to all observables.
						This is where the actual change in a objective's color is accomplished.
	*/
	private handleColorChange = (eventObject: Event) => {
		var targetObjective: PrimitiveObjective = (<any> d3.select(<any> eventObject.target).datum()).objective;
		var colorPicker = <any> document.querySelector('#primitiveObjective-color-picker');
		
		colorPicker.removeAllListeners();	// Remove any old listeners from the color picker.

		// Attach a listener to the change event that fires when the value of the color picker changes. Note that this event fires
		// whenever the value of the color picker changes, NOT when the user makes a decision and closes the color picker.
		// The body of this listener is where the objective's color is set.
		colorPicker.onchange = (e: Event) => {
			var color: string = (<any>e.target).value;
			targetObjective.setColor(color);
		};

		colorPicker.click(); // Open the color picker by programmatically clicking on it.
	}	
}