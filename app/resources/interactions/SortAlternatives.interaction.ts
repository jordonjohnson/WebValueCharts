/*
* @Author: aaronpmishkin
* @Date:   2016-06-24 12:26:30
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-30 15:36:12
*/

import { Injectable } 												from '@angular/core';

// d3
import * as d3 														from 'd3';
import * as $														from 'jquery';

// Application Classes
import { ChartDataService }											from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { ChartUndoRedoService }										from '../services/ChartUndoRedo.service';
import { ChangeDetectionService}									from '../services/ChangeDetection.service';


// Model Classes
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { AbstractObjective }										from '../model/AbstractObjective';
import { Alternative }												from '../model/Alternative';

import {VCRowData, VCCellData, VCLabelData}							from '../model/ChartDataTypes';



@Injectable()
export class SortAlternativesInteraction {

	SORT_BY_OBJECTIVE: string = 'objective';
	SORT_ALPHABETICALLY: string = 'alphabet';
	SORT_MANUALLY: string = 'manual';
	RESET_SORT: string = 'reset';
	SORT_OFF: string = 'none';

	// Sorting Alternatives Manually:
	private cellsToMove: d3.Selection<any>;
	private alternativeBox: d3.Selection<any>;
	private alternativeLabelToMove: d3.Selection<any>;
	private totalScoreLabelToMove: d3.Selection<any>;
	
	private alternativeDimensionOneSize: number;
	private minCoordOne: number;
	private maxCoordOne: number;
	private totalCoordOneChange: number;
	private siblingBoxes: d3.Selection<any>;

	private currentAlternativeIndex: number;
	private newAlternativeIndex: number;
	private jumpPoints: number[];

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService,
		private chartUndoRedoService: ChartUndoRedoService,
		private changeDetectionService: ChangeDetectionService) { }

	toggleAlternativeSorting(sortingType: string): void {
		// Toggle Dragging to sort objectives:
		if (sortingType === this.SORT_BY_OBJECTIVE) {
			this.sortAlternativesByObjective(true);

		} else if (sortingType === this.SORT_ALPHABETICALLY) {
			this.chartUndoRedoService.saveAlternativeOrderRecord(this.chartDataService.alternatives);

			this.chartDataService.reorderAllCells(this.chartDataService.generateCellOrderAlphabetically());
			this.changeDetectionService.alternativeOrderChanged = true;

		} else if (sortingType === this.SORT_MANUALLY) {
			this.sortAlternativesManually(true);

		} else if (sortingType === this.RESET_SORT) {
			this.chartUndoRedoService.saveAlternativeOrderRecord(this.chartDataService.alternatives);

			this.chartDataService.resetCellOrder();
			this.changeDetectionService.alternativeOrderChanged = true;

		} else if (sortingType === this.SORT_OFF) {
			this.sortAlternativesByObjective(false);
			this.sortAlternativesManually(false);
		}

	}

	sortAlternativesByObjective(enableSorting: boolean): void {
		var objectiveLabels: JQuery = $('.label-subcontainer-outline');
		var objectiveText: JQuery = $('.label-subcontainer-text');

		objectiveLabels.off('dblclick');
		objectiveText.off('dblclick');

		var sortByObjective = (eventObject: Event) => {
			this.chartUndoRedoService.saveAlternativeOrderRecord(this.chartDataService.alternatives);

			var objective: Objective = (<any>eventObject.target).__data__.objective;
			var objectivesToReorderBy: PrimitiveObjective[];
			if (objective.objectiveType === 'abstract') {
				objectivesToReorderBy = (<AbstractObjective> objective).getAllPrimitiveSubObjectives();
			} else {
				objectivesToReorderBy = [<PrimitiveObjective> objective];
			}
			var cellIndices: number[] = this.chartDataService.generateCellOrderByObjectiveScore(this.chartDataService.getRowData(), objectivesToReorderBy)
			this.chartDataService.reorderAllCells(cellIndices);
			this.changeDetectionService.alternativeOrderChanged = true;
		}

		if (enableSorting) {
			objectiveLabels.dblclick(sortByObjective);
			objectiveText.dblclick(sortByObjective);
		}
	}

	sortAlternativesManually(enableSorting: boolean): void {
		var alternativeBoxes = d3.selectAll('.alternative-box');

		var dragToSort = d3.drag();

		if (enableSorting) {
			dragToSort
				.on('start', this.startSortAlternatives)
				.on('drag', this.sortAlternatives)
				.on('end', this.endSortAlternatives);
		} 
		
		alternativeBoxes.call(dragToSort);
	}

	startSortAlternatives = (d: Alternative, i: number) => {
		this.chartUndoRedoService.saveAlternativeOrderRecord(this.chartDataService.alternatives);

		this.minCoordOne = 0;
		this.maxCoordOne = this.renderConfigService.dimensionOneSize;
		this.totalCoordOneChange = 0;

		this.alternativeBox = d3.select((<any> d3.event).sourceEvent.target)
		this.alternativeDimensionOneSize = +this.alternativeBox.attr(this.renderConfigService.dimensionOne);

		this.siblingBoxes = d3.selectAll('.alternative-box');

		this.cellsToMove = d3.selectAll('.cell[alternative=' + d.getName() + ']');
		this.alternativeLabelToMove = d3.select('.objective-alternative-label[alternative=' + d.getName() + ']'); 
		this.totalScoreLabelToMove = d3.select('.summary-scoretotal-subcontainer[alternative=' + d.getName() + ']');

		d3.selectAll('.cell').style('opacity', 0.25);
		this.cellsToMove.style('opacity', 1);

		for (var i = 0; i < this.chartDataService.alternatives.length; i++) {
			if (this.chartDataService.alternatives[i].getName() === d.getName()) {
				this.currentAlternativeIndex = i;
				break;
			}
		}

		this.newAlternativeIndex = this.currentAlternativeIndex;
		this.jumpPoints = [0];	

		this.siblingBoxes.nodes().forEach((alternativeBox: Element) => {
			if (alternativeBox !== undefined) {
				let selection: d3.Selection<any> = d3.select(alternativeBox);
				let jumpPoint: number = (+selection.attr(this.renderConfigService.dimensionOne) / 2) + +selection.attr(this.renderConfigService.coordinateOne);
				this.jumpPoints.push(jumpPoint);
			}
		});

		this.jumpPoints.push(this.renderConfigService.dimensionOneSize);
	}

	sortAlternatives = (d: Alternative, i: number) => {
		var deltaCoordOne: number = (<any>d3.event)['d' + this.renderConfigService.coordinateOne];
		var currentCoordOne: number = +this.alternativeBox.attr(this.renderConfigService.coordinateOne);
		
		if (currentCoordOne + deltaCoordOne < 0) {
			deltaCoordOne = 0 - currentCoordOne;
		} else if (currentCoordOne + this.alternativeDimensionOneSize + deltaCoordOne > this.maxCoordOne) {
			deltaCoordOne = this.maxCoordOne - (currentCoordOne + this.alternativeDimensionOneSize);
		}

		this.totalCoordOneChange += deltaCoordOne;

		var dimensionOneOffset: number = (this.totalCoordOneChange > 0) ? this.alternativeDimensionOneSize : 0;
		// Determine which of the two jump points the label is current between, and assign its new position accordingly.
		for (var i = 0; i < this.jumpPoints.length; i++) {
			if (currentCoordOne + dimensionOneOffset > (this.jumpPoints[i])
				&& currentCoordOne + dimensionOneOffset <= (this.jumpPoints[i + 1])) {
				this.newAlternativeIndex = i;
				break;
			}
		}
		// If we were dragging right, then the index is one off and must be decremented.
		if (this.totalCoordOneChange > 0)
			this.newAlternativeIndex--;

		d3.selectAll('.alternative-box[alternative=' + d.getName() + ']').attr(this.renderConfigService.coordinateOne, currentCoordOne + deltaCoordOne);

		this.cellsToMove.nodes().forEach((cell: Element) => {
			var cellSelection: d3.Selection<any> = d3.select(cell);
			var previousTransform: string = cellSelection.attr('transform');
			cellSelection.attr('transform', this.renderConfigService.incrementTransform(previousTransform, deltaCoordOne,0));
		});

		if (this.alternativeLabelToMove)
			this.alternativeLabelToMove.attr(this.renderConfigService.coordinateOne, +this.alternativeLabelToMove.attr(this.renderConfigService.coordinateOne) + deltaCoordOne);

		if (this.totalScoreLabelToMove) 
			this.totalScoreLabelToMove.attr('transform', this.renderConfigService.incrementTransform(this.totalScoreLabelToMove.attr('transform'), deltaCoordOne, 0));

	}

	endSortAlternatives = (d: Alternative, i: number) => {
		var alternatives = this.chartDataService.alternatives;

		if (this.newAlternativeIndex !== this.currentAlternativeIndex) {
			var temp: Alternative = alternatives.splice(this.currentAlternativeIndex, 1)[0];
			alternatives.splice(this.newAlternativeIndex, 0, temp);


			this.chartDataService.getRowData().forEach((row: VCRowData) => {
				var temp: VCCellData = row.cells.splice(this.currentAlternativeIndex, 1)[0];
				row.cells.splice(this.newAlternativeIndex, 0, temp);
			});
		}

		d3.selectAll('.cell').style('opacity', 1);
		this.changeDetectionService.alternativeOrderChanged = true;
	}

}