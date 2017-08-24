
import { Component, OnInit }										    from '@angular/core';
import * as _                                       from 'lodash';
import { Observable }                               from 'rxjs/Observable';
import { Subscriber }                               from 'rxjs/Subscriber';
import '../../../utilities/rxjs-operators';

// Import Application Classes:
import { CreationStepsService }                     from '../../services/CreationSteps.service';
import { UpdateValueChartService }                  from '../../../app/services/UpdateValueChart.service';
import { ValueChartService }                        from '../../../app/services/ValueChart.service';
import { CurrentUserService }                       from '../../../app/services/CurrentUser.service';
import { ValidationService }                        from '../../../app/services/Validation.service';
import { UserNotificationService }                  from '../../../app/services/UserNotification.service';
import { ChartUndoRedoService }                     from '../../../ValueChart/services/ChartUndoRedo.service';
import { ScoreFunctionDirective }										from '../../../utilities/directives/ScoreFunction.directive';
import { RendererScoreFunctionUtility }							from '../../../ValueChart/utilities/RendererScoreFunction.utility';
import { UserGuardService }                         from '../../../app/services/UserGuard.service';

// Import Model Classes:
import { ValueChart } 													    from '../../../../model/ValueChart';
import { User }														      	  from '../../../../model/User';
import { ScoreFunctionMap }												  from '../../../../model/ScoreFunctionMap';
import { Objective }													      from '../../../../model/Objective';
import { PrimitiveObjective }                       from '../../../../model/PrimitiveObjective';
import { Domain }														        from '../../../../model/Domain';
import { CategoricalDomain }											  from '../../../../model/CategoricalDomain';
import { ContinuousDomain }												  from '../../../../model/ContinuousDomain';
import { IntervalDomain }												    from '../../../../model/IntervalDomain';
import { ScoreFunction }												    from '../../../../model/ScoreFunction';
import { DiscreteScoreFunction }										from '../../../../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }								  from '../../../../model/ContinuousScoreFunction';
import { WeightMap }                                from '../../../../model/WeightMap';

// Import Types:
import { ChartOrientation }                         from '../../../../types/Config.types';


/*
  This component defines the UI controls for defining the ScoreFunctions for a ValueChart.
  It uses the ScoreFunctionDirective to render the plots.
*/

@Component({
  selector: 'CreateScoreFunctions',
  templateUrl: './CreateScoreFunctions.template.html',
  providers: [RendererScoreFunctionUtility]
})
export class CreateScoreFunctionsComponent implements OnInit {

  // ========================================================================================
  //                   Fields
  // ========================================================================================

  public ChartOrientation = ChartOrientation;
  public ScoreFunction = ScoreFunction;

  user: User;
  selectedObjective: string; // Objective selected in the dropdown menu
  initialBestOutcomes: { [objName: string]: string | number }; // Track initial best outcomes for each Objective
                                                               // so we can reset weights if it changes
  initialWorstOutcomes: { [objName: string]: string | number }; // Track initial worst outcomes for each Objective
                                                                // so we can reset weights if it changes
  latestDefaults: { [objName: string]: string }; // Track latest default function so we can set dropdown accordingly
  public services: any = {}; // Services container to pass to ScoreFunctionDirective


  // Validation fields:
  validationTriggered: boolean = false;
  errorMessages: string[]; // Validation error messages

  // ========================================================================================
  //                   Constructor
  // ========================================================================================

  /*
    @returns {void}
    @description   Used for Angular's dependency injection ONLY. It should not be used to do any initialization of the class.
            This constructor will be called automatically when Angular constructs an instance of this class prior to dependency injection.
  */
  constructor(
    public valueChartService: ValueChartService,
    private creationStepsService: CreationStepsService,
    private updateValueChartService: UpdateValueChartService,
    private rendererScoreFunctionUtility: RendererScoreFunctionUtility,
    private currentUserService: CurrentUserService,
    private validationService: ValidationService,
    private userNotificationService: UserNotificationService,
    private userGuardService: UserGuardService) { }

  // ========================================================================================
  //                   Methods
  // ========================================================================================

  // ================================ Life-cycle Methods ====================================

  /*   
    @returns {void}
    @description   Initializes CreateScoreFunctions. ngOnInit is only called ONCE by Angular.
            Calling ngOnInit should be left to Angular. Do not call it manually.
  */
  ngOnInit() {
    this.creationStepsService.observables[this.creationStepsService.PREFERENCES] = new Observable<boolean>((subscriber: Subscriber<boolean>) => {
      subscriber.next(this.validate());
      subscriber.complete();
    });
    this.services.chartUndoRedoService = new ChartUndoRedoService();
    this.services.rendererScoreFunctionUtility = this.rendererScoreFunctionUtility;
    this.selectedObjective = this.valueChartService.getValueChart().getMutableObjectives()[0].getName();
    this.latestDefaults = {};

    // Initialize user
    let newUser = false;
    if (!this.valueChartService.getValueChart().isMember(this.currentUserService.getUsername())) {
      let user = new User(this.currentUserService.getUsername());
      user.setScoreFunctionMap(new ScoreFunctionMap());
      user.setWeightMap(new WeightMap());
      this.updateValueChartService.completeScoreFunctions(this.valueChartService.getValueChart().getAllPrimitiveObjectives(), user);
      this.valueChartService.getValueChart().setUser(user);
      newUser = true;
    }
    this.user = this.valueChartService.getValueChart().getUser(this.currentUserService.getUsername());

    // Record the current user object if no record exists yet.
    if (!this.userGuardService.getUserRecord()) {
      this.userGuardService.setUserRecord(_.cloneDeep(this.user))
    }

    // Initialize latest defaults and best/worst outcomes
    this.initialBestOutcomes = {};
    this.initialWorstOutcomes = {};
    for (let obj of this.valueChartService.getValueChart().getMutableObjectives()) {
      this.initialBestOutcomes[obj.getName()] = this.user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getId()).bestElement;
      this.initialWorstOutcomes[obj.getName()] = this.user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getId()).worstElement;
      this.latestDefaults[obj.getName()] = "default";
    }

    if (!newUser) {
      this.validate();   
    }
  }

  /*   
    @returns {void}
    @description   Destroys CreateScoreFunctions. ngOnDestroy is only called ONCE by Angular when the user navigates to a route which
            requires that a different component is displayed in the router-outlet.
  */
  ngOnDestroy() {
    // Clear weight map if best or worst outcome has changed
    if (this.user.getWeightMap().getWeightTotal() > 0) {
      for (let obj of this.valueChartService.getValueChart().getMutableObjectives()) {
        let newBestOutcome = this.user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getId()).bestElement;
        let newWorstOutcome = this.user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getId()).worstElement;
        if (newBestOutcome !== this.initialBestOutcomes[obj.getName()] || newWorstOutcome !== this.initialWorstOutcomes[obj.getName()]) {
          this.userNotificationService.displayWarnings([this.updateValueChartService.BEST_WORST_OUTCOME_CHANGED]);
          break;
        }
      }
    }
  }

  // ================================ Objective Selection Methods ====================================

  /*   
    @returns {void}
    @description   Changes selected Objective to next in list.
                   (Currently called when user clicks "Next" button next to dropdown).
  */
  advanceSelectedObjective() {
    let primObjs: string[] = this.valueChartService.getValueChart().getMutableObjectives().map(obj => obj.getName());
    let selectedIndex: number = primObjs.indexOf(this.selectedObjective);
    let nextIndex: number = selectedIndex + 1;
    if (nextIndex >= primObjs.length) {
      nextIndex = 0;
    }
    this.selectedObjective = primObjs[nextIndex];
  }

  // ================================ Default Function Selection Methods ====================================

  /*   
    @returns {void}
    @description   Reinitializes the score function to the selected default.
                   (Currently called when user selects a new default from the dropdown or clicks 'Reset').
  */
  resetScoreFunction() {
    let obj: PrimitiveObjective = <PrimitiveObjective>this.getObjectiveByName(this.selectedObjective);
    if (this.latestDefaults[this.selectedObjective] === 'default') {
      this.user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getId()).setElementScoreMap(_.cloneDeep(obj.getDefaultScoreFunction().getElementScoreMap()));
    }
    else if (obj.getDomainType() === 'categorical' || obj.getDomainType() === 'interval') {
      let elements = (<CategoricalDomain | IntervalDomain>obj.getDomain()).getElements();
      (<DiscreteScoreFunction>this.user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getId())).initialize(this.latestDefaults[this.selectedObjective], elements);
    }
    else {
      (<ContinuousScoreFunction>this.user.getScoreFunctionMap().getObjectiveScoreFunction(obj.getId())).initialize(this.latestDefaults[this.selectedObjective]);
    }
  }

  // ================================ Validation Methods ====================================

    /*   
    @returns {boolean}
    @description   Checks validity of score functions.
  */
  validate(): boolean {
    this.validationTriggered = true;
    this.errorMessages = this.validationService.validateScoreFunctions(this.valueChartService.getValueChart(), this.user);
    return this.errorMessages.length === 0;
  }

   /*   
    @returns {void}
    @description   Resets error messages if validation has already been triggered.
            (This is done whenever the user makes a change to the chart. This way, they get feedback while repairing errors.)
  */
  resetErrorMessages(): void {
    if (this.validationTriggered) {
      this.errorMessages = this.validationService.validateScoreFunctions(this.valueChartService.getValueChart(), this.user);
    }
  }

  public getObjectiveByName(name: string): PrimitiveObjective {
    for (let obj of this.valueChartService.getValueChart().getAllPrimitiveObjectives()) {
      if (obj.getName() === name) {
        return obj;
      }
    }
    throw "Objective not found";
  }
}
