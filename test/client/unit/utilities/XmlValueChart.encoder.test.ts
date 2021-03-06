/*
* @Author: aaronpmishkin
* @Date:   2016-07-01 13:52:16
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-08-16 14:48:46
*/
// Import Node Libraries:
import { expect }												from 'chai';

// Import Utilities:
import { XmlValueChartParser }									from '../../../../client/src/app/utilities/XmlValueChart.parser';
import { XmlValueChartEncoder }									from '../../../../client/src/app/utilities/XmlValueChart.encoder';
// Import Model Classes:
import { ValueChart }											from '../../../../client/src/model';
import { Alternative }											from '../../../../client/src/model';
import { User } 												from '../../../../client/src/model';
import { Objective } 											from '../../../../client/src/model';
import { PrimitiveObjective } 									from '../../../../client/src/model';
import { AbstractObjective } 									from '../../../../client/src/model';
import { CategoricalDomain }									from '../../../../client/src/model';
import { ContinuousDomain }										from '../../../../client/src/model';
import { WeightMap } 											from '../../../../client/src/model';
import { ScoreFunctionMap } 									from '../../../../client/src/model';
import { ScoreFunction } 										from '../../../../client/src/model';
import { ContinuousScoreFunction } 								from '../../../../client/src/model';
import { DiscreteScoreFunction } 								from '../../../../client/src/model';

// Import Test Data: 
import { HotelChartData }										from '../../../testData/HotelChartData';

describe('XmlValueCHartEncoder', () => {

	var valueChartParser: XmlValueChartParser;
	var xmlDocParser: DOMParser;
	var xmlSerializer: XMLSerializer;

	var xmlDocument: Document;
	var valueChart: ValueChart;

	var xmlValueChartEncoder: XmlValueChartEncoder;

	before(function() {
		valueChartParser = new XmlValueChartParser();
		xmlDocParser = new DOMParser();
		xmlSerializer = new XMLSerializer();

		xmlDocument = xmlDocParser.parseFromString(HotelChartData, 'application/xml');
		valueChart = valueChartParser.parseValueChart(xmlDocument);

		xmlValueChartEncoder = new XmlValueChartEncoder();
	});

	describe('convertScoreFunctionIntoElement(scoreFunction: ScoreFunction, objectiveName: string, xmlDocument: XMLDocument): Element', () => {
		
		context('when the score function is continuous', () => {
			var rateScoreFunction: ScoreFunction;
			var rateScoreFunctionXMLString: string;
			
			before(function() {
				rateScoreFunction = valueChart.getUsers()[0].getScoreFunctionMap().getObjectiveScoreFunction(valueChart.getObjectiveNameToIdMap()['rate']);
				rateScoreFunctionXMLString = '<ScoreFunction objective="rate" type="continuous"><Score value="1" domain-element="100"/><Score value="0.75" domain-element="125"/><Score value="0.5" domain-element="150"/><Score value="0.25" domain-element="175"/><Score value="0" domain-element="200"/></ScoreFunction>';
			});	

			it('should convert the ScoreFunction into XML that is identical to the source XML when serialized', () => {
				var rateScoreFunctionElement: Element = xmlValueChartEncoder.convertScoreFunctionIntoElement(rateScoreFunction, 'rate', xmlDocument, false);
				expect(xmlSerializer.serializeToString(rateScoreFunctionElement)).to.equal(rateScoreFunctionXMLString);
			});


		});

		context('when the score function is discrete', () => {
			var internetAccessScoreFuction: ScoreFunction;
			var internetAccessScoreFunctionXMLString: string;
			
			before(function() {
				internetAccessScoreFuction = valueChart.getUsers()[0].getScoreFunctionMap().getObjectiveScoreFunction(valueChart.getObjectiveNameToIdMap()['internet-access']);
				internetAccessScoreFunctionXMLString = '<ScoreFunction objective="internet-access" type="discrete"><Score value="0" domain-element="none"/><Score value="1" domain-element="highspeed"/><Score value="0.5" domain-element="lowspeed"/></ScoreFunction>';
			});	

			it('should convert the ScoreFunction into XML that is identical to the source XML when serialized', () => {
				var rateScoreFunctionElement: Element = xmlValueChartEncoder.convertScoreFunctionIntoElement(internetAccessScoreFuction, 'internet-access', xmlDocument, false);
				expect(xmlSerializer.serializeToString(rateScoreFunctionElement)).to.equal(internetAccessScoreFunctionXMLString);
			});	
		});
	});

	describe('convertScoreFunctionMapIntoElement(scoreFunctionMap: ScoreFunctionMap, xmlDocument: XMLDocument): Element', () => {
		var scoreFunctionMap: ScoreFunctionMap;
		var scoreFunctionMapXMLString: string;

		before(function() {
			scoreFunctionMap = valueChart.getUsers()[0].getScoreFunctionMap();
			scoreFunctionMapXMLString = '<ScoreFunctions><ScoreFunction objective="area" type="discrete"><Score value="0" domain-element="nightlife"/><Score value="0.5" domain-element="beach"/><Score value="1" domain-element="airport"/></ScoreFunction><ScoreFunction objective="skytrain-distance" type="continuous"><Score value="1" domain-element="1"/><Score value="0.5" domain-element="3"/><Score value="0.2" domain-element="5"/><Score value="0.1" domain-element="7"/><Score value="0" domain-element="9"/></ScoreFunction><ScoreFunction objective="size" type="continuous"><Score value="1" domain-element="200"/><Score value="0.8" domain-element="237.5"/><Score value="0.6" domain-element="275"/><Score value="0.4" domain-element="312.5"/><Score value="0" domain-element="350"/></ScoreFunction><ScoreFunction objective="internet-access" type="discrete"><Score value="0" domain-element="none"/><Score value="1" domain-element="highspeed"/><Score value="0.5" domain-element="lowspeed"/></ScoreFunction><ScoreFunction objective="rate" type="continuous"><Score value="1" domain-element="100"/><Score value="0.75" domain-element="125"/><Score value="0.5" domain-element="150"/><Score value="0.25" domain-element="175"/><Score value="0" domain-element="200"/></ScoreFunction></ScoreFunctions>';
		});

		it('should convert the ScoreFunctionMap into XML that is identical to the source XML when serialized', () => {
			var scoreFunctionMapElement: Element = xmlValueChartEncoder.convertScoreFunctionMapIntoElement(scoreFunctionMap, xmlDocument, valueChart.getObjectiveIdToNameMap());
			expect(xmlSerializer.serializeToString(scoreFunctionMapElement)).to.equal(scoreFunctionMapXMLString);
		});
	});

	describe('convertWeightMapIntoElement(weightMap: WeightMap, xmlDocument: XMLDocument): Element', () => {
		var weightMap: WeightMap;
		var weightMapXMLString: string;

		before(function() {
			weightMap = valueChart.getUsers()[0].getWeightMap();
			weightMapXMLString = '<Weights><Weight objective="area" value="0.2"/><Weight objective="internet-access" value="0.1"/><Weight objective="rate" value="0.3"/><Weight objective="skytrain-distance" value="0.2"/><Weight objective="size" value="0.2"/></Weights>';
		});

		it('should convert the WeightMap into XML that is identical to the source XML when serialized', () => {
			var weightMapElement: Element = xmlValueChartEncoder.convertWeightMapIntoElement(weightMap, xmlDocument, valueChart.getObjectiveIdToNameMap());
			expect(xmlSerializer.serializeToString(weightMapElement)).to.equal(weightMapXMLString);
		});
	});

	describe('convertUsersIntoElement(user: User, xmlDocument: XMLDocument): Element', () => {
		var user: User;
		var userXMLString: string;

		before(function() {
			user = valueChart.getUsers()[0];
			userXMLString = '<Users><User name="Aaron Mishkin"><Weights><Weight objective="area" value="0.2"/><Weight objective="internet-access" value="0.1"/><Weight objective="rate" value="0.3"/><Weight objective="skytrain-distance" value="0.2"/><Weight objective="size" value="0.2"/></Weights><ScoreFunctions><ScoreFunction objective="area" type="discrete"><Score value="0" domain-element="nightlife"/><Score value="0.5" domain-element="beach"/><Score value="1" domain-element="airport"/></ScoreFunction><ScoreFunction objective="skytrain-distance" type="continuous"><Score value="1" domain-element="1"/><Score value="0.5" domain-element="3"/><Score value="0.2" domain-element="5"/><Score value="0.1" domain-element="7"/><Score value="0" domain-element="9"/></ScoreFunction><ScoreFunction objective="size" type="continuous"><Score value="1" domain-element="200"/><Score value="0.8" domain-element="237.5"/><Score value="0.6" domain-element="275"/><Score value="0.4" domain-element="312.5"/><Score value="0" domain-element="350"/></ScoreFunction><ScoreFunction objective="internet-access" type="discrete"><Score value="0" domain-element="none"/><Score value="1" domain-element="highspeed"/><Score value="0.5" domain-element="lowspeed"/></ScoreFunction><ScoreFunction objective="rate" type="continuous"><Score value="1" domain-element="100"/><Score value="0.75" domain-element="125"/><Score value="0.5" domain-element="150"/><Score value="0.25" domain-element="175"/><Score value="0" domain-element="200"/></ScoreFunction></ScoreFunctions></User></Users>';
		});

		it('should convert the User into XML that is identical to the source XML when serialized', () => {
			var userElement: Element = xmlValueChartEncoder.convertUsersIntoElement([user], xmlDocument, valueChart.getObjectiveIdToNameMap());
			expect(xmlSerializer.serializeToString(userElement)).to.equal(userXMLString);
		});
	});

	describe('convertAlternativeIntoElement(alternative: Alternative, xmlDocument: XMLDocument): Element', () => {
		var alternatives: Alternative[];
		var alternativesXMLString: string;

		before(function() {
			alternatives = valueChart.getAlternatives();
			alternativesXMLString = '<Alternatives><Alternative name="Sheraton"><AlternativeValue objective="area" value="nightlife"/><AlternativeValue objective="internet-access" value="highspeed"/><AlternativeValue objective="rate" value="150"/><AlternativeValue objective="skytrain-distance" value="7"/><AlternativeValue objective="size" value="350"/><Description>Get a good night\'s sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description></Alternative><Alternative name="BestWestern"><AlternativeValue objective="area" value="nightlife"/><AlternativeValue objective="internet-access" value="highspeed"/><AlternativeValue objective="rate" value="100"/><AlternativeValue objective="skytrain-distance" value="2"/><AlternativeValue objective="size" value="200"/><Description>Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.</Description></Alternative><Alternative name="Hyatt"><AlternativeValue objective="area" value="beach"/><AlternativeValue objective="internet-access" value="lowspeed"/><AlternativeValue objective="rate" value="200"/><AlternativeValue objective="skytrain-distance" value="2"/><AlternativeValue objective="size" value="275"/><Description>Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.</Description></Alternative><Alternative name="Marriott"><AlternativeValue objective="area" value="airport"/><AlternativeValue objective="internet-access" value="lowspeed"/><AlternativeValue objective="rate" value="175"/><AlternativeValue objective="skytrain-distance" value="9"/><AlternativeValue objective="size" value="200"/><Description>The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description></Alternative><Alternative name="HolidayInn"><AlternativeValue objective="area" value="airport"/><AlternativeValue objective="internet-access" value="none"/><AlternativeValue objective="rate" value="100"/><AlternativeValue objective="skytrain-distance" value="1"/><AlternativeValue objective="size" value="237.5"/><Description>The 42-inch flat-screen TV offers cable channels. A coffee/tea maker is provided. The private bathroom has a hair dryer. Air conditioning, a desk, and a wake-up call service are among the conveniences offered. This room is Non-Smoking.</Description></Alternative><Alternative name="Ramada"><AlternativeValue objective="area" value="beach"/><AlternativeValue objective="internet-access" value="none"/><AlternativeValue objective="rate" value="125"/><AlternativeValue objective="skytrain-distance" value="1"/><AlternativeValue objective="size" value="312.5"/><Description>1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control</Description></Alternative></Alternatives>';
		});

		it('should convert the Alternative into XML that is identical to the source XML when serialized', () => {
			var alternativesElement: Element = xmlValueChartEncoder.convertAlternativesIntoElement(alternatives, xmlDocument, valueChart.getObjectiveIdToNameMap());
			expect(xmlSerializer.serializeToString(alternativesElement)).to.equal(alternativesXMLString);
		});
	});

	describe('convertDomainIntoElement(domain: Domain, xmlDocument: XMLDocument): Element', () => {
		
		context('when the domain is continuous', () => {

			var rateDomain: ContinuousDomain;
			var rateDomainXMLString: string;
			var rootObjective: AbstractObjective;

			before(function() {
				rootObjective = <AbstractObjective> valueChart.getRootObjectives()[0];
				rateDomain = <ContinuousDomain> (<PrimitiveObjective> rootObjective.getDirectSubObjectives()[2]).getDomain();
				rateDomainXMLString = '<Domain type="continuous" unit="CAD" min="100" max="200"/>';
			});

			it('should convert the domain into XML that is identical to the source XML when serialized', () => {
				var domainElement: Element = xmlValueChartEncoder.convertDomainIntoElement(rateDomain, xmlDocument);
				expect(xmlSerializer.serializeToString(domainElement)).to.equal(rateDomainXMLString);
			});
		});

		context('when the domain is categorical', () => {

			var areaDomain: ContinuousDomain;
			var areaDomainXMLString: string;
			var rootObjective: AbstractObjective;

			before(function() {
				rootObjective = <AbstractObjective> valueChart.getRootObjectives()[0];
				areaDomain = <ContinuousDomain> (<PrimitiveObjective> (<AbstractObjective> rootObjective.getDirectSubObjectives()[0]).getDirectSubObjectives()[0]).getDomain();
				areaDomainXMLString = '<Domain type="categorical" ordered="false"><Category>airport</Category><Category>beach</Category><Category>nightlife</Category></Domain>';
			});

			it('should convert the domain into XML that is identical to the source XML when serialized', () => {
				var domainElement: Element = xmlValueChartEncoder.convertDomainIntoElement(areaDomain, xmlDocument);
				expect(xmlSerializer.serializeToString(domainElement)).to.equal(areaDomainXMLString);
			});
		});
	});

	describe('convertObjectiveIntoElement(objective: Objective, xmlDocument: XMLDocument, isIndividual: boolean): Element', () => {
		
		context('when the objective is a primitive objective', () => {

			var areaObjective: Objective;
			var areaObjectiveXMLString: string;
			var rootObjective: AbstractObjective;

			before(function() {
				rootObjective = <AbstractObjective> valueChart.getRootObjectives()[0];
				areaObjective = (<AbstractObjective> rootObjective.getDirectSubObjectives()[0]).getDirectSubObjectives()[0];
				areaObjectiveXMLString = '<Objective name="area" type="primitive" color="#C0392B"><Description>Description Information Goes Here </Description><Domain type="categorical" ordered="false"><Category>airport</Category><Category>beach</Category><Category>nightlife</Category></Domain></Objective>';
			});

			it('should convert the Objective into XML that is identical to the source XML when serialized', () => {
				var areaObjectiveElement: Element = xmlValueChartEncoder.convertObjectiveIntoElement(areaObjective, xmlDocument, true);
				expect(xmlSerializer.serializeToString(areaObjectiveElement)).to.equal(areaObjectiveXMLString);
			});
		});

		context('when the objective is an abstract objective', () => {
			
			var locationObjective: Objective;
			var locationObjectiveXMLString: string;
			var rootObjective: AbstractObjective;

			before(function() {
				rootObjective = <AbstractObjective> valueChart.getRootObjectives()[0];
				locationObjective = rootObjective.getDirectSubObjectives()[0];
				locationObjectiveXMLString = '<Objective name="location" type="abstract"><Description>Description Information Goes Here </Description><Objective name="area" type="primitive" color="#C0392B"><Description>Description Information Goes Here </Description><Domain type="categorical" ordered="false"><Category>airport</Category><Category>beach</Category><Category>nightlife</Category></Domain></Objective><Objective name="skytrain-distance" type="primitive" color="#7D3C98"><Description>Description Information Goes Here </Description><Domain type="continuous" unit="blocks" min="1" max="9"/></Objective></Objective>';
			});

			it('should convert the Objective into XML that is identical to the source XML when serialized', () => {
				var locationObjectiveElement: Element = xmlValueChartEncoder.convertObjectiveIntoElement(locationObjective, xmlDocument, true);
				expect(xmlSerializer.serializeToString(locationObjectiveElement)).to.equal(locationObjectiveXMLString);
			});
		});
	});

	describe('convertValueChartIntoElement(valueChart: ValueChart, xmlDocument: XMLDocument): Element', () => {
		var valueChartXMLString: string;

		before(function() {
			valueChartXMLString = '<ValueCharts name="Hotel" creator="Aaron Mishkin" version="2.0" type="individual" password="password"><Description>Description Information Goes Here </Description><ChartStructure><Objectives><Objective name="Hotel" type="abstract"><Description>Description Information Goes Here </Description><Objective name="location" type="abstract"><Description>Description Information Goes Here </Description><Objective name="area" type="primitive" color="#C0392B"><Description>Description Information Goes Here </Description><Domain type="categorical" ordered="false"><Category>airport</Category><Category>beach</Category><Category>nightlife</Category></Domain></Objective><Objective name="skytrain-distance" type="primitive" color="#7D3C98"><Description>Description Information Goes Here </Description><Domain type="continuous" unit="blocks" min="1" max="9"/></Objective></Objective><Objective name="room" type="abstract"><Description>Description Information Goes Here </Description><Objective name="size" type="primitive" color="#2980B9"><Description>Description Information Goes Here </Description><Domain type="continuous" unit="sq-ft" min="200" max="350"/></Objective><Objective name="internet-access" type="primitive" color="#27AE60"><Description>Description Information Goes Here </Description><Domain type="categorical" ordered="false"><Category>none</Category><Category>highspeed</Category><Category>lowspeed</Category></Domain></Objective></Objective><Objective name="rate" type="primitive" color="#F1C40F"><Description>Description Information Goes Here </Description><Domain type="continuous" unit="CAD" min="100" max="200"/></Objective></Objective></Objectives><Alternatives><Alternative name="Sheraton"><AlternativeValue objective="area" value="nightlife"/><AlternativeValue objective="internet-access" value="highspeed"/><AlternativeValue objective="rate" value="150"/><AlternativeValue objective="skytrain-distance" value="7"/><AlternativeValue objective="size" value="350"/><Description>Get a good night\'s sleep with premium bedding, a down duvet, and blackout drapes/curtains. The 32-inch TV offers pay movies. Request an in-room massage. A coffee/tea maker is provided. You will have a shower/tub combination, as well as complimentary toiletries and a hair dryer. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description></Alternative><Alternative name="BestWestern"><AlternativeValue objective="area" value="nightlife"/><AlternativeValue objective="internet-access" value="highspeed"/><AlternativeValue objective="rate" value="100"/><AlternativeValue objective="skytrain-distance" value="2"/><AlternativeValue objective="size" value="200"/><Description>Balcony with city views. Complimentary wireless Internet access. 42-inch LCD TV. Pay movies. Coffee/tea maker. Fridge and microwave. Private bathroom. Shower/tub combination. Complimentary toiletries. Hair dryer. Safe. Desk. Complimentary newspapers. This room is Non-Smoking.</Description></Alternative><Alternative name="Hyatt"><AlternativeValue objective="area" value="beach"/><AlternativeValue objective="internet-access" value="lowspeed"/><AlternativeValue objective="rate" value="200"/><AlternativeValue objective="skytrain-distance" value="2"/><AlternativeValue objective="size" value="275"/><Description>Wide, floor-to-ceiling windows. Desk. 42-inch flat-screen TV with cable, pay movies, and video games (surcharge). Voice mail. Upholstered armchair with ottoman. Bathrobes. Hairdryer. Designer toiletries. Shower/tub combination. Refrigerator. Video account review and check-out. Rollaway beds available.</Description></Alternative><Alternative name="Marriott"><AlternativeValue objective="area" value="airport"/><AlternativeValue objective="internet-access" value="lowspeed"/><AlternativeValue objective="rate" value="175"/><AlternativeValue objective="skytrain-distance" value="9"/><AlternativeValue objective="size" value="200"/><Description>The video-game console and TV with satellite channels are offered for your entertainment. A coffee/tea maker is provided. The private bathroom has designer toiletries. Climate control, air conditioning, and a safe are among the conveniences offered. This room is Non-Smoking.</Description></Alternative><Alternative name="HolidayInn"><AlternativeValue objective="area" value="airport"/><AlternativeValue objective="internet-access" value="none"/><AlternativeValue objective="rate" value="100"/><AlternativeValue objective="skytrain-distance" value="1"/><AlternativeValue objective="size" value="237.5"/><Description>The 42-inch flat-screen TV offers cable channels. A coffee/tea maker is provided. The private bathroom has a hair dryer. Air conditioning, a desk, and a wake-up call service are among the conveniences offered. This room is Non-Smoking.</Description></Alternative><Alternative name="Ramada"><AlternativeValue objective="area" value="beach"/><AlternativeValue objective="internet-access" value="none"/><AlternativeValue objective="rate" value="125"/><AlternativeValue objective="skytrain-distance" value="1"/><AlternativeValue objective="size" value="312.5"/><Description>1 double bed. Desk. 37-inch LCD high-definition TV. Pay movies. Phone. Voice mail. Clock radio. Coffee/tea maker. Hair dryer. Iron/ironing board. Complimentary weekday newspaper. Bathroom with granite-topped vanity. Blackout drapes/curtains. Air conditioning. Climate control</Description></Alternative></Alternatives></ChartStructure><Users><User name="Aaron Mishkin"><Weights><Weight objective="area" value="0.2"/><Weight objective="internet-access" value="0.1"/><Weight objective="rate" value="0.3"/><Weight objective="skytrain-distance" value="0.2"/><Weight objective="size" value="0.2"/></Weights><ScoreFunctions><ScoreFunction objective="area" type="discrete"><Score value="0" domain-element="nightlife"/><Score value="0.5" domain-element="beach"/><Score value="1" domain-element="airport"/></ScoreFunction><ScoreFunction objective="skytrain-distance" type="continuous"><Score value="1" domain-element="1"/><Score value="0.5" domain-element="3"/><Score value="0.2" domain-element="5"/><Score value="0.1" domain-element="7"/><Score value="0" domain-element="9"/></ScoreFunction><ScoreFunction objective="size" type="continuous"><Score value="1" domain-element="200"/><Score value="0.8" domain-element="237.5"/><Score value="0.6" domain-element="275"/><Score value="0.4" domain-element="312.5"/><Score value="0" domain-element="350"/></ScoreFunction><ScoreFunction objective="internet-access" type="discrete"><Score value="0" domain-element="none"/><Score value="1" domain-element="highspeed"/><Score value="0.5" domain-element="lowspeed"/></ScoreFunction><ScoreFunction objective="rate" type="continuous"><Score value="1" domain-element="100"/><Score value="0.75" domain-element="125"/><Score value="0.5" domain-element="150"/><Score value="0.25" domain-element="175"/><Score value="0" domain-element="200"/></ScoreFunction></ScoreFunctions></User></Users></ValueCharts>';
		});

		it('should convert the ValueChart into XML that is identical to the source XML when serialized', () => {
			var valueChartElement: Element = xmlValueChartEncoder.convertValueChartIntoElement(valueChart, xmlDocument);
			expect(xmlSerializer.serializeToString(valueChartElement)).to.equal(valueChartXMLString);
		});
	});
});



