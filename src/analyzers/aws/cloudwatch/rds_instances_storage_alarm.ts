import {
    CheckAnalysisType, ICheckAnalysisResult, IDictionary,
    IResourceAnalysisResult, SeverityStatus,
} from "../../../types";
import { BaseAnalyzer } from "../../base";

export class RDSInstanceStorageAlarmAnalyzer extends BaseAnalyzer {
    public checks_what : string = "Are alarms are enabled for RDS instance Storage?";
    public checks_why : string = `It is important to set alarms for RDS Storage as when
    there is no storage then the application will stop working.`;
    public  checks_recommendation: string = `Recommended to set
    alarms for RDS Storage to take appropriative action.`;
    public  checks_name: string = "DBInstance";
    public analyze(params: any, fullReport?: any): any {
        const allAlarms: any[] = params.alarms;
        if (!allAlarms || !fullReport["aws.rds"] || !fullReport["aws.rds"].instances) {
            return undefined;
        }
        const allInstances: any[] = fullReport["aws.rds"].instances;

        const rds_instances_storage_alarm: ICheckAnalysisResult = { type: CheckAnalysisType.PerformanceEfficiency };
        rds_instances_storage_alarm.what = this.checks_what;
        rds_instances_storage_alarm.why = this.checks_why;
        rds_instances_storage_alarm.recommendation = this.checks_recommendation;
        const allRegionsAnalysis: IDictionary<IResourceAnalysisResult[]> = {};
        for (const region in allInstances) {
            const regionInstances = allInstances[region];
            const regionAlarms = allAlarms[region];
            const alarmsMapByInstance = this.mapAlarmsByInstance(regionAlarms);
            allRegionsAnalysis[region] = [];
            for (const instance of regionInstances) {
                if (instance.DBInstanceStatus === "stopped") {
                    continue;
                }
                const alarmAnalysis: IResourceAnalysisResult = {};
                const instanceAlarms = alarmsMapByInstance[instance.DBInstanceIdentifier];
                alarmAnalysis.resource = { instance, alarms: instanceAlarms };
                alarmAnalysis.resourceSummary = {
                    name: this.checks_name,
                    value: instance.DBInstanceIdentifier,
                };

                if (this.isStorageAlarmPresent(instanceAlarms)) {
                    alarmAnalysis.severity = SeverityStatus.Good;
                    alarmAnalysis.message = "Storage alarm is enabled";
                } else {
                    alarmAnalysis.severity = SeverityStatus.Warning;
                    alarmAnalysis.message = "Storage alarm is not enabled";
                    alarmAnalysis.action = "Set Storage alarm";
                }
                allRegionsAnalysis[region].push(alarmAnalysis);
            }
        }
        rds_instances_storage_alarm.regions = allRegionsAnalysis;
        return { rds_instances_storage_alarm };
    }

    private mapAlarmsByInstance(alarms: any[]): IDictionary<any[]> {
        if (!alarms) {
            return {};
        }
        return alarms.reduce((alarmsMap, alarm) => {
            if (alarm.Namespace === "AWS/RDS" && alarm.Dimensions) {
                const instanceDimension = alarm.Dimensions.find((dimension) => {
                    return dimension.Name === "DBInstanceIdentifier";
                });
                if (instanceDimension && instanceDimension.Value) {
                    alarmsMap[instanceDimension.Value] = alarmsMap[instanceDimension.Value] || [];
                    alarmsMap[instanceDimension.Value].push(alarm);

                }
            }
            return alarmsMap;
        }, {});
    }

    private isStorageAlarmPresent(alarms) {
        return alarms && alarms.some((alarm) => {
            return alarm.ActionsEnabled &&
                alarm.AlarmActions &&
                alarm.AlarmActions.length &&
                alarm.MetricName === "FreeStorageSpace";
        });
    }
}
