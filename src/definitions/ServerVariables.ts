import type { Readable } from '../utils/Variables';
import type { Teams } from './Teams';

export interface ServerVariables {
  Game: {
    FriendlyFire: Readable<'-1' | '1'>;
    AutoBalanceTeamsOverride: Readable<'-1' | '1'>;
    AutoAssignHumanTeam: Readable<'-1' | Teams>;
  };
  Bot: {
    Autofill: Readable<'-1' | '1'>;
  };
  Net: {
    MinPlayersOverride: Readable<`${number}`>;
    MaxPlayersOverride: Readable<`${number}`>;
    AllowServerHibernation: Readable<'-1' | '1'>;
  };
  HD: {
    Game: {
      MinRespawnDelayOverride: Readable<`${number}`>;
      DisableKitRestrictionsOverride: Readable<'-1' | '1'>;
    };
    CP: {
      MinPlayersToCaptureOverride: Readable<`${number}`>;
      EnforceSmallerMinPLayersToCapture: Readable<'-1' | '1'>;
    };
    AAS: {
      ActiveRouteOverride: Readable<`${number}`>;
    };
  };
}
export interface UnsafeVariables {
  [key: string]: Readable<string> & UnsafeVariables;
}
