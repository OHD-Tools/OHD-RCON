import { RCONParserRule } from '../../definitions/RCONParserRule';
import { VariableRead } from '../../definitions/VariableRead';

export const VariableReadRule: RCONParserRule<VariableRead> = {
  regex: /^(?<variable>.*) = "(?<value>.*)"\s*LastSetBy: (?<setBy>.*)$/m,
  format: (oargs) => {
    const args = oargs as RegExpMatchArray;
    const response: Partial<VariableRead> = {} as VariableRead;
    response.variable = args.groups?.variable as string;
    response.value = args.groups?.value as string;
    response.setBy = args.groups?.setBy as string;
    return response as VariableRead;
  },
};
