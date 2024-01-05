import CommandSuccess from '../../definitions/CommandSuccess';
import LogParserRule from '../../definitions/RCONParserRule';

const PlayerPrivilegeAddRule: LogParserRule<CommandSuccess> = {
  regex: /^Player was successfully granted admin privileges/,
  format: () => {
    const response: Partial<CommandSuccess> = {
      success: true,
    } as CommandSuccess;
    return response as CommandSuccess;
  },
};
export default PlayerPrivilegeAddRule;
