import {
    CheckAnalysisType, ICheckAnalysisResult,
    IResourceAnalysisResult, SeverityStatus,
} from "../../../types";
import { CloudFrontUtil } from "../../../utils/aws/cloudfront";
import { BaseAnalyzer } from "../../base";

export class DistributionLogsAnalyzer extends BaseAnalyzer {
    public checks_what : string ="Are access logs enabled for CloudFront distributions?";
    public checks_why : string = `It is important to enabled access logs for the distributions to understand
    access patterns and come with better caching strategies`;
    public checks_recommendation: string = "Recommended to enable access logs for all distributions";
    public checks_name: string = "Distribution";
    public analyze(params: any, fullReport?: any): any {
        const allDistributionConfigs: any[] = params.distribution_configs;

        if (!allDistributionConfigs) {
            return undefined;
        }
        const distributions_logs_enabled: ICheckAnalysisResult = { type: CheckAnalysisType.OperationalExcellence };
        distributions_logs_enabled.what = this.checks_what;
        distributions_logs_enabled.why = this.checks_why;
        distributions_logs_enabled.recommendation = this.checks_recommendation;
        const allDistributionsAnalysis: IResourceAnalysisResult[] = [];
        for (const distributionId in allDistributionConfigs) {
            const distribution = allDistributionConfigs[distributionId];
            const distributionsAnalysis: IResourceAnalysisResult = {};

            distributionsAnalysis.resource = { distributionId, logging: distribution.Logging };
            const distributionAlias = CloudFrontUtil.getAliasName(distribution);
            distributionsAnalysis.resourceSummary = {
                name: this.checks_name,
                value: distributionAlias ? `${distributionAlias} | ${distributionId}` : distributionId,
            };
            if (distribution.Logging.Enabled) {
                distributionsAnalysis.severity = SeverityStatus.Good;
                distributionsAnalysis.message = "Access Logs are enabled";
            } else {
                distributionsAnalysis.severity = SeverityStatus.Warning;
                distributionsAnalysis.message = "Access Logs are not enabled";
                distributionsAnalysis.action = "Enable Access Logs";
            }
            allDistributionsAnalysis.push(distributionsAnalysis);
        }
        distributions_logs_enabled.regions = { global: allDistributionsAnalysis };
        return { distributions_logs_enabled };
    }
}
