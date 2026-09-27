import { TelemetrySample, CarTelemetry } from '../../types';

export interface TelemetryProvider {
  name: string;
  isConnected: boolean;
  connect(config?: any): Promise<boolean>;
  disconnect(): void;
  onSample(callback: (sample: TelemetrySample) => void): void;
  onStatusChange?(callback: (connected: boolean) => void): void;
}
