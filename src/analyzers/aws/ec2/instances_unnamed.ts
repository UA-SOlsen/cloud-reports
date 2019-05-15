import {
    CheckAnalysisType, ICheckAnalysisResult, IDictionary,
    IResourceAnalysisResult, SeverityStatus,
} from "../../../types";
import { ResourceUtil } from "../../../utils";
import { BaseAnalyzer } from "../../base";

export class InstancesUnnamedAnalyzer extends BaseAnalyzer {
    public  checks_what : string = "Are there any EC2 instances without Name tags";
    public  checks_why : string =  "Tags help to follow security practices easily";
    public checks_recommendation: string = "Recommended to add Name tag to all instances" ;
    public checks_name : string = "Instance";
    public analyze(params: any, fullReport?: any): any {
        const allInstances = params.instances;
        if (!allInstances) {
            return undefined;
        }
        const unnamed_instances: ICheckAnalysisResult = { type: CheckAnalysisType.OperationalExcellence };
        unnamed_instances.what = this.checks_what;
        unnamed_instances.why =this.checks_why;
        unnamed_instances.recommendation = this.checks_recommendation;
        const allRegionsAnalysis: IDictionary<IResourceAnalysisResult[]> = {};
        for (const region in allInstances) {
            const regionInstances = allInstances[region];
            allRegionsAnalysis[region] = [];
            for (const instance of regionInstances) {
                const instanceAnalysis: IResourceAnalysisResult = {};
                instanceAnalysis.resource = {
                    instanceId: instance.InstanceId,
                    instanceName: ResourceUtil.getNameByTags(instance),
                    security_groups: instance.SecurityGroups,
                };
                instanceAnalysis.resourceSummary = {
                    name: this.checks_name,
                    value: `${instanceAnalysis.resource.instanceName} | ${instance.InstanceId}`,
                };
                if (instanceAnalysis.resource.instanceName === "Unassigned") {
                    instanceAnalysis.severity = SeverityStatus.Warning;
                    instanceAnalysis.message = "No Name tag";
                    instanceAnalysis.action = "Add Name tag";
                } else {
                    instanceAnalysis.severity = SeverityStatus.Good;
                    instanceAnalysis.message = `Name tag is present`;
                }
                allRegionsAnalysis[region].push(instanceAnalysis);
            }
        }
        unnamed_instances.regions = allRegionsAnalysis;
        return { unnamed_instances };
    }
}
