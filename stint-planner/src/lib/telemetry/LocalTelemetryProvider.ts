import { TelemetryProvider } from './TelemetryProvider';
import { TelemetrySample } from '../../types';

export class LocalTelemetryProvider implements TelemetryProvider {
  name = 'iRacing Local Bridge';
  isConnected = false;
  private ws: WebSocket | null = null;
  private sampleCallback: ((sample: TelemetrySample) => void) | null = null;
  private statusCallback: ((connected: boolean) => void) | null = null;

  connect(config: { wsUrl?: string } = {}): Promise<boolean> {
    const url = config.wsUrl || 'ws://localhost:8080/telemetry';

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.statusCallback) this.statusCallback(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.sampleCallback && data.fuelLevel !== undefined) {
            this.sampleCallback({
              timestamp: Date.now(),
              carNumber: data.carNumber || '144',
              driverName: data.driverName || 'Local Driver',
              lapNumber: data.lapNumber || 1,
              lapTimeSeconds: data.lastLapTime,
              fuelLevelLiters: data.fuelLevel,
              inPit: data.inPit || false,
              speedKmh: data.speed,
              trackPosPct: data.trackPosPct
            });
          }
        } catch (e) {
          console.error('Error parsing telemetry ws message', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.statusCallback) this.statusCallback(false);
      };

      return Promise.resolve(true);
    } catch (e) {
      console.warn('Failed to connect to local ws', e);
      return Promise.resolve(false);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
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
}
