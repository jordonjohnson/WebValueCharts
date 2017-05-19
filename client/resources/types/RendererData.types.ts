/*
* @Author: aaronpmishkin
* @Date:   2016-06-28 15:42:57
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-18 21:41:12
*/

import * as d3								from 'd3';

import { ValueChart }						from '../model/ValueChart';
import { User }								from '../model/User';
import { WeightMap }						from '../model/WeightMap';
import { ScoreFunction }					from '../model/ScoreFunction';
import { Objective }						from '../model/Objective';
import { PrimitiveObjective }				from '../model/PrimitiveObjective';
import { Alternative }						from '../model/Alternative';


import { ViewConfig, InteractionConfig }	from './Config.types';

export interface RowData {
	objective: PrimitiveObjective;
	weightOffset: number;
	cells: CellData[];
}

export interface CellData {
	alternative: Alternative;
	value: (string | number);
	userScores: UserScoreData[];
}

export interface UserScoreData {
	user: User;
	objective: PrimitiveObjective;
	value: (string | number);
	offset?: number
}

export interface LabelData {
	objective: Objective;
	weight: number;
	depth: number;
	depthOfChildren: number;
	subLabelData?: LabelData[]
}

export interface DomainElement {
	element: (string | number);
	scoreFunction: ScoreFunction;
	color: string;
}

export interface ScoreFunctionData {
	elements: DomainElement[];
	scoreFunction: ScoreFunction;
	color: string;
}

export interface ScoreFunctionDataSummary {
	element: (string | number);
	min: number;
	firstQuartile: number;
	median: number;
	thirdQuartile: number;
	max: number;
}

/*
	The update object type for the three main renderer classes: SummaryChartRenderer, ObjectiveChartRenderer and LabelRenderer. It is
	type of message sent to these renderer classes to render to trigger initial construction and rendering, and then re-rendering given changes.
*/
export interface RendererUpdate {
	el: d3.Selection<any, any, any, any>,
	valueChart: ValueChart,
	maximumWeightMap: WeightMap,
	rowData: RowData[],
	labelData: LabelData[],
	width: number,
	height: number,
	viewConfig: ViewConfig,
	interactionConfig: InteractionConfig,
	rendererConfig: RendererConfig,
}

/*
	The configuration object for the three main renderer classes: SummaryChartRenderer, ObjectiveChartRenderer and LabelRenderer. It is generated by the
	rendererConfig class.
*/
export interface RendererConfig {
	viewOrientation: string;
	chartComponentWidth: number;
	chartComponentHeight: number;
	dimensionOne: string;
	dimensionTwo: string;
	coordinateOne: string;
	coordinateTwo: string;
	dimensionOneSize: number;
	dimensionTwoSize: number;
	dimensionTwoScale: any;
}

/*
	The update object type for ScoreFunctionRenderer and its subclasses. It is type of message sent to the ScoreFunctionRenderer class 
	to render Score Function plots.
*/
export interface ScoreFunctionUpdate {
	el: d3.Selection<any, any, any, any>,
	viewOrientation: string;
	interactionConfig: { adjustScoreFunctions: boolean, expandScoreFunctions: boolean };
	width: number;
	height: number;
	scoreFunctions: ScoreFunction[];
	colors: string[];
	objective: PrimitiveObjective;
	styleUpdate: boolean;
	rendererConfig: ScoreFunctionConfig; 
	heightScale: d3.ScaleLinear<any, any>;
	scoreFunctionData: ScoreFunctionData[];
}

/*
	The configuration object type for ScoreFunctionRenderer and its subclasses. It is generated by the RendererScoreFunctionUtility.
*/
export interface ScoreFunctionConfig {
	dimensionOne: string;
	dimensionTwo: string;
	coordinateOne: string;
	coordinateTwo: string;
	dimensionOneSize: number;
	dimensionTwoSize: number;
	domainAxisCoordinateTwo: number;					// The y coordinate of the x-axis in the plot
	utilityAxisMaxCoordinateTwo: number;				// The y coordinate of the top of the y-axis
	utilityAxisCoordinateOne: number;					// The x coordinate of the y-axis in the plot.
	domainAxisMaxCoordinateOne: number; 				// The x coordinate of the rightmost end of the x-axis.
	labelOffset: number;
}
		

