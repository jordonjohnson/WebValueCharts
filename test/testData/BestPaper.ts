/*
* @Author: aaronpmishkin
* @Date:   2017-05-29 20:49:40
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2017-05-29 20:57:39
*/

export var BestPaperChartData: string = 
`<?xml version="1.0" encoding="UTF-8"?>
<ValueCharts name="BestPaper" creator="carenini" version="2.0" password="bestpaper">
   <ChartStructure>
      <Objectives>
         <Objective name="BestPaper" type="abstract">
            <Objective name="Originality" type="primitive" color="green">
               <Domain type="categorical" ordered="true" />
               <Description>How original is the approach? Does this paper break new ground in topic, methodology, or content? How exciting and innovative is the research it describes?</Description>
            </Objective>
            <Objective name="Clarity" type="primitive" color="red">
               <Domain type="categorical" ordered="true" />
               <Description>For a reasonably well-prepared reader, is it clear what was done and why? Is the paper well-written and well-structured?</Description>
            </Objective>
            <Objective name="Impact of Ideas or Results " type="primitive" color="blue">
               <Domain type="categorical" ordered="true" />
               <Description>How significant is the work described? If the ideas are novel, will they also be useful or inspirational? Does the paper bring new insights into the nature of the problem?</Description>
            </Objective>
         </Objective>
      </Objectives>
      <Alternatives>
         <Alternative name="Summarizing news">
            <AlternativeValue objective="Originality" value="CreativeIntriguing" />
            <AlternativeValue objective="Clarity" value="MostlyUnderstandable" />
            <AlternativeValue objective="Impact of Ideas or Results " value="IdeasWillHelpOthers" />
            <Description>Summarizing news</Description>
         </Alternative>
         <Alternative name="Summarizing opinions">
            <AlternativeValue objective="Originality" value="Respectable" />
            <AlternativeValue objective="Clarity" value="Understandable" />
            <AlternativeValue objective="Impact of Ideas or Results " value="IdeasWillHelpOthers" />
            <Description>Summarizing opinions</Description>
         </Alternative>
         <Alternative name="Summarizing conversations">
            <AlternativeValue objective="Originality" value="Respectable" />
            <AlternativeValue objective="Clarity" value="MostlyUnderstandable" />
            <AlternativeValue objective="Impact of Ideas or Results " value="WillAffectOthersResearch" />
            <Description>Summarizing conversations</Description>
         </Alternative>
         <Alternative name="Summarizing lectures">
            <AlternativeValue objective="Clarity" value="NotVeryUnderstandable" />
            <AlternativeValue objective="Impact of Ideas or Results " value="IdeasWillHelpOthers" />
            <AlternativeValue objective="Originality" value="ExtremelyNovelResearch" />
            <Description>Summarizing lectures</Description>
         </Alternative>
      </Alternatives>
   </ChartStructure>
   <Users>
      <User name="carenini" color="#F3C300">
         <Weights>
            <Weight objective="Originality" value="0.2988839471703635" />
            <Weight objective="Impact of Ideas or Results " value="0.2988839471703635" />
            <Weight objective="Clarity" value="0.4022321056592731" />
         </Weights>
         <ScoreFunctions>
            <ScoreFunction objective="Originality" type="discrete">
               <Score value="0" domain-element="DoneBefore" />
               <Score value="0.17008356165002894" domain-element="ObviousExtension" />
               <Score value="0.4995729234483507" domain-element="Respectable" />
               <Score value="0.8766550699869792" domain-element="CreativeIntriguing" />
               <Score value="1" domain-element="ExtremelyNovelResearch" />
            </ScoreFunction>
            <ScoreFunction objective="Clarity" type="discrete">
               <Score value="0" domain-element="confusing" />
               <Score value="0.25" domain-element="NotVeryUnderstandable" />
               <Score value="0.5" domain-element="MostlyUnderstandable" />
               <Score value="0.75" domain-element="Understandable" />
               <Score value="1" domain-element="VeryClear" />
            </ScoreFunction>
            <ScoreFunction objective="Impact of Ideas or Results " type="discrete">
               <Score value="0" domain-element="NoImpact" />
               <Score value="0.25" domain-element="MarginallyInteresting" />
               <Score value="0.5" domain-element="INterestingNotTooInfluential" />
               <Score value="0.75" domain-element="IdeasWillHelpOthers" />
               <Score value="1" domain-element="WillAffectOthersResearch" />
            </ScoreFunction>
         </ScoreFunctions>
      </User>
      <User name="Emily!" color="#000000">
         <Weights>
            <Weight objective="Impact of Ideas or Results " value="0.611111111111111" />
            <Weight objective="Clarity" value="0.27777777777777773" />
            <Weight objective="Originality" value="0.1111111111111111" />
         </Weights>
         <ScoreFunctions>
            <ScoreFunction objective="Originality" type="discrete">
               <Score value="1" domain-element="DoneBefore" />
               <Score value="0.75" domain-element="ObviousExtension" />
               <Score value="0.5" domain-element="Respectable" />
               <Score value="0.25" domain-element="CreativeIntriguing" />
               <Score value="0" domain-element="ExtremelyNovelResearch" />
            </ScoreFunction>
            <ScoreFunction objective="Clarity" type="discrete">
               <Score value="0" domain-element="confusing" />
               <Score value="0.25" domain-element="NotVeryUnderstandable" />
               <Score value="0.5" domain-element="MostlyUnderstandable" />
               <Score value="0.75" domain-element="Understandable" />
               <Score value="1" domain-element="VeryClear" />
            </ScoreFunction>
            <ScoreFunction objective="Impact of Ideas or Results " type="discrete">
               <Score value="0" domain-element="NoImpact" />
               <Score value="0.25" domain-element="MarginallyInteresting" />
               <Score value="0.5" domain-element="INterestingNotTooInfluential" />
               <Score value="0.75" domain-element="IdeasWillHelpOthers" />
               <Score value="1" domain-element="WillAffectOthersResearch" />
            </ScoreFunction>
         </ScoreFunctions>
      </User>
      <User name="amishkin" color="#000000">
         <Weights>
            <Weight objective="Impact of Ideas or Results " value="0.2751056545225835" />
            <Weight objective="Originality" value="0.35433601169204276" />
            <Weight objective="Clarity" value="0.3705583337853736" />
         </Weights>
         <ScoreFunctions>
            <ScoreFunction objective="Originality" type="discrete">
               <Score value="0" domain-element="DoneBefore" />
               <Score value="0.25" domain-element="ObviousExtension" />
               <Score value="0.5" domain-element="Respectable" />
               <Score value="0.75" domain-element="CreativeIntriguing" />
               <Score value="1" domain-element="ExtremelyNovelResearch" />
            </ScoreFunction>
            <ScoreFunction objective="Clarity" type="discrete">
               <Score value="0" domain-element="confusing" />
               <Score value="0.3333333333333333" domain-element="NotVeryUnderstandable" />
               <Score value="0.7745394418770755" domain-element="MostlyUnderstandable" />
               <Score value="1" domain-element="Understandable" />
               <Score value="0.4290152164203754" domain-element="VeryClear" />
            </ScoreFunction>
            <ScoreFunction objective="Impact of Ideas or Results " type="discrete">
               <Score value="1" domain-element="NoImpact" />
               <Score value="0.75" domain-element="MarginallyInteresting" />
               <Score value="0.5" domain-element="INterestingNotTooInfluential" />
               <Score value="0.25" domain-element="IdeasWillHelpOthers" />
               <Score value="0" domain-element="WillAffectOthersResearch" />
            </ScoreFunction>
         </ScoreFunctions>
      </User>
      <User name="Temp" color="#000000">
         <Weights>
            <Weight objective="Impact of Ideas or Results " value="0.06646764030343158" />
            <Weight objective="Clarity" value="0.8224212485854573" />
            <Weight objective="Originality" value="0.1111111111111111" />
         </Weights>
         <ScoreFunctions>
            <ScoreFunction objective="Originality" type="discrete">
               <Score value="0" domain-element="DoneBefore" />
               <Score value="0.25" domain-element="ObviousExtension" />
               <Score value="0.5" domain-element="Respectable" />
               <Score value="0.75" domain-element="CreativeIntriguing" />
               <Score value="1" domain-element="ExtremelyNovelResearch" />
            </ScoreFunction>
            <ScoreFunction objective="Clarity" type="discrete">
               <Score value="1" domain-element="confusing" />
               <Score value="0.75" domain-element="NotVeryUnderstandable" />
               <Score value="0.5" domain-element="MostlyUnderstandable" />
               <Score value="0.25" domain-element="Understandable" />
               <Score value="0" domain-element="VeryClear" />
            </ScoreFunction>
            <ScoreFunction objective="Impact of Ideas or Results " type="discrete">
               <Score value="0" domain-element="NoImpact" />
               <Score value="0.25" domain-element="MarginallyInteresting" />
               <Score value="0.5" domain-element="INterestingNotTooInfluential" />
               <Score value="0.75" domain-element="IdeasWillHelpOthers" />
               <Score value="1" domain-element="WillAffectOthersResearch" />
            </ScoreFunction>
         </ScoreFunctions>
      </User>
      <User name="temp" color="#000000">
         <Weights>
            <Weight objective="Impact of Ideas or Results " value="0.611111111111111" />
            <Weight objective="Originality" value="0.27777777777777773" />
            <Weight objective="Clarity" value="0.1111111111111111" />
         </Weights>
         <ScoreFunctions>
            <ScoreFunction objective="Originality" type="discrete">
               <Score value="1" domain-element="DoneBefore" />
               <Score value="0.75" domain-element="ObviousExtension" />
               <Score value="0.5" domain-element="Respectable" />
               <Score value="0.25" domain-element="CreativeIntriguing" />
               <Score value="0" domain-element="ExtremelyNovelResearch" />
            </ScoreFunction>
            <ScoreFunction objective="Clarity" type="discrete">
               <Score value="0" domain-element="confusing" />
               <Score value="0.25" domain-element="NotVeryUnderstandable" />
               <Score value="0.5" domain-element="MostlyUnderstandable" />
               <Score value="0.75" domain-element="Understandable" />
               <Score value="1" domain-element="VeryClear" />
            </ScoreFunction>
            <ScoreFunction objective="Impact of Ideas or Results " type="discrete">
               <Score value="0" domain-element="NoImpact" />
               <Score value="0.25" domain-element="MarginallyInteresting" />
               <Score value="0.5" domain-element="INterestingNotTooInfluential" />
               <Score value="0.75" domain-element="IdeasWillHelpOthers" />
               <Score value="1" domain-element="WillAffectOthersResearch" />
            </ScoreFunction>
         </ScoreFunctions>
      </User>
   </Users>
</ValueCharts>`;