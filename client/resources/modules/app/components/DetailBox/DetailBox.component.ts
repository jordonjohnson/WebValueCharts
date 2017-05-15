/*
* @Author: aaronpmishkin
* @Date:   2017-05-15 10:25:17
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-15 12:24:52
*/

// Import Angular Classes:
import { Component, Input }														from '@angular/core';
import { OnInit, DoCheck }														from '@angular/core';

// Import Libraries:
import * as d3 																	from 'd3';
import { Subscription }															from 'rxjs/Subscription';

// Import Application Classes:
import { ChangeDetectionService }												from '../../services/ChangeDetection.service';
import { RenderEventsService }													from '../../services/RenderEvents.service';
import { ValueChartHttpService }												from '../../services/ValueChartHttp.service';
import { HostService }															from '../../services/Host.service';

import { SummaryChartDefinitions }												from '../../services/SummaryChartDefinitions.service';
import { ObjectiveChartDefinitions }											from '../../services/ObjectiveChartDefinitions.service';
import { LabelDefinitions }														from '../../services/LabelDefinitions.service';

// Import Model Classes:
import { ValueChart } 															from '../../../../model/ValueChart';
import { PrimitiveObjective } 													from '../../../../model/PrimitiveObjective';
import { User } 																from '../../../../model/User';
import { Alternative } 															from '../../../../model/Alternative';

// Import Types:
import { ViewConfig, InteractionConfig }										from '../../../../types/Config.types';


@Component({
	selector: 'DetailBox',
	templateUrl: 'client/resources/modules/app/components/DetailBox/DetailBox.template.html',
	providers: []
})
export class DetailBoxComponent implements OnInit, DoCheck {


	// ========================================================================================
	// 									Fields
	// ========================================================================================

	@Input() valueChart: ValueChart;
	@Input() enableManagement: boolean
	@Input() viewConfig: ViewConfig;
	@Input() width: number;
	@Input() height: number;

	private subscription: Subscription;

	private detailBoxAlternativeTab: string;
	private alternativeObjectives: string[];
	private alternativeObjectiveValues: (string | number)[];

	private DETAIL_BOX_WIDTH_OFFSET: number = -50;
	private DETAIL_BOX_HEIGHT_OFFSET: number = -55;
	private DETAIL_BOX_HORIZONTAL_SCALE: number = 1.15;

	private detailBoxCurrentTab: string;
	private DETAIL_BOX_CHART_TAB: string = 'chart';
	private DETAIL_BOX_ALTERNATIVES_TAB: string = 'alternatives';
	private DETAIL_BOX_USERS_TAB: string = 'users';

	// ========================================================================================
	// 									Constructor
	// ========================================================================================


	constructor(
		private changeDetectionService: ChangeDetectionService,
		private renderEventsService: RenderEventsService,
		private valueChartHttpService: ValueChartHttpService,
		private hostService: HostService,
		private summaryChartDefinitions: SummaryChartDefinitions,
		private objectiveChartDefinitions: ObjectiveChartDefinitions,
		private labelDefinitions: LabelDefinitions) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	ngOnInit(): void {
		this.detailBoxCurrentTab = this.DETAIL_BOX_CHART_TAB;
		this.detailBoxAlternativeTab = 'Alternatives';
		this.alternativeObjectives = [];
		this.alternativeObjectiveValues = [];

		// Set Alternative labels to link to the Alternative detail box. 
		this.subscription = this.renderEventsService.objectiveChartDispatcher.subscribe((done: number) => { done ? this.linkAlternativeLabelsToDetailBox() : null });
	}

	ngDoCheck(): void {
		
	}

	// ================================ Detail Box Methods ====================================

	expandAlternative(alternative: Alternative): void {
		this.detailBoxAlternativeTab = alternative.getName();

		this.valueChart.getAllPrimitiveObjectives().forEach((objective: PrimitiveObjective, index: number) => {
			this.alternativeObjectives[index] = objective.getName();
			this.alternativeObjectiveValues[index] = alternative.getObjectiveValue(objective.getName());
		});
	}

	collapseAlternative(): void {
		this.detailBoxAlternativeTab = 'Alternatives';
	}

	setUserColor(user: User, color: string): void {
		user.color = color;
		this.changeDetectionService.colorsHaveChanged = true;
		console.log('setting color');
	}

	/* 	
		@returns {void}
		@description 	Removes a user from the existing ValueChart, and updates the ValueChart's resource on the database.
	*/
	removeUser(userToDelete: User): void {
		this.valueChartHttpService.deleteUser(this.valueChart._id, userToDelete.getUsername())
			.subscribe(username => {
				if (!this.hostService.hostWebSocket) { 	// Handle the deleted user manually.

					var userIndex: number = this.valueChart.getUsers().findIndex((user: User) => {
						return user.getUsername() === userToDelete.getUsername();
					});
					// Delete the user from the ValueChart
					this.valueChart.getUsers().splice(userIndex, 1);
					toastr.warning(userToDelete.getUsername() + ' has left the ValueChart');
				}

				// The Host connection is active, so let it handle notifications about the deleted user.
			},
			err => {
				toastr.error(userToDelete.getUsername() + ' could not be deleted');
			});
	}

	// An anonymous function that links the alternative labels created by the ObjectiveChartRenderer to the Chart Detail box.
	linkAlternativeLabelsToDetailBox = () => {
		this.subscription.unsubscribe();

		d3.selectAll('.' + this.objectiveChartDefinitions.ALTERNATIVE_LABEL)
			.classed('alternative-link', true);

		$('.' + this.objectiveChartDefinitions.ALTERNATIVE_LABEL).click((eventObject: Event) => {
			var selection: d3.Selection<any, any, any, any> = d3.select(<any> eventObject.target);
			this.expandAlternative(selection.datum());
		});
	};


	getValueChartUrl(): string {
		return document.location.origin + '/join/ValueCharts/' + this.valueChart.getName() + '?password=' + this.valueChart.password;
	}
}