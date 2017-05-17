/*
* @Author: aaronpmishkin
* @Date:   2016-06-07 13:30:05
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-16 10:16:46
*/

// Import Angular Classes
import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';

// Import Application Classes:
import { RendererService } 											from '../services/Renderer.service';
import { RenderEventsService }										from '../services/RenderEvents.service';
import { SummaryChartDefinitions }									from '../definitions/SummaryChart.definitions';
import { SortAlternativesInteraction }								from '../interactions/SortAlternatives.interaction';

// Import Model Classes:
import { User }														from '../../../model/User';
import { Alternative }												from '../../../model/Alternative';
import { ScoreFunctionMap }											from '../../../model/ScoreFunctionMap';
import { ScoreFunction }											from '../../../model/ScoreFunction';

import { RowData, CellData, UserScoreData, RendererConfig }			from '../../../types/RendererData.types';
import { RendererUpdate }											from '../../../types/RendererData.types';
import { InteractionConfig, ViewConfig }							from '../../../types/Config.types'


// This class renders a ValueChart's Alternatives into a stacked bar chart that summarizes the utilities users 
// assign to each Alternative based on their objective weights, and the user determined scores assigned to the 
// alternative' consequences. For each user, each Alternative's value for each PrimitiveObjective is rendered 
// into a rectangle whose height (or width depending on the orientation) is proportional to its (weight * userScore). 
// The rectangles for each Alternative are aligned vertically (or horizontally, depending on the ValueChart's orientation) 
// so that they form a stacked bar chart. Different users' stacked bars for the same Alternatives are grouped together into 
// columns (or rows).

@Injectable()
export class SummaryChartRenderer {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	// Constants for use in rendering the summary chart.
	private USER_SCORE_SPACING: number = 10;				// The spacing between user score bars, in pixels.

	public lastRendererUpdate: RendererUpdate;

	// d3 Selections:
	public chart: d3.Selection<any, any, any, any>;						// The 'g' element that contains all the elements making up the summary chart.
	public outline: d3.Selection<any, any, any, any>;						// The 'rect' element that outlines the summary chart.
	public rowsContainer: d3.Selection<any, any, any, any>;				// The 'g' element that contains the rows that make up the summary chart. Each row is composed of the all user scores for one PrimitiveObjective's alternative consequences. (ie. the container of all row containers.)
	public rows: d3.Selection<any, any, any, any>;							// The selection of all 'g' elements s.t. each element is a row container.
	public cells: d3.Selection<any, any, any, any>;						// The selection of all 'g' elements s.t. each element is a cell container.
	public userScores: d3.Selection<any, any, any, any>;					// The selection of all 'rect' elements s.t. each element is one user's score 'bar' for one objective.
	public scoreTotalsContainer: d3.Selection<any, any, any, any>;			// The 'g' element that holds the containers for user score text elements.
	public scoreTotalsSubContainers: d3.Selection<any, any, any, any>;		// The selection of 'g' elements that hold the user score text elements. There is one container per cell.
	public scoreTotals: d3.Selection<any, any, any, any>;					// The selection of 'text' elements used to display the total utility of each alternative for each user.
	public averageLinesContainer: d3.Selection<any, any, any, any>;
	public averageLines: d3.Selection<any, any, any, any>;
	public utilityAxisContainer: d3.Selection<any, any, any, any>;			// The 'g' element that holds the optional utility (y) axis that can be displayed to the left of the summary chart. 
	public alternativeBoxesContainer: d3.Selection<any, any, any, any>;	// The 'g' element that holds the alternative boxes.
	public alternativeBoxes: d3.Selection<any, any, any, any>;				// The selection of transparent 'rect' elements that are placed on top of each alternative in the summary chart. They are used to implement dragging, etc.

	// Misc. Fields:
	private summaryChartScale: any;							// The linear scale used to translate utilities into pixels for determining bar heights and positions. 
	private scoreTotalFontSize: number = 22;

	private numUsers: number;
	private viewOrientation: string;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
						This constructor should NOT be called manually. Angular will automatically handle the construction of this directive when it is used.
	*/
	constructor(
		private renderConfigService: RendererService,
		private renderEventsService: RenderEventsService,
		private sortAlternativesInteraction: SortAlternativesInteraction) { }

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	valueChartChanged = (update: RendererUpdate) => {
		this.lastRendererUpdate = update;

		if (this.chart == undefined) {
			this.createSummaryChart(update);
			this.applyStyles(update);
		}

		if (this.numUsers != update.valueChart.getUsers().length) {
			this.createSummaryChartRows(update, this.rowsContainer, this.alternativeBoxesContainer, this.scoreTotalsContainer);
			this.applyStyles(update);
		}

		this.numUsers = update.valueChart.getUsers().length;

		this.renderSummaryChart(update);

		if (this.viewOrientation != update.viewConfig.viewOrientation) {
			this.applyStyles(update);
			this.interactionsChanged(update.interactionConfig);
			this.viewOrientation = update.viewConfig.viewOrientation;
		}	
	}

	interactionsChanged = (interactionConfig: InteractionConfig) => {
		this.sortAlternativesInteraction.toggleAlternativeSorting(interactionConfig.sortAlternatives, this.alternativeBoxes, this.lastRendererUpdate);
	}

	viewConfigChanged = (viewConfig: ViewConfig) => {
		this.toggleUtilityAxis(viewConfig.displayScales);
		this.toggleScoreTotals(viewConfig.displayTotalScores);
		this.toggleAverageLines(viewConfig.displayAverageScoreLines);

	}


	/*
		@param el - The element that is will be used as the parent of the summary chart.
		@param rows - The data that the summary chart is going to represent. Must be of the type RowData.
		@returns {void}
		@description 	Creates the base containers and all elements for the Alternative Summary Chart of a ValueChart. It should be called when
						creating a summary chart for the first time, but not when updating as the basic framework of the chart never needs to be
						constructed again.
	*/
	createSummaryChart(u: RendererUpdate): void {
		// Indicate that rendering of the summary chart is just starting.
		this.renderEventsService.summaryChartDispatcher.next(0);
		// Create the base container for the chart.
		this.chart = u.el.append('g')
			.classed(SummaryChartDefinitions.CHART, true);

		// Create the rectangle which acts as an outline for the chart.
		this.outline = this.chart.append('g')
			.classed(SummaryChartDefinitions.OUTLINE_CONTAINER, true)
			.append('rect')
			.classed(SummaryChartDefinitions.OUTLINE, true)
			.classed('valuechart-outline', true)

		// Create the container that holds all the row containers.
		this.rowsContainer = this.chart.append('g')
			.classed(SummaryChartDefinitions.ROWS_CONTAINER, true);

		this.averageLinesContainer = this.chart.append('g')
			.classed(SummaryChartDefinitions.AVERAGE_LINES_CONTAINER, true);

		this.scoreTotalsContainer = this.chart.append('g')
			.classed(SummaryChartDefinitions.SCORE_TOTAL_CONTAINER, true);

		this.utilityAxisContainer = this.chart.append('g')
			.classed(SummaryChartDefinitions.UTILITY_AXIS_CONTAINER, true)
			.classed('utility-axis', true);

		this.alternativeBoxesContainer = this.chart.append('g')
			.classed(SummaryChartDefinitions.ALTERNATIVE_BOXES_CONTAINER, true);

		this.createSummaryChartRows(u, this.rowsContainer, this.alternativeBoxesContainer, this.scoreTotalsContainer);
	}


	/*
		@param rowsContainer - The 'g' element that contains/will contain the rows of the summary chart.
		@param boxesContainer - The 'g' element that contains/will contain the alternatives boxes (these are transparent boxes above each alternative used to implement dragging, etc).
		@param scoreTotalsContainer - The 'g' element that contains/will contain the score total subcontainers.
		@param rows - The data to be used when constructing/updating the rows.
		@returns {void}
		@description 	Creates or updates the individual row (and cell) elements that make up the summary chart. There is one row for each primitive objective in the ValueChart, with
						the rows stacked on each other in order to create a stacked bar chart. It can create all of the summary chart rows for the first time, as well as update the summary 
						chart rows by removing and adding rows to conform to the structure of the rows parameter. It also updates summary chart cells through a call to createSummaryChartCells.
						Updating cells should ALWAYS be done through a call to this method, rather than by directly calling createSummaryChartCells.
	*/
	createSummaryChartRows(u: RendererUpdate, rowsContainer: d3.Selection<any, any, any, any>, boxesContainer: d3.Selection<any, any, any, any>, scoreTotalsContainer: d3.Selection<any, any, any, any>): void {
		// Create rows for every new PrimitiveObjective. If the rows are being created for this first time, this is all of the PrimitiveObjectives in the ValueChart.
		var updateRows = rowsContainer.selectAll('.' + SummaryChartDefinitions.ROW)
			.data(u.rowData);

		// Update rows to conform to the data.
		updateRows.exit().remove();				// Remove row containers that do not have a matching data element.
		updateRows.enter().append('g')			// Add row containers for data elements that have no matching container.
			.classed(SummaryChartDefinitions.ROW, true);

		// Note that it is important that we re-select all rows before assigning them to the class field. This is because
		// the selections used for adding and removing elements are only the added or removed elements, not ALL of the elements.
		// This is true for any situation where we need to remove and then add new elements to an existing selection.
		this.rows = rowsContainer.selectAll('.' + SummaryChartDefinitions.ROW);	// Update the row field.

		var alternatives: Alternative[] = u.valueChart.getAlternatives();

		var updateSubContainers = scoreTotalsContainer.selectAll('.' + SummaryChartDefinitions.SCORE_TOTAL_SUBCONTAINER)
			.data((u.rowData[0].cells));

		// Update score total sub-containers to conform to the data.
		updateSubContainers.exit().remove();	// Remove score total sub-containers that do not have a matching alternative.
		updateSubContainers.enter().append('g')	// Add score total sub-containers for alternatives that have no matching sub-container.
			.classed(SummaryChartDefinitions.SCORE_TOTAL_SUBCONTAINER, true);

		this.scoreTotalsSubContainers = scoreTotalsContainer.selectAll('.' + SummaryChartDefinitions.SCORE_TOTAL_SUBCONTAINER); // Update the sub-container field.

		var updateScoreTotals = this.scoreTotalsSubContainers.selectAll('.' + SummaryChartDefinitions.SCORE_TOTAL)
			.data((d: CellData) => { return d.userScores; });

		// Update score totals to conform to the data.
		updateScoreTotals.exit().remove();	// Remove score totals that do not have a matching user.
		updateScoreTotals.enter().append('text') // Add score totals for users that do not have matching score totals.
			.classed(SummaryChartDefinitions.SCORE_TOTAL, true);

		this.scoreTotals = this.scoreTotalsSubContainers.selectAll('.' + SummaryChartDefinitions.SCORE_TOTAL);	// Update the score totals field.

		var updateAverageLines = this.averageLinesContainer.selectAll('.' + SummaryChartDefinitions.AVERAGE_LINE)
			.data((u.rowData[0].cells));

		updateAverageLines.exit().remove();
		updateAverageLines.enter().append('line')
			.classed(SummaryChartDefinitions.AVERAGE_LINE, true);

		this.averageLines = this.averageLinesContainer.selectAll('.' + SummaryChartDefinitions.AVERAGE_LINE);

		var updateAlternativeBoxes = boxesContainer.selectAll('.' + SummaryChartDefinitions.ALTERNATIVE_BOX)
			.data(u.valueChart.getAlternatives());

		// Update alternative boxes to conform to the data.
		updateAlternativeBoxes.exit().remove();				// Remove alternative boxes that do not have a matching alternative.
		updateAlternativeBoxes.enter().append('rect')		// Add alternative boxes for alternatives that do not have a box.
			.classed(SummaryChartDefinitions.ALTERNATIVE_BOX, true)
			.classed(SummaryChartDefinitions.CHART_ALTERNATIVE, true);

		this.alternativeBoxes = boxesContainer.selectAll('.' + SummaryChartDefinitions.ALTERNATIVE_BOX);	// Update alternative boxes field.

		this.createSummaryChartCells(this.rows);
	}

	/*
		@param stackedBarRows - The selection of summary chart rows. Each one is a 'g' element that contains, or will contain, row cells.
		@returns {void}
		@description	Creates or updates the cells that compose each row of the summary chart, and the bars for each user score in that cell (ie, in that intersection of Alternative and PrimitiveObjective).
						It updates existing cells by adding and removing cells to conform to the data assigned to each row. It updates user scores by adding and remove user scores to conform to the number 
						of users assigned to each cell in the row data. Row data cannot be assigned in this method, which is why cells and user scores should ALWAYS be updated by calling createSummaryChartRows,
						 rather than this method.
	*/
	createSummaryChartCells(stackedBarRows: d3.Selection<any, any, any, any>): void {
		// Create cells for each new Alternative in every old or new row. If the cells are being created for this first time, this is done for all Alternatives and all rows.
		var updateCells = stackedBarRows.selectAll('.' + SummaryChartDefinitions.CELL)
			.data((d: RowData) => { return d.cells; });

		updateCells.exit().remove();
		updateCells.enter().append('g')
			.classed(SummaryChartDefinitions.CELL, true)
			.classed(SummaryChartDefinitions.CHART_CELL, true);

		// Save all the cells as a field of the class.
		this.cells = stackedBarRows.selectAll('.' + SummaryChartDefinitions.CELL);

		// Create the bars for each new user score. Note that if this is a Individual ValueChart, there is only on bar in each cell, as there is only one user score for each objective value. 
		var updateUserScores = this.cells.selectAll('.' + SummaryChartDefinitions.USER_SCORE)
			.data((d: CellData, i: number) => { return d.userScores; });

		updateUserScores.exit().remove();
		updateUserScores.enter().append('rect')
			.classed(SummaryChartDefinitions.USER_SCORE, true);

		// Save all the user scores bars as a field of the class.
		this.userScores = this.cells.selectAll('.' + SummaryChartDefinitions.USER_SCORE);
	}

	// TODO <@aaron>: Update this method description.

	/*
		@param width - The width the summary chart should be rendered in. Together with height this parameter determines the size of the summary chart.
		@param height - The height the summary chart should be rendered in. Together with width this parameter determines the size of the summary chart. 
		@param rows - The data that the summary chart is intended to display.
		@param viewConfig - The view configuration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@returns {void}
		@description	Updates the data underlying the summary chart, and then positions and gives widths + heights to the elements created by the createSummaryChart method.
						It should be used to update the summary chart when the data underlying the it (rows) has changed, and the appearance of the summary chart needs to be updated to reflect
						this change. It should NOT be used to initially render the summary chart, or change the view orientation of the summary chart. Use renderSummaryChart for this purpose.

	*/
	renderSummaryChart(u: RendererUpdate): void {
		// Position the chart in the viewport. All the chart's children will inherit this position.
		this.summaryChartScale = d3.scaleLinear()
			.range([0, u.rendererConfig.dimensionTwoSize]);

		// Position the entire chart in the view box.
		this.chart
			.attr('transform', () => {
				if (u.viewConfig.viewOrientation == 'vertical')
					return this.renderConfigService.generateTransformTranslation(u.viewConfig.viewOrientation, u.rendererConfig.dimensionOneSize, 0);
				else
					return this.renderConfigService.generateTransformTranslation(u.viewConfig.viewOrientation, u.rendererConfig.dimensionOneSize, u.rendererConfig.dimensionTwoSize + 10);
			});

		// Give the proper width and height to the chart outline. 
		this.outline
			.attr(u.rendererConfig.dimensionOne, u.rendererConfig.dimensionOneSize)
			.attr(u.rendererConfig.dimensionTwo, u.rendererConfig.dimensionTwoSize);


		var alternatives: Alternative[] = u.valueChart.getAlternatives();

		// Update the data behind the cells.
		this.rows.data(u.rowData);
		var cellsToUpdate = this.cells.data((d: RowData) => { return d.cells; });

		// Update the data behind the user scores.
		var userScoresToUpdate = this.userScores.data((d: CellData, i: number) => { return d.userScores; });

		// Update the data behind the alternative boxes.
		var alternativeBoxesToUpdate = this.alternativeBoxes.data(alternatives);

		// Update the data behind the score totals.
		var scoreSubContainersToUpdate = this.scoreTotalsSubContainers
			.data(() => { return (u.viewConfig.viewOrientation === 'vertical') ? u.rowData[0].cells : u.rowData[u.rowData.length - 1].cells; });

		var scoreTotalsToUpdate = this.scoreTotals
			.data((d: CellData) => { return d.userScores; });

		var averageLinesToUpdate = this.averageLines
			.data(() => { return (u.viewConfig.viewOrientation === 'vertical') ? u.rowData[0].cells : u.rowData[u.rowData.length - 1].cells; });

		this.renderUtilityAxis(u);

		this.toggleUtilityAxis(u.viewConfig.displayScales);

		// Render the summary chart using the selections with updated data.
		this.renderSummaryChartRows(u, alternativeBoxesToUpdate, scoreSubContainersToUpdate, scoreTotalsToUpdate, cellsToUpdate, userScoresToUpdate, averageLinesToUpdate);
	
		// Indicate that the summary chart is finished rendering.
		this.renderEventsService.summaryChartDispatcher.next(1);	
	}

	/*
		@param viewConfig - The viewConfiguration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@returns {void}
		@description	Renders the utility axis of the summary chart. Note that this will not override toggleUtilityAxis, which should
						be used to change the visibility of the utility axis. 

	*/
	renderUtilityAxis(u: RendererUpdate): void {
		// Create the linear scale that the utility axis will represent.
		var uilityScale: d3.ScaleLinear<number, number> = d3.scaleLinear()
			.domain([0, 100])	// The domain of the utility axis is from 0 to 100.


		var utilityAxis: any;

		// Position the utility axis properly depending on the current view orientation. 
		if (u.viewConfig.viewOrientation === 'vertical') {
			uilityScale.range([u.rendererConfig.dimensionTwoSize, 0]);
			utilityAxis = d3.axisLeft(uilityScale);
		} else {
			uilityScale.range([0, u.rendererConfig.dimensionTwoSize]);
			utilityAxis = d3.axisTop(uilityScale);
		}

		this.utilityAxisContainer
			.attr('transform', this.renderConfigService.generateTransformTranslation(u.viewConfig.viewOrientation, -20, 0))
			.call(utilityAxis);
	}

	/*
		@params alternativeBoxes -  The selection of 'rect' elements to be rendered as alternatives boxes on top of each alternative's column.
		@params scoreTotals -  The selection of score totals to be rendered. This should be a selection of 'text' elements.
		@params cells - The selection of 'g' elements that make up the summary chart cells to be rendered. Each cell should have one user score per user.
		@params userScores - The selection of 'rect' user scores to be rendered. There should be one user score per alternative per user.
		@param viewConfig - The viewConfiguration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@returns {void}
		@description	Positions and gives widths + heights to the elements created by createSummaryChartRows. Note that it does not position the row 
						containers because the positions of the scores (and therefore row containers) is not absolute, but depends on the heights of other user scores.
						Note that this method should NOT be called manually. updateSummaryChart or renderSummaryChart should called to re-render objective rows.
	*/
	renderSummaryChartRows(u: RendererUpdate, alternativeBoxes: d3.Selection<any, any, any, any>, scoreSubContainers: d3.Selection<any, any, any, any>, scoreTotals: d3.Selection<any, any, any, any>, cells: d3.Selection<any, any, any, any>, userScores: d3.Selection<any, any, any, any>, averageLines: d3.Selection<any,any,any,any>): void {
		// Give dimensions to the alternative boxes so that each one completely covers on alternative column. Position them exactly above those columns. This is so that they can be the targets of any user clicks on top of those columns.
		alternativeBoxes
			.attr(u.rendererConfig.dimensionOne, (d: CellData, i: number) => { return u.rendererConfig.dimensionOneSize / u.valueChart.getAlternatives().length })
			.attr(u.rendererConfig.dimensionTwo, u.rendererConfig.dimensionTwoSize)
			.attr(u.rendererConfig.coordinateOne, (d: CellData, i: number) => { return this.calculateCellCoordinateOne(d, i, u); })
			.attr(u.rendererConfig.coordinateTwo, 0)
			.attr('alternative', (d: Alternative) => { return d.getId(); })
			.attr('id', (d: Alternative) => { return 'summary-' + d.getId() + '-box' });

		// Position the score total containers.
		scoreSubContainers
			.attr('transform', (d: CellData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(u.viewConfig.viewOrientation, this.calculateCellCoordinateOne(d, i, u), 0);
			})
			.attr('alternative', (d: CellData) => { return d.alternative.getId(); });

		averageLines.attr('transform', (d: CellData, i: number) => {
			return this.renderConfigService.generateTransformTranslation(u.viewConfig.viewOrientation, this.calculateCellCoordinateOne(d, i, u), 0);
		});


		averageLines
			.attr(u.rendererConfig.coordinateOne + '1', 0)
			.attr(u.rendererConfig.coordinateOne + '2', (d: CellData, i: number) => { return this.calculateCellCoordinateOne(d, 1, u); })
			.attr(u.rendererConfig.coordinateTwo + '1', (d: CellData, i: number) => { 
				var weightTotal: number = u.valueChart.getMaximumWeightMap().getWeightTotal();
				var yVal = u.rendererConfig.dimensionTwoScale(weightTotal * this.calculateAverageScore(d));
				return (yVal * ((u.viewConfig.viewOrientation === 'vertical') ? -1 : 1)) + 
					((u.viewConfig.viewOrientation === 'vertical') ? u.rendererConfig.dimensionTwoSize : 0);
			})
			.attr(u.rendererConfig.coordinateTwo + '2', (d: CellData, i: number) => { 
				var weightTotal: number = u.valueChart.getMaximumWeightMap().getWeightTotal();
				var yVal = u.rendererConfig.dimensionTwoScale(weightTotal * this.calculateAverageScore(d));
				return (yVal * ((u.viewConfig.viewOrientation === 'vertical') ? -1 : 1)) + 
					((u.viewConfig.viewOrientation === 'vertical') ? u.rendererConfig.dimensionTwoSize : 0);
			});

		this.renderScoreTotalLabels(u, scoreTotals);
		this.toggleAverageLines(u.viewConfig.displayAverageScoreLines);
		this.toggleScoreTotals(u.viewConfig.displayTotalScores);

		this.renderSummaryChartCells(u, cells, userScores)
	}


	/*
		@param scoreTotals - The selection of text elements being used as score totals. There should be one text element per user per alternative.
		@param viewConfig - The viewConfiguration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@returns {void}
		@description	Positions and assigns the proper text to the summary chart's score labels that are displayed above each user's stacked bar 
						for each alternative. Note that this method should NOT be called manually. updateSummaryChart or renderSummaryChart should 
						called to re-render objective rows.
	*/
	renderScoreTotalLabels(u: RendererUpdate, scoreTotals: d3.Selection<any, any, any, any>): void {

		var verticalOffset: number = 15;
		var horizontalOffset: number = 10;

		scoreTotals
			.text((d: UserScoreData, i: number) => { return Math.round(100 * this.calculateNormalizedTotalScore(d)); })
			.attr(u.rendererConfig.coordinateOne, (d: UserScoreData, i: number) => {
				var userScoreBarSize = this.calculateUserScoreDimensionOne(d, i, u);
				return (userScoreBarSize * i) + (userScoreBarSize / 2) - horizontalOffset;
			})
			.attr(u.rendererConfig.coordinateTwo, (d: UserScoreData, i: number) => {
				var weightTotal: number = u.valueChart.getMaximumWeightMap().getWeightTotal();

				return (u.rendererConfig.dimensionTwoScale(weightTotal * this.calculateNormalizedTotalScore(d)) * 
					((u.viewConfig.viewOrientation === 'vertical') ? -1 : 1)) + 
					((u.viewConfig.viewOrientation === 'vertical') ? (u.rendererConfig.dimensionTwoSize - verticalOffset) : verticalOffset);
			})
			.attr(u.rendererConfig.coordinateTwo + '1', this.calculateNormalizedTotalScore)

		this.highlightBestUserScores(u);
	}

	/*
		@returns {void}
		@description	Changes the color of the score total label for the best alternative for each user to be red. This should 
						be exactly one highlighted score total label per user.
	*/
	highlightBestUserScores(u: RendererUpdate) {
		this.scoreTotals.classed(SummaryChartDefinitions.BEST_SCORE, false);

		var maxUserScores: any = {};
		u.valueChart.getUsers().forEach((user: User) => {
			maxUserScores[user.getUsername()] = -1;
		});

		var bestTotalScoreSelections: any = {};
		this.scoreTotals.nodes().forEach((element: Element) => {
			if (element.nodeName === 'text') {
				let selection: d3.Selection<any, any, any, any> = d3.select(element);
				let userScore: UserScoreData = selection.datum();
				let scoreValue: number = this.calculateNormalizedTotalScore(userScore);
				if (scoreValue > maxUserScores[userScore.user.getUsername()]) {
					maxUserScores[userScore.user.getUsername()] = scoreValue;
					bestTotalScoreSelections[userScore.user.getUsername()] = selection;
				}
			}
		});

		u.valueChart.getUsers().forEach((user: User) => {
			bestTotalScoreSelections[user.getUsername()].classed(SummaryChartDefinitions.BEST_SCORE, true);
		});
	}

	/*
		@param cells - The selection of cells that are to be rendered. Each cell should have one user score per user.
		@param userScores - The selection of userScores that are to be rendered. There should be one user score per alternative per user.
		@param viewConfig - The viewConfiguration object for the ValueChart that is being rendered. Contains the viewOrientation property.
		@returns {void}
		@description	This function positions and gives widths + heights to the elements created by createSummaryChartCells. 
						Note that this method should NOT be called manually. updateSummaryChart or renderSummaryChart should 
						called to re-render objective rows.

	*/
	renderSummaryChartCells(u: RendererUpdate, cells: d3.Selection<any, any, any, any>, userScores: d3.Selection<any, any, any, any>): void {
		// Position each row's cells next to each other in the row.  
		cells
			.attr('transform', (d: CellData, i: number) => {
				return this.renderConfigService.generateTransformTranslation(u.viewConfig.viewOrientation, this.calculateCellCoordinateOne(d, i, u), 0);
			})
			.attr('alternative', (d: CellData) => { return d.alternative.getId(); });

		// Position and give heights and widths to the user scores.
		userScores
			.attr(u.rendererConfig.dimensionOne, (d: UserScoreData, i: number) => { return Math.max(this.calculateUserScoreDimensionOne(d, i, u) - this.USER_SCORE_SPACING, 0); })
			.attr(u.rendererConfig.dimensionTwo, this.calculateUserScoreDimensionTwo)
			.attr(u.rendererConfig.coordinateOne, (d: UserScoreData, i: number) => { return (this.calculateUserScoreDimensionOne(d, i, u) * i) + (this.USER_SCORE_SPACING / 2); })
			.style('fill', (d: UserScoreData, i: number) => {
				if (u.valueChart.isIndividual())
					return d.objective.getColor();
				else
					return d.user.color;
			});

		userScores.attr(u.rendererConfig.coordinateTwo, (d: UserScoreData, i: number) => {
			var userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getName());
			var score: number = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);
			this.summaryChartScale.domain([0, d.user.getWeightMap().getWeightTotal()]);
			if (u.viewConfig.viewOrientation == 'vertical')
				// If the orientation is vertical, then increasing height is to the down (NOT up), and we need to set an offset for this coordinate so that the bars are aligned at the cell bottom, not top.
				return (u.rendererConfig.dimensionTwoSize - this.summaryChartScale(d.offset)) - this.summaryChartScale(score * userObjectiveWeight);
			else
				return this.summaryChartScale(d.offset); // If the orientation is horizontal, then increasing height is to the right, and the only offset is the combined (score * weight) of the previous bars.
		});
	}

	public applyStyles(u: RendererUpdate): void {

		this.scoreTotals
			.style('font-size', this.scoreTotalFontSize)
	}

	/*
		@returns {void}
		@description	Display or hide the utility axis depending on the value of the displayScales attribute on the ValueChartDirective.
	*/
	toggleUtilityAxis(displayScales: boolean): void {
		if (displayScales) {
			this.utilityAxisContainer.style('display', 'block');
		} else {
			this.utilityAxisContainer.style('display', 'none');
		}
	}

	/*
		@returns {void}
		@description	Display or hide the score totals depending on the value of the displayTotalScores attribute on the ValueChartDirective.
	*/
	toggleScoreTotals(displayTotalScores: boolean): void {
		if (displayTotalScores) {
			this.scoreTotalsContainer.style('display', 'block');
		} else {
			this.scoreTotalsContainer.style('display', 'none');
		}
	}

	toggleAverageLines(displayAverageScoreLines: boolean): void {
		if (displayAverageScoreLines) {
			this.averageLinesContainer.style('display', 'block');
		} else {
			this.averageLinesContainer.style('display', 'none');
		} 
	}

	// ========================================================================================
	// 			Anonymous functions that are used often enough to be made class fields
	// ========================================================================================


	// Calculate the CoordinateOne of a cell given the cells data and its index. Cells are all the same width (or height), so we simply divide the length of each row into equal amounts to find their locations.
	calculateCellCoordinateOne = (d: CellData, i: number, u: RendererUpdate) => { return i * (u.rendererConfig.dimensionOneSize / u.valueChart.getAlternatives().length); };
	// The width (or height) should be such that the user scores for one cell fill that cell.
	calculateUserScoreDimensionOne = (d: UserScoreData, i: number, u: RendererUpdate) => { return (u.rendererConfig.dimensionOneSize / u.valueChart.getAlternatives().length) / u.valueChart.getUsers().length };
	// User score heights (or widths) are proportional to the weight of the objective the score is for, times the score (score * weight).
	calculateUserScoreDimensionTwo = (d: UserScoreData, i: number) => {
		var userObjectiveWeight: number = d.user.getWeightMap().getObjectiveWeight(d.objective.getName());
		var score: number = (<User>d.user).getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName()).getScore(d.value);
		this.summaryChartScale.domain([0, d.user.getWeightMap().getWeightTotal()]);

		return this.summaryChartScale(score * userObjectiveWeight);
	};


	// ================================ Methods for Parsing Scores From Data  ====================================

	calculateNormalizedTotalScore = (d: UserScoreData) => {
		var scoreFunction: ScoreFunction = d.user.getScoreFunctionMap().getObjectiveScoreFunction(d.objective.getName());
		var score = scoreFunction.getScore(d.value) * (d.user.getWeightMap().getObjectiveWeight(d.objective.getName()));
		return (score + d.offset) / d.user.getWeightMap().getWeightTotal();
	};

	calculateAverageScore = (d: CellData) => {
		var totalScore: number = 0;
		d.userScores.forEach((userScore: UserScoreData) => {
			totalScore += (this.calculateNormalizedTotalScore(userScore));
		});

		return (totalScore / d.userScores.length);
	}
}