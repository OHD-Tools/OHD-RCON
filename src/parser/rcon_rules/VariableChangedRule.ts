import { RCONParserRule } from '../../definitions/RCONParserRule';
import { VariableChanged } from '../../definitions/VariableChanges';

export const VariableChangedRule: RCONParserRule<VariableChanged> = {
  regex: /^(?<variable>.*) = "(?<value>.*)"$/m,
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<VariableChanged> = {} as VariableChanged;
    response.variable = args.groups?.variable as string;
    response.value = args.groups?.value as string;
    return response as VariableChanged;
  },
};
