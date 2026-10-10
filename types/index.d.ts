export type Frame = number
export type ElapsedSeconds = number

declare module 'claude-code' {
  interface PluginState {
    'calm-spinner': { frame: Frame; elapsedSeconds: ElapsedSeconds }
  }
}
