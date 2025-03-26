export interface PlayerBanned {
  success: boolean;
  name?: string;
  id?: number;
  banReason: string;
  length: number;
  reason?: string;
}
