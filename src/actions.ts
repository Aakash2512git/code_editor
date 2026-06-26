export const ACTIONS = {
  JOIN: 'join',
  JOINED: 'joined',
  DISCONNECTED: 'disconnected',
  CODE_CHANGE: 'code-change',
  SYNC_CODE: 'sync-code',
  LEAVE: 'leave',
} as const;

export type ActionType = (typeof ACTIONS)[keyof typeof ACTIONS];

export interface ClientInfo {
  socketId: string;
  username: string;
}
