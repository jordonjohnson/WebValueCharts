/*
* @Author: aaronpmishkin
* @Date:   2017-06-02 09:56:50
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:44:56
*/

// Import Testing Resources:
import { Component }									from '@angular/core';
import { ComponentFixture, TestBed }					from '@angular/core/testing';
import { By }              								from '@angular/platform-browser';
import { DebugElement }    								from '@angular/core';

import { expect }										from 'chai';

// Import Libraries:
import  * as d3											from 'd3';
import * as _											from 'lodash';

// Import Test Utilities: 
import { HotelChartData }								from '../../../../testData/HotelChartData';

// Import Application Classes:
import { RendererDataUtility }							from '../../../../../client/src/ValueChartVis';
import { RendererService }								from '../../../../../client/src/ValueChartVis';
import { ChartUndoRedoService }								from '../../../../../client/src/ValueChartVis';
import { SortAlternativesInteraction }					from '../../../../../client/src/ValueChartVis';

import { XmlValueChartParser }							from '../../../../../client/src/app/utilities/XmlValueChart.parser';

// Import Definitions Classes:
import { LabelDefinitions }								from '../../../../../client/src/ValueChartVis';

// Import Model Classes
import { ValueChart }									from '../../../../../client/src/model';
import { Objective }									from '../../../../../client/src/model';
import { Alternative }									from '../../../../../client/src/model';
import { PrimitiveObjective }							from '../../../../../client/src/model';
import { AlternativesRecord }							from '../../../../../client/src/types';

// Import Types
import { ViewConfig, InteractionConfig }				from '../../../../../client/src/types';
import { RendererUpdate }								from '../../../../../client/src/types';
import { ChartOrientation, SortAlternativesType }		from '../../../../../client/src/types';


describe('SortAlternativesInteraction', () => {

	var rendererDataUtility: RendererDataUtility;
	var chartUndoRedoService: ChartUndoRedoService;
	var sortAlternativesInteraction: SortAlternativesInteraction;

	var hotelChart: ValueChart;
	var parser: XmlValueChartParser;
	var u: RendererUpdate;


	beforeEach(function() {
		TestBed.configureTestingModule({
			providers: [ RendererDataUtility, ChartUndoRedoService, RendererService, SortAlternativesInteraction ]
		});

		rendererDataUtility = TestBed.get(RendererDataUtility);
		chartUndoRedoService = TestBed.get(ChartUndoRedoService);
		sortAlternativesInteraction = TestBed.get(SortAlternativesInteraction);


		parser = new XmlValueChartParser();
		var valueChartDocument = new DOMParser().parseFromString(HotelChartData, 'application/xml');
		hotelChart = parser.parseValueChart(valueChartDocument);

		u = {
			el: null,
			valueChart: hotelChart,
			usersToDisplay: hotelChart.getUsers(),
			viewConfig: null,
			interactionConfig: null,
			renderRequired: { value: false },
			height: null,
			width: null,
			x: null,
			y: null,
			maximumWeightMap: null,
			rowData: null,
			labelData: null,
			rendererConfig: null,
			structuralUpdate: null,
			reducedInformation: false
		}

		u = rendererDataUtility.produceMaximumWeightMap(u);
	});

	describe('toggleAlternativeSorting(sortingType: SortAlternativesType, alternativeBoxes: d3.Selection<any, any, any, any>, rendererUpdate: RendererUpdate): void', () => {

		context('when alternative sorting has not yet been initialized', () => {

			it('should call initialize(u: RendererUpdate) to initialize the interaction', () => {
				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.None, d3.selectAll('.null'), u);

				expect(sortAlternativesInteraction.lastRendererUpdate).to.deep.equal(u);
				expect(sortAlternativesInteraction['originalAlternativeOrder']).to.deep.equal(new AlternativesRecord(u.valueChart.getAlternatives()));
			});

			it('should only set the original alternative order once, no matter how many times alternative sorting is toggled', () => {
				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.None, d3.selectAll('.null'), u);

				expect(sortAlternativesInteraction.lastRendererUpdate).to.deep.equal(u);
				expect(sortAlternativesInteraction['originalAlternativeOrder']).to.deep.equal(new AlternativesRecord(u.valueChart.getAlternatives()));

				u.valueChart.setAlternatives(u.valueChart.getAlternatives().reverse());

				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.None, d3.selectAll('.null'), u);
				expect(sortAlternativesInteraction.lastRendererUpdate).to.deep.equal(u);
				expect(sortAlternativesInteraction['originalAlternativeOrder']).to.not.deep.equal(new AlternativesRecord(u.valueChart.getAlternatives()));
			});
		});

		context('when type of sorting is alphabetical', () => {
			it('should immediately sort the alternatives into alphabetical order based on their names', () => {
				let alternatives = u.valueChart.getAlternatives().slice();
				let alphabeticalSort = _.map(alternatives, (value) => { return value.getName(); });
				alphabeticalSort.sort()

				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.Alphabetically, d3.selectAll('.null'), u);

				let alternativeOrder = _.map(u.valueChart.getAlternatives(), (value) => { return value.getName(); });

				expect(alphabeticalSort).to.deep.equal(alternativeOrder);
			});

			it('should create a record of the alternative order and save it in the chartUndoRedoService', () => {
				let alternativeOrder = new AlternativesRecord(u.valueChart.getAlternatives());
				expect(chartUndoRedoService.canUndo()).to.be.false;
				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.Alphabetically, d3.selectAll('.null'), u);
				expect(chartUndoRedoService.canUndo()).to.be.true;
				expect(chartUndoRedoService['undoStateRecords']).to.have.length(1);
				expect(chartUndoRedoService['undoStateRecords'][0]).to.deep.equal(alternativeOrder);
			});
		});

		context('when the type of sorting is manual', () => {
			it('should attach click and drag listeners to the passed in "alternativesBoxes" selection', () => {
				let selection = d3.select(document.createElement('rect'));

				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.Manually, selection, u);
			});
		});

		context('when type of sorting is none', () => {
			it('should remove the click and drag listeners from the passed in "alternativeBoxes" selection', () => {
				let selection = d3.select(document.createElement('rect'));

				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.Manually, selection, u);
				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.None, selection, u);
			});
		});

		context('when the type of sorting is default', () => {
			it('should reset the alternative order to the original, default order', () => {
				let originalOrder = u.valueChart.getAlternatives().slice();
				let alphabeticalSort = _.map(originalOrder, (value) => { return value.getName(); });
				alphabeticalSort.sort()
				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.Alphabetically, d3.selectAll('.null'), u);
				
				let alternativeOrder = _.map(u.valueChart.getAlternatives(), (value) => { return value.getName(); });
				expect(alphabeticalSort).to.deep.equal(alternativeOrder);

				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.Default, null, u);
				expect(u.valueChart.getAlternatives()).to.deep.equal(originalOrder);
			});

			it('should create a record of the alternative order and save it in the chartUndoRedoService if the order changes', () => {
				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.Alphabetically, d3.selectAll('.null'), u);
				let alternativeOrder = new AlternativesRecord(u.valueChart.getAlternatives());

				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.Default, d3.selectAll('.null'), u);
				expect(chartUndoRedoService.canUndo()).to.be.true;
				expect(chartUndoRedoService['undoStateRecords']).to.have.length(2);
				expect(chartUndoRedoService['undoStateRecords'][1]).to.deep.equal(alternativeOrder);
			});

			it('shoudn\'t save the alternative order to the chartUndoRedo service if the order does not change', () => {
				expect(chartUndoRedoService.canUndo()).to.be.false;
				sortAlternativesInteraction.toggleAlternativeSorting(SortAlternativesType.Default, d3.selectAll('.null'), u);
				expect(chartUndoRedoService.canUndo()).to.be.false;
			});
		});
	});


	describe('public toggleSortAlternativesByObjectiveScore(enableSorting: boolean, labelRootContainer: Element, rendererUpdate: RendererUpdate): void', () => {
		it('should enable sorting alternatives by objective scores by attaching click listeners to the label elements', () => {
			expect(sortAlternativesInteraction['clicks']).to.not.exist;

			let rootContainer = document.createElement('g');
			let rectChild = document.createElement('rect');
			rectChild.classList.add(LabelDefinitions.SUBCONTAINER_OUTLINE);
			rootContainer.appendChild(rectChild);
			let textChild = document.createElement('text');
			textChild.classList.add(LabelDefinitions.SUBCONTAINER_TEXT);
			rootContainer.appendChild(textChild);


			sortAlternativesInteraction.toggleSortAlternativesByObjectiveScore(true, rootContainer, u);

			expect(sortAlternativesInteraction['clicks']).to.exist;
			expect(sortAlternativesInteraction['onClick']).to.exist;
		});

		it('should disable sorting alternatives by unsubscribing the "clicks" observable', () => {
			let rootContainer = document.createElement('g');
			let rectChild = document.createElement('rect');
			rectChild.classList.add(LabelDefinitions.SUBCONTAINER_OUTLINE);
			rootContainer.appendChild(rectChild);
			let textChild = document.createElement('text');
			textChild.classList.add(LabelDefinitions.SUBCONTAINER_TEXT);
			rootContainer.appendChild(textChild);

			sortAlternativesInteraction.toggleSortAlternativesByObjectiveScore(true, rootContainer, u);

			expect(sortAlternativesInteraction['clicks']).to.exist;
			expect(sortAlternativesInteraction['onClick']).to.exist;

			expect(sortAlternativesInteraction['onClick'].closed).to.be.false;

			sortAlternativesInteraction.toggleSortAlternativesByObjectiveScore(false, rootContainer, u);

			expect(sortAlternativesInteraction['onClick'].closed).to.be.true;
		});
	});

	describe('private sortAlternativesByObjective(alternatives: Alternative[], objectivesToReorderBy: PrimitiveObjective[]): Alternative[]', () => {

		context('when the there is only a single objective to sort by', () => {

			it('should sort the alternatives by their score under that objective', () => {
				sortAlternativesInteraction.lastRendererUpdate = u;

				sortAlternativesInteraction['sortAlternativesByObjective'](u.valueChart.getAlternatives(), [u.valueChart.getAllPrimitiveObjectives()[0]]);
				let names = _.map(u.valueChart.getAlternatives(), (alternative) => { return alternative.getName() });

				expect(names).to.deep.equal(['Marriott', 'HolidayInn', 'Hyatt', 'Ramada', 'Sheraton', 'BestWestern']);
			});

			it('the alternative sort should be stable', () => {
				sortAlternativesInteraction.lastRendererUpdate = u;

				sortAlternativesInteraction['sortAlternativesByObjective'](u.valueChart.getAlternatives(), [u.valueChart.getAllPrimitiveObjectives()[0]]);
				let names = _.map(u.valueChart.getAlternatives(), (alternative) => { return alternative.getName() });
				expect(names).to.deep.equal(['Marriott', 'HolidayInn', 'Hyatt', 'Ramada', 'Sheraton', 'BestWestern']);
				
				sortAlternativesInteraction['sortAlternativesByObjective'](u.valueChart.getAlternatives(), [u.valueChart.getAllPrimitiveObjectives()[1]]);
				names = _.map(u.valueChart.getAlternatives(), (alternative) => { return alternative.getName() });
				expect(names).to.deep.equal(['HolidayInn', 'Ramada', 'Hyatt', 'BestWestern', 'Sheraton', 'Marriott']);
			});
		});

		context('when there are multiple objectives to sort by', () => {
			it('should sort the alternatives by the sum of their weighted scores under those objectives', () => {
				sortAlternativesInteraction.lastRendererUpdate = u;

				sortAlternativesInteraction['sortAlternativesByObjective'](u.valueChart.getAlternatives(), u.valueChart.getAllPrimitiveObjectives());
				let names = _.map(u.valueChart.getAlternatives(), (alternative) => { return alternative.getName() });

				expect(names).to.deep.equal(['HolidayInn','BestWestern','Ramada','Marriott','Hyatt','Sheraton']);
			});
		});
	});

	after(function() {
		TestBed.resetTestingModule();
	});

});