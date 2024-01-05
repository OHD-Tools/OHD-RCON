import CommandSuccess from '../../definitions/CommandSuccess';
import LogParserRule from '../../definitions/RCONParserRule';

const PlayerPrivilegeRevokeRule: LogParserRule<CommandSuccess> = {
  regex: /^Player was revoked of their admin privileges/,
  format: () => {
    const response: Partial<CommandSuccess> = {
      success: true,
    } as CommandSuccess;
    return response as CommandSuccess;
  },
};
export default PlayerPrivilegeRevokeRule;
