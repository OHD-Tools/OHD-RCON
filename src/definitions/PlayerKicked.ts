export default interface PlayerKicked {
  success: boolean;
  name?: string;
  id?: number;
  kickReason: string;
  reason?: string;
}
