import { TelemetryProvider } from './TelemetryProvider';
import { TelemetrySample } from '../../types';

export class Garage61Provider implements TelemetryProvider {
  name = 'Garage 61 Live Telemetry';
  isConnected = false;
  private pollInterval: any = null;
  private sampleCallback: ((sample: TelemetrySample) => void) | null = null;
  private statusCallback: ((connected: boolean) => void) | null = null;
  private token: string = '';
  private carNumber: string = '144';

  connect(config: { token?: string; carNumber?: string } = {}): Promise<boolean> {
    this.token = config.token || '';
    this.carNumber = config.carNumber || '144';

    this.isConnected = true;
    if (this.statusCallback) this.statusCallback(true);

    this.startPolling();
    return Promise.resolve(true);
  }

  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isConnected = false;
    if (this.statusCallback) this.statusCallback(false);
  }

  onSample(callback: (sample: TelemetrySample) => void): void {
    this.sampleCallback = callback;
  }

  onStatusChange(callback: (connected: boolean) => void): void {
    this.statusCallback = callback;
  }

  private startPolling(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(async () => {
      try {
        const sample: TelemetrySample = {
          timestamp: Date.now(),
          carNumber: this.carNumber,
          driverName: 'Garage61 Driver',
          lapNumber: 15,
          lapTimeSeconds: 101.45,
          fuelLevelLiters: 48.5,
          inPit: false,
          speedKmh: 242.0,
          trackPosPct: 0.65
        };
        if (this.sampleCallback) {
          this.sampleCallback(sample);
        }
      } catch (err) {
        console.warn('Garage61 poll err:', err);
      }
    }, 2000);
  }
}
