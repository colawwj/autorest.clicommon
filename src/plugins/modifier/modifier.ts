import { Session } from "@azure-tools/autorest-extension-base";
import { CodeModel } from "@azure-tools/codemodel";
import { CliDirectiveManager } from "./cliDirective";
import { isNullOrUndefined } from "util";
import { CliConst, CliCommonSchema } from "../../schema";
import { Helper } from "../../helper";

export class Modifier {
    private manager: CliDirectiveManager;

    get codeModel() {
        return this.session.model;
    }

    constructor(protected session: Session<CodeModel>) {
    }

    async init(directives: CliCommonSchema.CliDirective.Directive[]): Promise<Modifier> {
        if (isNullOrUndefined(directives))
            directives = [];
        if (!isNullOrUndefined(directives) && !Array.isArray(directives))
            throw Error("directive is expected to be an array. Please check '-' is set property in yaml")

        this.manager = new CliDirectiveManager();
        await this.manager.LoadDirective(directives);
        return this;
    }

    public process(): CodeModel {

        let choices = [this.codeModel.schemas.choices ?? [], this.codeModel.schemas.sealedChoices ?? []];
        let i = -1;
        choices.forEach(arr => {
            for (i = arr.length - 1; i >= 0; i--) {
                let s = arr[i];
                this.manager.process({
                    choiceSchemaName: s.language.default.name,
                    parent: arr,
                    target: s,
                    targetIndex: i
                });

                for (let j = s.choices.length - 1; j >= 0; j--) {
                    let ss = s.choices[j];
                    this.manager.process({
                        choiceSchemaName: s.language.default.name,
                        choiceValueName: ss.language.default.name,
                        parent: s.choices,
                        target: ss,
                        targetIndex: j
                    });
                }
            }
        });

        for (i = this.codeModel.schemas.objects.length - 1; i >= 0; i--) {
            let s = this.codeModel.schemas.objects[i];
            this.manager.process({
                objectSchemaName: s.language.default.name,
                parent: this.codeModel.schemas.objects,
                target: s,
                targetIndex: i
            });
            if (!isNullOrUndefined(s.properties)) {
                for (let j = s.properties.length - 1; j >= 0; j--) {
                    let p = s.properties[j];
                    this.manager.process({
                        objectSchemaName: s.language.default.name,
                        propertyName: p.language.default.name,
                        parent: s.properties,
                        target: p,
                        targetIndex: j
                    })
                }
            }
        }

        for (i = this.codeModel.operationGroups.length - 1; i >= 0; i--) {
            let group = this.codeModel.operationGroups[i];
            this.manager.process({
                operationGroupName: group.language.default.name,
                parent: this.codeModel.operationGroups,
                target: group,
                targetIndex: i,
            })
            for (let j = group.operations.length - 1; j >= 0; j--) {
                let op = group.operations[j];
                this.manager.process({
                    operationGroupName: group.language.default.name,
                    operationName: op.language.default.name,
                    parent: group.operations,
                    target: op,
                    targetIndex: j,
                })

                for (let k = op.parameters.length - 1; k >= 0; k--) {
                    let param = op.parameters[k];
                    this.manager.process({
                        operationGroupName: group.language.default.name,
                        operationName: op.language.default.name,
                        parameterName: param.language.default.name,
                        parent: op.parameters,
                        target: param,
                        targetIndex: k,
                    })
                }

                for (let m = op.requests.length - 1; m >= 0; m--) {
                    if (!isNullOrUndefined(op.requests[m].parameters)) {
                        for (let k = op.requests[m].parameters.length - 1; k >= 0; k--) {
                            let param = op.requests[m].parameters[k];
                            this.manager.process({
                                operationGroupName: group.language.default.name,
                                operationName: op.language.default.name,
                                requestIndex: m,
                                parameterName: param.language.default.name,
                                parent: op.requests[m].parameters,
                                target: param,
                                targetIndex: k,
                            })
                        }
                    }
                }
            }
        }
        return this.codeModel;
    }

}