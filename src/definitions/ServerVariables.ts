import type { Readable } from '../utils/Variables';
import type { Teams } from './Teams';

export interface ServerVariables {
  Game: {
    FriendlyFire: Readable<'0' | '1'>;
    AutoBalanceTeamsOverride: Readable<'0' | '1'>;
    AutoAssignHumanTeam: Readable<'0' | Teams>;
  }
  Bot: {
    Autofill: Readable<'0' | '1'>;
  }
  Net: {
    MinPlayersOverride: Readable<`${number}`>;
    MaxPlayersOverride: Readable<`${number}`>;
    AllowServerHibernation: Readable<'0' | '1'>;
  }
  HD: {
    Game: {
      MinRespawnDelayOverride: Readable<`${number}`>;
      DisableKitRestrictionsOverride: Readable<'0' | '1'>;
    }
    CP: {
      MinPlayersToCaptureOverride: Readable<`${number}`>;
      EnforceSmallerMinPLayersToCapture: Readable<'0' | '1'>;
    }
    AAS: {
      ActiveRouteOverride: Readable<`${number}`>
    }
  }
}
export interface UnsafeVariables {
  [key: string]: Readable<string> & UnsafeVariables

}
