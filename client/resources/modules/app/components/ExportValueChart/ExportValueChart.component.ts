/*
* @Author: aaronpmishkin
* @Date:   2016-07-02 12:20:59
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-08-23 11:54:57
*/

// Import Angular Classes:
import { Component } 										from '@angular/core';
import { OnInit } 											from '@angular/core';


// Import Application Classes:
import { ValueChartService }								from '../../services/ValueChart.service';
import { ValueChartXMLEncoder }								from '../../../utilities/classes/ValueChartXMLEncoder';

// Import Model Classes:
import { ValueChart }										from '../../../../model/ValueChart';


@Component({
	selector: 'ExportValueChart',
	template: `
				<div class="export-value-chart">
					<a class="btn btn-default" id="download-value-chart"
						[class.disabled]="!valueChartService.getValueChart()" 
						download="{{getValueChartName()}}" 
						href="javascript:void(0)" 
						(click)="downloadValueChart()">
						Export ValueChart
					</a>
				</div>
				`
})
export class ExportValueChartComponent implements OnInit {

	private valueChartXMLEncoder: ValueChartXMLEncoder;
	private valueChartStringURL: string;

	private downloadLink: JQuery;

	constructor(private valueChartService: ValueChartService) { }

	ngOnInit() {
		this.valueChartXMLEncoder = new ValueChartXMLEncoder();
		this.downloadLink = $('#download-value-chart');
	}

	getValueChartName(): string {
		var valueChart: ValueChart = this.valueChartService.getValueChart();

		if (valueChart) {
			return valueChart.getId() + '.xml';
		} else {
			return '';
		}

	}

	downloadValueChart(): void {
		var valueChart: ValueChart = this.valueChartService.getValueChart();
		var valueChartObjectURL: string = this.convertValueChartIntoObjectURL(valueChart);

		this.downloadLink.attr('href', valueChartObjectURL);
		this.downloadLink.click();
	}

	convertValueChartIntoObjectURL(valueChart: ValueChart): string {
		if (valueChart === undefined)
			return;

		var valueChartString: string = this.valueChartXMLEncoder.encodeValueChart(valueChart);
		var valueChartBlob: Blob = new Blob([valueChartString], { type: 'text/xml' });

		return URL.createObjectURL(valueChartBlob);
	}


}