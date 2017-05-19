/*
* @Author: aaronpmishkin
* @Date:   2016-06-21 13:40:52
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-19 14:00:11
*/

// Import Application Classes:
import { Injectable } 														from '@angular/core';

// Import Libraries:
import * as d3 																from 'd3';
import * as _ 																from 'lodash';

// Import Model Classes:
import { ValueChart }														from '../../../model/ValueChart';
import { Alternative }														from '../../../model/Alternative';
import { Objective }														from '../../../model/Objective';
import { PrimitiveObjective }												from '../../../model/PrimitiveObjective';
import { WeightMap }														from '../../../model/WeightMap';
import { ScoreFunction }													from '../../../model/ScoreFunction';

import { Memento }															from '../../../model/Memento';

// Import Type Definitions:
import { AlternativesRecord }												from '../../../types/Record.types';
import { ScoreFunctionRecord }												from '../../../types/Record.types';
import { ObjectivesRecord }													from '../../../types/Record.types';

/*
	This class implements change tracking for implementing undo/redo functionality for individual ValueCharts. ChartUndoRedoService
	does NOT handle the changes caused by undoing or redoing. Instead, it tracks the changes in state caused by these actions, and informs
	any subscribing classes of these state changes through d3 event emitters. It is the responsibility of these subscribing classes
	to properly update the ValueChart's state. Similarly, it is the responsibility of any classes that are going to change the ValueChart's
	state to inform this class of those changes BEFORE they happen.
	
	ChartUndoRedoService utilizes four different stacks to keep track of user driven changes. Two of the stacks, undoChangeTypes and 
	undoStateRecords, are used to track changes in the undo "direction" and the other two, redoChangeTypes and redoStateRecords 
	are used to track changes in the redo "direction". The ___ChangeType stacks record the type of change that the user made, while
	the ___StateRecords stacks provide storage for whatever state preceded the changes. Values popped off the ___ChangeType stacks 
	determine what type of event is emitted by the class when undo/redo actions occur, and values popped off the ___StateRecords
	stacks are passed to subscribing classes as event data.
*/

@Injectable()
export class ChartUndoRedoService {

	// ========================================================================================
	// 									Fields
	// ========================================================================================

	public SCORE_FUNCTION_CHANGE: string = 'scoreFunctionChange';
	public WEIGHT_MAP_CHANGE: string = 'weightMapChange';
	public ALTERNATIVE_ORDER_CHANGE: string = 'alternativeOrderChange';
	public OBJECTIVES_CHANGE: string = 'objectivesChange';

	private undoChangeTypes: string[];
	private redoChangeTypes: string[];

	private undoStateRecords: Memento[];
	private redoStateRecords: Memento[];

	public undoRedoDispatcher: d3.Dispatch<any>;

	// ========================================================================================
	// 									Constructor
	// ========================================================================================

	/*
		@returns {void}
		@description 	Used for Angular's dependency injection ONLY. Unfortunately we are forced to setup the Undo/Redo event emitters here.
						This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
	*/
	constructor() {
		this.undoChangeTypes = [];
		this.redoChangeTypes = [];
		this.undoStateRecords = [];
		this.redoStateRecords = [];

		// Create a custom event dispatcher, with one event for each kind of change.
		this.undoRedoDispatcher = d3.dispatch(
			this.SCORE_FUNCTION_CHANGE,
			this.WEIGHT_MAP_CHANGE,
			this.ALTERNATIVE_ORDER_CHANGE,
			this.OBJECTIVES_CHANGE);
	}

	// ========================================================================================
	// 									Methods
	// ========================================================================================

	public clearRedo(): void {
		this.redoChangeTypes = [];
		this.redoStateRecords = [];
	}

	public clearUndo(): void {
		this.undoChangeTypes = [];
		this.undoStateRecords = [];
	}

	public resetUndoRedo() {
		this.clearUndo();
		this.clearRedo();
	}

	public getNewestRecord(): Memento {
		return this.undoStateRecords[this.undoStateRecords.length - 1];
	}

	public deleteNewestRecord(): void {
		this.undoChangeTypes.pop();
		this.undoStateRecords.pop();
	}

	public saveScoreFunctionRecord(scoreFunction: ScoreFunction, objective: PrimitiveObjective): void {
		var scoreFunctionRecord: ScoreFunctionRecord = new ScoreFunctionRecord(objective.getName(), scoreFunction);
		
		// The change is exactly the same as the last recorded state, so do nothing.
		if (_.isEqual(this.undoStateRecords[this.undoStateRecords.length - 1], scoreFunctionRecord))
			return; 

		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();
		// Record the type of change has been made.
		this.undoChangeTypes.push(this.SCORE_FUNCTION_CHANGE);
		// Save the copy that was just created, along with the name of the objective that it maps to.
		this.undoStateRecords.push(scoreFunctionRecord);
	}

	public saveWeightMapRecord(weightMap: WeightMap): void {
		var weightMapRecord: WeightMap = weightMap.getMemento();

		// The change is exactly the same as the last recorded state, so do nothing.
		if (_.isEqual(this.undoStateRecords[this.undoStateRecords.length - 1], weightMapRecord))
			return; 

		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();
		// Record the type of change that has been made.
		this.undoChangeTypes.push(this.WEIGHT_MAP_CHANGE);
		// Save the copy that was just created.
		this.undoStateRecords.push(weightMapRecord);
	}

	public saveAlternativesRecord(alternatives: Alternative[]): void {
		var alternativesRecord: AlternativesRecord = new AlternativesRecord(alternatives);

		// The change is exactly the same as the last recorded state, so do nothing.
		console.log(this.undoStateRecords, alternativesRecord);

		if (_.isEqual(this.undoStateRecords[this.undoStateRecords.length - 1], alternativesRecord))
			return; 

		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();
		this.undoChangeTypes.push(this.ALTERNATIVE_ORDER_CHANGE);
		this.undoStateRecords.push(alternativesRecord);
	}

	public saveObjectivesRecord(objectives: Objective[]): void {
		var objectivesRecord: ObjectivesRecord = new ObjectivesRecord(objectives);

		// The change is exactly the same as the last recorded state, so do nothing.
		if (_.isEqual(this.undoStateRecords[this.undoStateRecords.length - 1], objectivesRecord))
			return; 

		// A new change as been made, so we should clear the redo stack.
		this.clearRedo();
		this.undoChangeTypes.push(this.OBJECTIVES_CHANGE);
		this.undoStateRecords.push(objectivesRecord);
	}

	public canUndo(): boolean {
		return this.undoChangeTypes.length !== 0;
	}

	public canRedo(): boolean {
		return this.redoChangeTypes.length !== 0;
	}

	public undo(valueChart: ValueChart): void {
		if (!this.canUndo())
			return;

		var changeType: string = this.undoChangeTypes.pop();
		this.redoChangeTypes.push(changeType);
		var stateRecord: Memento = this.undoStateRecords.pop();
		(<any>this)[changeType](stateRecord, valueChart, this.redoStateRecords);
		if ((<any>window).childWindows.scoreFunctionViewer)
			(<any>window).childWindows.scoreFunctionViewer.angularAppRef.tick();
	}

	public redo(valueChart: ValueChart): void {
		if (!this.canRedo())
			return;

		var changeType = this.redoChangeTypes.pop();
		this.undoChangeTypes.push(changeType);
		var stateRecord: Memento = this.redoStateRecords.pop();
		(<any>this)[changeType](stateRecord, valueChart, this.undoStateRecords);
		if ((<any>window).childWindows.scoreFunctionViewer)
			(<any>window).childWindows.scoreFunctionViewer.angularAppRef.tick();
	}

	private scoreFunctionChange(scoreFunctionRecord: ScoreFunctionRecord, valueChart: ValueChart, stateRecords: Memento[]): void {
		if (!valueChart.getUsers()[0])
			return;

		var currentScoreFunction: ScoreFunction = valueChart.getUsers()[0].getScoreFunctionMap().getObjectiveScoreFunction(scoreFunctionRecord.objectiveName);
		stateRecords.push(new ScoreFunctionRecord(scoreFunctionRecord.objectiveName, currentScoreFunction));

		// Dispatch the ScoreFunctionChange event, notifying any listeners and passing the scoreFunctionRecord as a parameter.
		this.undoRedoDispatcher.call(this.SCORE_FUNCTION_CHANGE, {}, scoreFunctionRecord);
	}

	private weightMapChange(weightMapRecord: WeightMap, valueChart: ValueChart, stateRecords: Memento[]): void {
		if (!valueChart.getUsers()[0])
			return;

		var currentWeightMap: WeightMap = valueChart.getUsers()[0].getWeightMap();
		stateRecords.push(currentWeightMap);

		this.undoRedoDispatcher.call(this.WEIGHT_MAP_CHANGE, {}, weightMapRecord);
	}

	private alternativeOrderChange(alternativeOrderRecord: AlternativesRecord, valueChart: ValueChart, stateRecords: Memento[]): void {
		var alternatives: Alternative[] = valueChart.getAlternatives();
		stateRecords.push(new AlternativesRecord(alternatives));

		this.undoRedoDispatcher.call(this.ALTERNATIVE_ORDER_CHANGE, {}, alternativeOrderRecord);
	}

	private objectivesChange(objectivesRecord: ObjectivesRecord, valueChart: ValueChart, stateRecords: Memento[]): void {
		var currentObjectives: Objective[] = valueChart.getRootObjectives();
		stateRecords.push(new ObjectivesRecord(currentObjectives));

		this.undoRedoDispatcher.call(this.OBJECTIVES_CHANGE, {}, objectivesRecord);
	}

}

