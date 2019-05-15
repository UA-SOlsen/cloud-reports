import {
    CheckAnalysisType, ICheckAnalysisResult, IDictionary,
    IResourceAnalysisResult, SeverityStatus,
} from "../../../types";
import { ResourceUtil } from "../../../utils";
import { BaseAnalyzer } from "../../base";

export class VolumesUsageAnalyzer extends BaseAnalyzer {
    public checks_what : string = "Are there any EBS unused volumes?";
    public checks_why : string = `EBS volumes are costly resources so you should
    take snapshot and deleted the unused volumes`;
    public checks_recommendation: string = `Recommended to delete unused EBS volumes
        once snapshot is taken incase if there will be need for that data later`;
    public checks_name : string = "Volume";
    public analyze(params: any, fullReport?: any): any {
        const allVolumes = params.volumes;
        if (!allVolumes) {
            return undefined;
        }
        const volumes_unused: ICheckAnalysisResult = { type: CheckAnalysisType.CostOptimization };
        volumes_unused.what = this.checks_what;
        volumes_unused.why = this.checks_why;
        volumes_unused.recommendation = this.checks_recommendation;
        const allRegionsAnalysis: IDictionary<IResourceAnalysisResult[]> = {};
        for (const region in allVolumes) {
            const regionVolumes = allVolumes[region];
            allRegionsAnalysis[region] = [];
            for (const volume of regionVolumes) {
                const volumeAnalysis: IResourceAnalysisResult = {};
                volumeAnalysis.resource = volume;
                volumeAnalysis.resourceSummary = {
                    name: this.checks_name,
                    value: `${ResourceUtil.getNameByTags(volume)} | ${volume.VolumeId}`,
                };
                if (volume.Attachments && volume.Attachments.length) {
                    volumeAnalysis.severity = SeverityStatus.Good;
                    volumeAnalysis.message = `Volume is attached to ${volume.Attachments[0].InstanceId}`;
                } else {
                    volumeAnalysis.severity = SeverityStatus.Warning;
                    volumeAnalysis.message = "Volume is not attached";
                    volumeAnalysis.action = "Delete the volume after taking the snapshot";
                }
                allRegionsAnalysis[region].push(volumeAnalysis);
            }
        }
        volumes_unused.regions = allRegionsAnalysis;
        return { volumes_unused };
    }
}
