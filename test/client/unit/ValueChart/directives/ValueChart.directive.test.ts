/*
* @Author: aaronpmishkin
* @Date:   2017-05-28 15:25:42
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-28 23:31:12
*/

// Import Testing Resources:
import { Component }									from '@angular/core';
import { ComponentFixture, TestBed }					from '@angular/core/testing';
import { By }              								from '@angular/platform-browser';
import { DebugElement }    								from '@angular/core';
import { ElementRef }									from '@angular/core';

import { expect }										from 'chai';
import * as sinon										from 'sinon';

// Import Libraries:
import  * as d3											from 'd3';
import * as _											from 'lodash';

// Import Test Utilities: 
import { HotelChartData }								from '../../../../testData/HotelChartData';
import { randomizeUserWeights, randomizeAllUserScoreFunctions }	from '../../../../utilities/Testing.utilities';

// Import Application Classes:
import { ValueChartDirective }							from '../../../../../client/resources/modules/ValueChart/directives/ValueChart.directive';

// Services:
import { RenderEventsService }							from '../../../../../client/resources/modules/ValueChart/services/RenderEvents.service';
import { RendererService }								from '../../../../../client/resources/modules/ValueChart/services/Renderer.service';
import { ChartUndoRedoService }							from '../../../../../client/resources/modules/ValueChart/services/ChartUndoRedo.service';
import { ChangeDetectionService }						from '../../../../../client/resources/modules/ValueChart/services/ChangeDetection.service';
// Renderers:
import { ObjectiveChartRenderer }						from '../../../../../client/resources/modules/ValueChart/renderers/ObjectiveChart.renderer';
import { SummaryChartRenderer }							from '../../../../../client/resources/modules/ValueChart/renderers/SummaryChart.renderer';
import { LabelRenderer }								from '../../../../../client/resources/modules/ValueChart/renderers/Label.renderer';
// Utilities
import { RendererDataUtility }							from '../../../../../client/resources/modules/ValueChart/utilities/RendererData.utility';
import { RendererConfigUtility }						from '../../../../../client/resources/modules/ValueChart/utilities/RendererConfig.utility';
import { RendererScoreFunctionUtility }					from '../../../../../client/resources/modules/ValueChart/utilities/RendererScoreFunction.utility';
// Interactions
import { ReorderObjectivesInteraction }					from '../../../../../client/resources/modules/ValueChart/interactions/ReorderObjectives.interaction';
import { ResizeWeightsInteraction }						from '../../../../../client/resources/modules/ValueChart/interactions/ResizeWeights.interaction';
import { SortAlternativesInteraction }					from '../../../../../client/resources/modules/ValueChart/interactions/SortAlternatives.interaction';
import { SetObjectiveColorsInteraction }				from '../../../../../client/resources/modules/ValueChart/interactions/SetObjectiveColors.interaction';
import { ExpandScoreFunctionInteraction }				from '../../../../../client/resources/modules/ValueChart/interactions/ExpandScoreFunction.interaction';

import { WebValueChartsParser }							from '../../../../../client/resources/modules/utilities/classes/WebValueChartsParser';

// Import Model Classes
import { ValueChart }									from '../../../../../client/resources/model/ValueChart';
import { User }											from '../../../../../client/resources/model/User';

// Import Types
import { ViewConfig, InteractionConfig }				from '../../../../../client/resources/types/Config.types';
import { RendererUpdate }								from '../../../../../client/resources/types/RendererData.types';
import { RowData, UserScoreData }						from '../../../../../client/resources/types/RendererData.types';

@Component({
	selector: 'viewer-stub',
	template: `	<ValueChart
					[valueChart]="valueChart"
					[width]="valueChartWidth"
					[height]="valueChartHeight"
					[viewConfig]="viewConfig"
					[interactionConfig]="interactionConfig"
					(undoRedo)="updateUndoRedo($event)"
					(renderEvents)="updateRenderEvents($event)">
				</ValueChart>`
})
class ViewerStub {
	
	public valueChart: ValueChart;
	public valueChartWidth: number;
	public valueChartHeight: number;
	public viewConfig: ViewConfig;
	public interactionConfig: InteractionConfig;

	constructor() { }

	public updateUndoRedo = (eventObject: Event) => {

	}

	public updateRenderEvents = (eventObject: Event) => {

	}
}

class MockElementRef extends ElementRef {}

describe('ValueChartDirective', () => {

	// Viewer Instance:
	var viewerStub: ViewerStub;
	// Directive Instance:
	var valueChartDirective: ValueChartDirective;

	// Utility Instances:
	var rendererDataUtility: RendererDataUtility;

	// Renderer Instances:
	var objectiveChartRenderer: ObjectiveChartRenderer;
	var summaryChartRenderer: SummaryChartRenderer;
	var labelRenderer: LabelRenderer;

	// Interaction Instances:
	var reorderObjectivesInteraction: ReorderObjectivesInteraction;
	var resizeWeightsInteraction: ResizeWeightsInteraction;
	var sortAlternativesInteraction: SortAlternativesInteraction;
	var setObjectiveColorsInteraction: SetObjectiveColorsInteraction;
	var expandScoreFunctionInteraction: ExpandScoreFunctionInteraction;

	var hotelChart: ValueChart;
	var parser: WebValueChartsParser;
	var width: number, height: number, interactionConfig: InteractionConfig, viewConfig: ViewConfig;

	var aaron: User;
	var bob: User;

	var fixture: ComponentFixture<ViewerStub>;

	before(function() {

		parser = new WebValueChartsParser();
		var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
		hotelChart = parser.parseValueChart(valueChartDocument);

		viewConfig = {
			viewOrientation: 'vertical',
			displayScoreFunctions: false,
			displayTotalScores: false,
			displayScales: false,
			displayDomainValues: false,
			displayScoreFunctionValueLabels: false,
			displayAverageScoreLines: false
		};

		interactionConfig = {
			weightResizeType: 'none',
			reorderObjectives: false,
			sortAlternatives: 'none',
			pumpWeights: 'none',
			setObjectiveColors: false,
			adjustScoreFunctions: false
		};

		height = 400;
		width = 400;

		TestBed.configureTestingModule({
			providers: [ 
				ValueChartDirective, 
				{ provide: ElementRef, useClass: MockElementRef },
				// Services:
				ChangeDetectionService,
				RenderEventsService,
				ChartUndoRedoService,
				RendererService,
				// Utilities:
				RendererScoreFunctionUtility,
				RendererDataUtility,
				RendererConfigUtility,
				// Renderers:
				ObjectiveChartRenderer,
				SummaryChartRenderer,
				LabelRenderer,
				// Interactions:
				ReorderObjectivesInteraction,
				ResizeWeightsInteraction,
				SortAlternativesInteraction,
				SetObjectiveColorsInteraction,
				ExpandScoreFunctionInteraction,
			],
			declarations: [ ViewerStub, ValueChartDirective ]
		});

		fixture = TestBed.createComponent(ViewerStub);
		viewerStub = fixture.componentInstance;

		let valueChartDirectiveElement = fixture.debugElement.query(By.directive(ValueChartDirective));
		valueChartDirective = valueChartDirectiveElement.injector.get(ValueChartDirective);

		// Retrieve injected classes from the ValueChartDirective's debug element:
		summaryChartRenderer = valueChartDirectiveElement.injector.get(SummaryChartRenderer);
		objectiveChartRenderer = valueChartDirectiveElement.injector.get(ObjectiveChartRenderer);
		labelRenderer = valueChartDirectiveElement.injector.get(LabelRenderer);

		reorderObjectivesInteraction = valueChartDirectiveElement.injector.get(ReorderObjectivesInteraction)
		resizeWeightsInteraction = valueChartDirectiveElement.injector.get(ResizeWeightsInteraction)
		sortAlternativesInteraction = valueChartDirectiveElement.injector.get(SortAlternativesInteraction)
		setObjectiveColorsInteraction = valueChartDirectiveElement.injector.get(SetObjectiveColorsInteraction)
		expandScoreFunctionInteraction = valueChartDirectiveElement.injector.get(ExpandScoreFunctionInteraction)

		rendererDataUtility = valueChartDirectiveElement.injector.get(RendererDataUtility);

		// Initialize ValueChartDirective spies:

		sinon.spy(valueChartDirective, 'createValueChart');
		sinon.spy(valueChartDirective, 'rendersCompleted');
		sinon.spy(valueChartDirective, 'ngDoCheck');

		// Initialize renderer spies:

		sinon.spy(summaryChartRenderer, 'valueChartChanged');
		sinon.spy(summaryChartRenderer, 'interactionsChanged');
		sinon.spy(summaryChartRenderer, 'viewConfigChanged');

		sinon.spy(objectiveChartRenderer, 'valueChartChanged');
		sinon.spy(objectiveChartRenderer, 'interactionsChanged');
		sinon.spy(objectiveChartRenderer, 'viewConfigChanged');

		sinon.spy(labelRenderer, 'valueChartChanged');
		sinon.spy(labelRenderer, 'interactionsChanged');
		sinon.spy(labelRenderer, 'viewConfigChanged');

		// Pass parameters to the stub component.

		viewerStub.valueChart = hotelChart;
		viewerStub.interactionConfig = interactionConfig;
		viewerStub.viewConfig = viewConfig;
		viewerStub.valueChartWidth = width;
		viewerStub.valueChartHeight = height;
	});

	describe('createValueChart(): void', () => {

		context('when the ValueChartDirective is first initialized', () => {

			before(function() {
				fixture.detectChanges();
				console.log(fixture.isStable());
			});

			it('should call createValueChart exactly once to initialize the ValueChart', () => {
				expect((<sinon.SinonSpy>valueChartDirective.createValueChart).calledOnce).to.be.true;
			});

			it('should push exactly one RendererUpdate to the summary, objective, and label renderers', () => {
				expect((<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).calledOnce).to.be.true;
				expect((<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged).calledOnce).to.be.true;
				expect((<sinon.SinonSpy>labelRenderer.valueChartChanged).calledOnce).to.be.true;
			});


			it('should call the "rendersCompleted" method exactly once and only AFTER the renderers have finished creating the ValueChart', () => {
				expect((<sinon.SinonSpy>valueChartDirective.rendersCompleted).calledAfter(<sinon.SinonSpy>summaryChartRenderer.valueChartChanged));
				expect((<sinon.SinonSpy>valueChartDirective.rendersCompleted).calledAfter(<sinon.SinonSpy>objectiveChartRenderer.valueChartChanged));
				expect((<sinon.SinonSpy>valueChartDirective.rendersCompleted).calledAfter(<sinon.SinonSpy>labelRenderer.valueChartChanged));
			});

			it('should push a viewConfig update to the renderers', () => {
				expect((<sinon.SinonSpy>summaryChartRenderer.viewConfigChanged).called).to.be.true;
				expect((<sinon.SinonSpy>objectiveChartRenderer.viewConfigChanged).called).to.be.true;
				expect((<sinon.SinonSpy>labelRenderer.viewConfigChanged).called).to.be.true;
			});

			it('should push a interactionConfig update to the renderers', () => {
				expect((<sinon.SinonSpy>summaryChartRenderer.interactionsChanged).called).to.be.true;
				expect((<sinon.SinonSpy>objectiveChartRenderer.interactionsChanged).called).to.be.true;
				expect((<sinon.SinonSpy>labelRenderer.interactionsChanged).called).to.be.true;
			});

			it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {
				// TODO: Add logic to check synchronization for Score Function Renderers.

				let u: RendererUpdate = (<sinon.SinonSpy>summaryChartRenderer.valueChartChanged).lastCall.args[0];
				checkCachedRendererUpdates(u);
			});
		});
	});

	describe('ngDoCheck()', () => {

		context('when all of the directive\'s input parameters are held constant (ie. no changes are made to the inputs)', () => {

			before(function() {

			});

			it('should NOT send a RendererUpdate message to the renderers', () => {

			});

			it('should NOT send a message to the renderers to update the view configuration', () => {

			});

			it('should NOT send a message to the renderers to update the interaction configuration', () => {

			});

			it('should still have synchronized cached RendererUpdate fields in the renderer and interaction classes', () => {

			});
		});

		context('when the input ValueChart is modified', () => {

			context('when an existing user\'s weights are changed', () => {
				it('should detect changes to the ValueChart send a RendererUpdate to the renderer classes', () => {

				});

				it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {

				});

				it('should not change the view options or interaction options that are enabled/disabled', () => {

				});
			});

			context('when an existing user\'s score functions are changed', () => {
				it('should detect changes to the ValueChart send a RendererUpdate to the renderer classes', () => {

				});

				it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {

				});

				it('should not change the view options or interaction options that are enabled/disabled', () => {

				});
			});

			context('when a new user is added to the ValueChart', () => {
				it('should detect changes to the ValueChart send a RendererUpdate to the renderer classes', () => {

				});

				it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {

				});

				it('should not change the view options or interaction options that are enabled/disabled', () => {

				});
			});

			context('when a user is deleted from the ValueChart', () => {
				it('should detect changes to the ValueChart send a RendererUpdate to the renderer classes', () => {

				});

				it('should synchronize cached RendererUpdate fields in the renderer and interaction classes with the most recent RendererUpdate', () => {

				});

				it('should not change the view options or interaction options that are enabled/disabled', () => {

				});
			});

		});

		context('when the input ValueChart set to be a different ValueChart', () => {

		});

		context('when the view orientation of the ValueChart is changed', () => {

		});

		context('when the view configuration is changed', () => {

		});

		context('when the interaction configuration is changed', () => {

		});

		context('when the width and/or height of the ValueChart is changed', () => {

		}); 

	});

	var checkCachedRendererUpdates = (u : RendererUpdate) => {

		// They should have the same attributes:
		expect(summaryChartRenderer.lastRendererUpdate).to.deep.equal(u);
		expect(objectiveChartRenderer.lastRendererUpdate).to.deep.equal(u);
		expect(labelRenderer.lastRendererUpdate).to.deep.equal(u);
		expect(reorderObjectivesInteraction.lastRendererUpdate).to.deep.equal(u);
		expect(resizeWeightsInteraction.lastRendererUpdate).to.deep.equal(u);
		expect(sortAlternativesInteraction.lastRendererUpdate).to.deep.equal(u);

		// They should be the same references:
		expect(labelRenderer.lastRendererUpdate).to.equal(u);
		expect(summaryChartRenderer.lastRendererUpdate).to.equal(u);
		expect(objectiveChartRenderer.lastRendererUpdate).to.equal(u);
		expect(reorderObjectivesInteraction.lastRendererUpdate).to.equal(u);
		expect(resizeWeightsInteraction.lastRendererUpdate).to.equal(u);
		expect(sortAlternativesInteraction.lastRendererUpdate).to.equal(u);
	}
	

});







