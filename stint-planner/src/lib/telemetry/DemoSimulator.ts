import { TelemetryProvider } from './TelemetryProvider';
import { TelemetrySample } from '../../types';

export class DemoSimulator implements TelemetryProvider {
  name = 'GRiD UP Simulation Engine';
  isConnected = true;
  private timer: any = null;
  private sampleCallback: ((sample: TelemetrySample) => void) | null = null;
  private statusCallback: ((connected: boolean) => void) | null = null;

  private lapNumber: number = 18;
  private fuelLevel: number = 52.4;
  private fuelBurnPerLap: number = 3.15;
  private lapTimeSeconds: number = 100.8;
  private inPit: boolean = false;
  private trackPosPct: number = 0.45;
  private isSimulatingFast: boolean = false;

  connect(): Promise<boolean> {
    this.isConnected = true;
    if (this.statusCallback) this.statusCallback(true);
    this.startSimulation();
    return Promise.resolve(true);
  }

  disconnect(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
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

  public setFastMode(fast: boolean): void {
    this.isSimulatingFast = fast;
    this.startSimulation();
  }

  public triggerLap(): TelemetrySample {
    this.lapNumber += 1;
    this.fuelLevel = Math.max(0, this.fuelLevel - this.fuelBurnPerLap);
    const variation = (Math.random() - 0.5) * 0.8;
    const lapTime = Number((this.lapTimeSeconds + variation).toFixed(2));
    this.trackPosPct = 0.01;

    const sample: TelemetrySample = {
      timestamp: Date.now(),
      carNumber: '144',
      driverName: 'Matty G',
      lapNumber: this.lapNumber,
      lapTimeSeconds: lapTime,
      fuelLevelLiters: Number(this.fuelLevel.toFixed(2)),
      inPit: this.inPit,
      speedKmh: 245,
      trackPosPct: this.trackPosPct
    };

    if (this.sampleCallback) this.sampleCallback(sample);
    return sample;
  }

  public triggerBox(): void {
    this.inPit = true;
    if (this.sampleCallback) {
      this.sampleCallback({
        timestamp: Date.now(),
        carNumber: '144',
        driverName: 'Matty G',
        lapNumber: this.lapNumber,
        fuelLevelLiters: Number(this.fuelLevel.toFixed(2)),
        inPit: true,
        speedKmh: 60,
        trackPosPct: 0.99
      });
    }
  }

  public triggerPitExit(fuelRefillLiters: number = 105): void {
    this.inPit = false;
    this.fuelLevel = fuelRefillLiters;
    if (this.sampleCallback) {
      this.sampleCallback({
        timestamp: Date.now(),
        carNumber: '144',
        driverName: 'Matty G',
        lapNumber: this.lapNumber,
        fuelLevelLiters: this.fuelLevel,
        inPit: false,
        speedKmh: 230,
        trackPosPct: 0.05
      });
    }
  }

  private startSimulation(): void {
    if (this.timer) clearInterval(this.timer);
    const intervalMs = this.isSimulatingFast ? 1000 : 2500;

    this.timer = setInterval(() => {
      if (!this.inPit) {
        this.trackPosPct += this.isSimulatingFast ? 0.2 : 0.04;
        if (this.trackPosPct >= 1.0) {
          this.triggerLap();
        } else {
          if (this.sampleCallback) {
            this.sampleCallback({
              timestamp: Date.now(),
              carNumber: '144',
              driverName: 'Matty G',
              lapNumber: this.lapNumber,
              fuelLevelLiters: Number(this.fuelLevel.toFixed(2)),
              inPit: false,
              speedKmh: 240 + Math.floor(Math.random() * 20),
              trackPosPct: Number(this.trackPosPct.toFixed(2))
            });
          }
        }
      }
    }, intervalMs);
  }
}
