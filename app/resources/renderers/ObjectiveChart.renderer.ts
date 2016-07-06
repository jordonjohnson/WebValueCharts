/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 12:53:30
* @Last Modified by:   aaronpmishkin
<<<<<<< 1b4b6a52117393309f3580747e5ebb8b5883a181
* @Last Modified time: 2016-07-06 10:08:05
=======
* @Last Modified time: 2016-06-13 16:38:20
>>>>>>> Add labels for alternatives to Objective Chart.
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService }											from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { RenderEventsService }										from '../services/RenderEvents.service';

import { ObjectiveChartDefinitions }								from '../services/ObjectiveChartDefinitions.service';

// Model Classes
import { User }														from '../model/User';
import { WeightMap }												from '../model/WeightMap';
import { Alternative }												from '../model/Alternative';
import { ScoreFunctionMap }											from '../model/ScoreFunctionMap';
import { ScoreFunction }											from '../model/ScoreFunction';

import {RowData, CellData, UserScoreData}							from '../model/ChartDataTypes';


// This class renders a ValueChart's Alternatives into a series of bar charts that displays the utility for each Alternative's consequences.
// This utility is based on the weights given to objectives, and the user determined scores assigned to points in the consequence space. 
// Each Alternative's value for each PrimitiveObjective is rendered into a rectangle whose height (or width depending on the orientation) is 
// proportional to its (weight * userScore). The rectangles for each Alternative are aligned vertically (or horizontally) so that they form a of 
// series bar charts, one for each Primitive Objective in the ValueChart.

@Injectable()
export class ObjectiveChartRenderer {

	// d3 selections that are saved to avoid searching the DOM every time they are needed.
	public chart: d3.Selection<any>;							// The 'g' element that contains all the elements making up the objective chart.
	public rowOutlinesContainer: d3.Selection<any>;				// The 'g' element that contains all the row outline elements
	public rowOutlines: d3.Selection<any>;						// The collection of all 'rect' elements that are used outline each row.
	public rowsContainer: d3.Selection<any>;					// The 'g' element that contains the rows that make up the summary chart. Each row is composed of the all user scores for one PrimitiveObjective's alternative consequences. (ie. the container of all row containers.)
	public rows: d3.Selection<any>;								// The collection of 'g' elements s.t. each element is a row container.
	public alternativeLabelsContainer: d3.Selection<any>;		// The 'g' element that contains the alternative labels.
	public alternativeLabels: d3.Selection<any>;				// The collection of all 'text' elements s.t. each element is an alternative label.
	public cells: d3.Selection<any>;							// The collection of all 'g' elements s.t. each element is a cell container.
	public userScores: d3.Selection<any>;						// The collection of all 'rect' elements s.t. each element is one user's score 'bar' for one objective.
	public objectiveDomainLabels: d3.Selection<any>;
	public alternativeBoxesContainer: d3.Selection<any>;
	public alternativeBoxes: d3.Selection<any>;


	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService,
		private renderEventsService: RenderEventsService,
		private defs: ObjectiveChartDefinitions) { }

	// This function creates the base containers and elements for the Alternative Summary Chart of a ValueChart.
	createObjectiveChart(el: d3.Selection<any>, rows: RowData[]): void {
		// Create the root container for the objective chart.
		this.chart = el.append('g')
			.classed(this.defs.CHART, true);
		// Create the container for the row outlines.
		this.rowOutlinesContainer = this.chart.append('g')
			.classed(this.defs.ROW_OUTLINES_CONTAINER, true);
		// Create the container to hold the rows.
		this.rowsContainer = this.chart.append('g')
			.classed(this.defs.ROWS_CONTAINER, true);
		// Create the container to hold the labels for the alternatives
		this.alternativeLabelsContainer = this.chart.append('g')
			.classed(this.defs.ALTERNATIVE_LABELS_CONTAINER, true);

		this.alternativeBoxesContainer = this.chart.append('g')
			.classed(this.defs.ALTERNATIVE_BOXES_CONTAINER, true);


		this.createObjectiveRows(this.rowsContainer, this.rowOutlinesContainer, this.alternativeBoxesContainer, this.alternativeLabelsContainer, rows);
	}

	// This function creates the individual rows that make up the summary chart. Each row is for one primitive objective in the ValueChart
	createObjectiveRows(rowsContainer: d3.Selection<any>, rowOutlinesContainer: d3.Selection<any>, boxesContainer: d3.Selection<any>, alternativeLabelsContainer: d3.Selection<any>, rows: RowData[]): void {
		// Create the row outlines for every new PrimitiveObjective. When the graph is being created for the first time, this is every PrimitiveObjective.
		rowOutlinesContainer.selectAll('.' + this.defs.ROW_OUTLINE)
			.data(rows)
			.enter().append('rect')
				.classed(this.defs.ROW_OUTLINE, true)
				.classed('valuechart-outline', true);

		// Create the containers to hold the new rows.
		rowsContainer.selectAll('.' + this.defs.ROW)
			.data(rows)
			.enter().append('g')
				.classed(this.defs.ROW, true);

		alternativeLabelsContainer.selectAll('.' + this.defs.ALTERNATIVE_LABEL)
			.data(this.chartDataService.alternatives)
			.enter().append('text')
				.classed(this.defs.ALTERNATIVE_LABEL, true);

		boxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX)
			.data(this.chartDataService.alternatives)
			.enter().append('rect')
				.classed(this.defs.ALTERNATIVE_BOX, true)
				.classed(this.defs.CHART_ALTERNATIVE, true);

		// Select all the row outlines (not just the new ones as is done above), and save them as a class field. The same goes for the next two lines, respectively
		this.rowOutlines = rowOutlinesContainer.selectAll('.' + this.defs.ROW_OUTLINE);
		this.rows = rowsContainer.selectAll('.' + this.defs.ROW);
		this.alternativeBoxes = boxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX);
		this.alternativeLabels = alternativeLabelsContainer.selectAll('.' + this.defs.ALTERNATIVE_LABEL);

		this.createObjectiveCells(this.rows)
	}
	// This function creates the cells that compose each row of the objective chart, and the bars for each user score in that cell (ie, in that intersection of Alternative and PrimitiveObjective)
	createObjectiveCells(objectiveRows: d3.Selection<SVGGElement>): void {
		// Create cells for any new objectives, or for new rows. Once again, if the graph is being create for the first time then this is all rows.
		objectiveRows.selectAll('.' + this.defs.CELL)
			.data((d: RowData) => { return d.cells; })
			.enter().append('g')
				.classed(this.defs.CELL, true)
				.classed(this.defs.CHART_CELL, true);


		this.cells = objectiveRows.selectAll('.' + this.defs.CELL);

		// Create the bars for each new user score. Note that if this is a Individual ValueChart, there is only on bar in each cell, as there is only one user score for each objective value. 
		this.cells.selectAll('.' + this.defs.USER_SCORE)
			.data((d: CellData) => { return d.userScores; })
			.enter().append('rect')
				.classed(this.defs.USER_SCORE, true);

		this.objectiveDomainLabels = this.cells.selectAll('.' + this.defs.DOMAIN_LABEL)
			.data((d: CellData) => { return [d]; })
			.enter().append('text')
				.classed(this.defs.DOMAIN_LABEL, true);

		this.userScores = this.cells.selectAll('.' + this.defs.USER_SCORE);
	}

	updateObjectiveChart(rows: RowData[], viewOrientation: string): void {
		var rowOutlinesToUpdate = this.rowOutlines
			.data(rows);

		var rowsToUpdate = this.rows.data(rows);

		var alternativeLabelsToUpdate = this.alternativeLabels.data(this.chartDataService.alternatives);

		var alternativeBoxesToUpdate: d3.Selection<any> = this.alternativeBoxesContainer.selectAll('.' + this.defs.ALTERNATIVE_BOX)
			.data(this.chartDataService.alternatives);

		var cellsToUpdate = rowsToUpdate.selectAll('.' + this.defs.CELL)
			.data((d: RowData) => { return d.cells; })

		var userScoresToUpdate = cellsToUpdate.selectAll('.' + this.defs.USER_SCORE)
			.data((d: CellData, i: number) => { return d.userScores; });


		this.renderObjectiveChartRows(rowOutlinesToUpdate, rowsToUpdate, alternativeLabelsToUpdate, alternativeBoxesToUpdate, cellsToUpdate, userScoresToUpdate, viewOrientation);
	}

	// This function positions and gives widths + heights to the elements created by the createObjectiveChart method.
	renderObjectiveChart(viewOrientation: string): void {
		this.chart
			.attr('transform', () => {
				if (viewOrientation == 'vertical')
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.renderConfigService.dimensionOneSize, this.renderConfigService.dimensionTwoSize + 10);
				else
					return this.renderConfigService.generateTransformTranslation(viewOrientation, this.renderConfigService.dimensionOneSize, 0);	// TODO: Fix this.
			});

		this.renderObjectiveChartRows(this.rowOutlines, this.rows, this.alternativeLabels, this.alternativeBoxes, this.cells, this.userScores, viewOrientation);
	}

	// This function positions and gives widths + heights to the elements created by createObjectiveRows. Unlike in the summary chart we directly position the row
	// containers here because the positions of the scores (and therefore row containers) is are absolute since the bar charts are not stacked. 
	renderObjectiveChartRows(rowOutlines: d3.Selection<any>, rows: d3.Selection<any>, alternativeLabels: d3.Selection<any>, alternativeBoxes: d3.Selection<any>, cells: d3.Selection<any>, userScores: d3.Selection<any>, viewOrientation: string): void {
		rowOutlines
			.attr('transform', (d: RowData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, 0, (this.renderConfigService.dimensionTwoScale(d.weightOffset))); // Position each of the rows based on the combined weights of the previous rows.
			})																																					// this is because the heights of the previous rows are proportional to their weights.
			.attr(this.renderConfigService.dimensionOne, this.renderConfigService.dimensionOneSize)
			.attr(this.renderConfigService.dimensionTwo, (d: RowData) => {
				var objectiveWeight: number = this.chartDataService.maximumWeightMap.getObjectiveWeight(d.objective.getName());
				return this.renderConfigService.dimensionTwoScale(objectiveWeight);																				// Set the height of the row to be proportional to its weight.
			});

		rows
			.attr('transform', (d: RowData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(viewOrientation, 0, (this.renderConfigService.dimensionTwoScale(d.weightOffset)));	// Transform each row container to have the correct y (or x) position based on the combined weights of the previous rows.
			});

		var alternativeLabelCoordOneOffset: number = ((viewOrientation === 'vertical') ? 20 : 40);
		var alternativeLabelCoordTwoOffset: number = 20;

		alternativeLabels
			.text((d: Alternative) => { return d.getName(); })
			.attr(this.renderConfigService.coordinateOne, (d: any, i: number) => { return this.calculateCellCoordinateOne(d, i) + alternativeLabelCoordOneOffset; })
			.attr(this.renderConfigService.coordinateTwo, () => {
				return (viewOrientation === 'vertical') ? this.renderConfigService.dimensionTwoSize + alternativeLabelCoordTwoOffset : alternativeLabelCoordTwoOffset;
			})
			.attr('alternative', (d: Alternative) => { return d.getName(); })
			.style('font-size', '20px');

		alternativeBoxes
			.attr(this.renderConfigService.dimensionOne, (d: CellData, i: number) => { return this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives; })
			.attr(this.renderConfigService.dimensionTwo, this.renderConfigService.dimensionTwoSize)
			.attr(this.renderConfigService.coordinateOne, this.calculateCellCoordinateOne)
			.attr(this.renderConfigService.coordinateTwo, 0)
			.attr('alternative', (d: Alternative) => { return d.getName(); })
			.attr('id', (d: Alternative) => { return 'objective-' + d.getName() + '-box'});


		this.renderObjectiveChartCells(cells, userScores, viewOrientation);
	}

	// This function positions and gives widths + heights to the elements created by createObjectiveCells.
	renderObjectiveChartCells(cells: d3.Selection<any>, userScores: d3.Selection<any>, viewOrientation: string): void {
		cells
			.attr('transform', (d: CellData, i: number) => {
				var coordinateOne: number = this.calculateCellCoordinateOne(d, i);
				return this.renderConfigService.generateTransformTranslation(viewOrientation, coordinateOne, 0);
			})
			.attr('alternative', (d: CellData) => { return d.alternative.getName();});

		var domainLabelCoord: number = 5;

		cells.selectAll('.' + this.defs.DOMAIN_LABEL)
			.data((d: CellData) => { return [d]; })
				.text((d: CellData, i: number) => { return d.value })
				.attr(this.renderConfigService.coordinateOne, (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives) / 3)
				.attr(this.renderConfigService.coordinateTwo, (d: CellData, i: number) => {
					var weight: number = this.chartDataService.maximumWeightMap.getObjectiveWeight(d.userScores[0].objective.getName());
					return (viewOrientation === 'vertical') ? this.renderConfigService.dimensionTwoScale(weight) - domainLabelCoord : domainLabelCoord;
				});

		this.toggleDomainLabels();

		userScores
			.style('fill', (d: UserScoreData, i: number) => { return d.objective.getColor(); })
			.attr(this.renderConfigService.dimensionOne, this.calculateUserScoreDimensionOne)
			.attr(this.renderConfigService.dimensionTwo, this.calculateUserScoreDimensionTwo)
			.attr(this.renderConfigService.coordinateOne, (d: UserScoreData, i: number) => { return this.calculateUserScoreDimensionOne(d, i) * i; });


		if (viewOrientation === 'vertical') {
			userScores
				.attr(this.renderConfigService.coordinateTwo, (d: UserScoreData, i: number) => {
					var objectiveWeight: number = this.chartDataService.maximumWeightMap.getObjectiveWeight(d.objective.getName());
					var score: number = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);
					return this.renderConfigService.dimensionTwoScale(objectiveWeight) - this.renderConfigService.dimensionTwoScale(score * objectiveWeight);
				});
		} else {
			userScores.attr(this.renderConfigService.coordinateTwo, 0);
		}
		// TODO: Remove the any wrapper when typings for d3 are updated.
		(<any> this.renderEventsService.summaryChartDispatcher).call('Rendering-Over');
	}

	toggleDomainLabels(): void {
		if (this.renderConfigService.viewConfiguration.displayDomainValues) {
			this.objectiveDomainLabels.style('display', 'block');
		} else {
			this.objectiveDomainLabels.style('display', 'none');
		}
	}

	// Anonymous functions that are used often enough to be made class fields:

	// Calculate the CoordinateOne of a cell given the cells data and its index. Cells are all the same width (or height), so we simply divide the length of each row into equal amounts to find their locations.
	calculateCellCoordinateOne = (d: CellData, i: number) => { return i * (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives); }; 
	// Calculate the CoordinateOne of a userScore given the userScore object and its index. userScores are just further subdivisions of cells based on the number of userScores in each cell.
	calculateUserScoreDimensionOne = (d: UserScoreData, i: number) => { return (this.renderConfigService.dimensionOneSize / this.chartDataService.numAlternatives) / this.chartDataService.numUsers; };
	// User score heights (or widths) are proportional to the weight of the objective the score is for, times the score (score * weight).
	calculateUserScoreDimensionTwo = (d: UserScoreData, i: number) => {
		var objectiveWeight: number = this.chartDataService.maximumWeightMap.getObjectiveWeight(d.objective.getName());
		var score: number = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);
		return this.renderConfigService.dimensionTwoScale(score * objectiveWeight);
	};
}

