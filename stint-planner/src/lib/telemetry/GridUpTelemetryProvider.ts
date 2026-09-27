import { TelemetryProvider } from './TelemetryProvider';
import { TelemetrySample } from '../../types';

export class GridUpTelemetryProvider implements TelemetryProvider {
  name = 'GRiD UP Live Telemetry Tool';
  isConnected = false;
  private pollInterval: any = null;
  private sampleCallback: ((sample: TelemetrySample) => void) | null = null;
  private statusCallback: ((connected: boolean) => void) | null = null;
  private teamKey: string = 'gridUp_sim';
  private targetCarNumber: string = '144';

  connect(config: { teamKey?: string; carNumber?: string } = {}): Promise<boolean> {
    if (config.teamKey) this.teamKey = config.teamKey;
    if (config.carNumber) this.targetCarNumber = config.carNumber;

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

    const fetchStreams = async () => {
      try {
        const url = `https://grid-up-racedash-default-rtdb.europe-west1.firebasedatabase.app/teams/${this.teamKey}/streams.json`;
        const res = await fetch(url);
        if (!res.ok) return;
        const streams = await res.json();
        if (!streams || typeof streams !== 'object') return;

        const streamIds = Object.keys(streams);
        if (streamIds.length === 0) return;

        let chosenStream = streams[streamIds[0]];
        for (const id of streamIds) {
          const s = streams[id];
          if (s?.telemetry?.carNum === this.targetCarNumber || s?.session?.carNumber === this.targetCarNumber) {
            chosenStream = s;
            break;
          }
        }

        const tel = chosenStream?.telemetry || {};

        if (tel.fuel !== undefined && this.sampleCallback) {
          const sample: TelemetrySample = {
            timestamp: Date.now(),
            carNumber: tel.carNum || this.targetCarNumber,
            driverName: chosenStream?.driverName || (tel.drivers && tel.drivers[tel.playerIdx]?.name) || 'GRiD UP Driver',
            lapNumber: tel.lap || 1,
            lapTimeSeconds: tel.lastLapTime || tel.lastLap || 101.4,
            fuelLevelLiters: Number(tel.fuel.toFixed(2)),
            inPit: tel.inPit === true || tel.inPitLane === true,
            speedKmh: Math.round((tel.speed || 0) * 3.6),
            trackPosPct: tel.progress || 0.5
          };
          this.sampleCallback(sample);
        }
      } catch (err) {
        console.warn('[GridUpTelemetryProvider] polling error:', err);
      }
    };

    fetchStreams();
    this.pollInterval = setInterval(fetchStreams, 1500);
  }
}
