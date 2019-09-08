import tl = require("azure-pipelines-task-lib/task");
import msRestAzure = require('azure-arm-rest-v2/azure-arm-common');
import { AzureRMEndpoint } from 'azure-arm-rest-v2/azure-arm-endpoint';

export class AzureRGTaskParameters {

    public action: string;
    public resourceGroupName: string;
    public location: string;
    public csmFile: string;
    public csmParametersFile: string;
    public templateLocation: string;
    public csmFileLink: string;
    public csmParametersFileLink: string;
    public overrideParameters: string;
    public outputVariable: string;
    public subscriptionId: string;
    public endpointPortalUrl: string;
    public deploymentName: string;
    public deploymentMode: string;
    public credentials: msRestAzure.ApplicationTokenCredentials;
    public deploymentOutputs: string;
    public addSpnToEnvironment: boolean;
    public connectedService: string;
    public deploymentScope: string;
    public managementGroupId: string;

    private async getARMCredentials(connectedService: string): Promise<msRestAzure.ApplicationTokenCredentials> {
        var azureEndpoint = await new AzureRMEndpoint(connectedService).getEndpoint();
        return azureEndpoint.applicationTokenCredentials;
    }

    public async getAzureRGTaskParameters() : Promise<AzureRGTaskParameters> 
    {
        try {
            this.connectedService = tl.getInput("ConnectedServiceName", true);
            var endpointTelemetry = '{"endpointId":"' + this.connectedService + '"}';
            console.log("##vso[telemetry.publish area=TaskEndpointId;feature=AzureResourceGroupDeployment]" + endpointTelemetry);
            
            //Deployment Scope            
            this.deploymentScope = tl.getInput("deploymentScope");
            if(!this.deploymentScope){
                this.deploymentScope = "Resource Group";
            }

            //Subscripion Id
            this.subscriptionId = tl.getInput("subscriptionName");
            if(!this.subscriptionId) {
                this.subscriptionId = tl.getEndpointDataParameter(this.connectedService, "SubscriptionId", true);
                
                if(!this.subscriptionId && this.deploymentScope != "Management Group"){
                    throw new Error(tl.loc("ARGD_ConstructorFailed"));
                }
            }

            //Resource group name
            this.resourceGroupName = tl.getInput("resourceGroupName");
            if(!this.resourceGroupName && this.deploymentScope === "Resource Group"){
                throw new Error(tl.loc("ARGD_ConstructorFailed"));                
            }

            this.endpointPortalUrl = tl.getEndpointDataParameter(this.connectedService, "armManagementPortalUrl", true);
            this.action = tl.getInput("action");            
            this.managementGroupId = tl.getEndpointDataParameter(this.connectedService, "ManagementGroupId", true);
            this.location = tl.getInput("location");
            this.templateLocation = tl.getInput("templateLocation");
            if (this.templateLocation === "Linked artifact") {
                this.csmFile = tl.getPathInput("csmFile");
                this.csmParametersFile = tl.getPathInput("csmParametersFile");
            } else {
                this.csmFileLink = tl.getInput("csmFileLink");
                this.csmParametersFileLink = tl.getInput("csmParametersFileLink");
            }
            this.overrideParameters = tl.getInput("overrideParameters");
            
            this.outputVariable = tl.getInput("outputVariable");
            this.deploymentName = tl.getInput("deploymentName");
            this.deploymentMode = tl.getInput("deploymentMode");
            this.credentials = await this.getARMCredentials(this.connectedService);
            this.deploymentOutputs = tl.getInput("deploymentOutputs");
            this.addSpnToEnvironment = tl.getBoolInput("addSpnToEnvironment", false);
            return this;
        } catch (error) {
            throw new Error(tl.loc("ARGD_ConstructorFailed", error.message));
        }
    }    
}
