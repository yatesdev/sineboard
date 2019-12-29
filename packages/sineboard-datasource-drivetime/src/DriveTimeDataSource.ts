import { createClient, DirectionsRequest, GoogleMapsClient } from '@google/maps';
import { IDataSource } from '@yatesdev/sineboard-core';
import { Logger } from '@yatesdev/sineboard-log';
import humanizeDuration from 'humanize-duration';
import { promisify } from 'util';

export default class DriveTimeDataSource implements IDataSource {
  name = 'DriveTimeDataSource';
  data: any;
  updateFrequency = '0 */5 * * * *';
  googleClient: GoogleMapsClient;

  options: DirectionsRequest;

  constructor(overrides?: Partial<IDataSourceOverrides>) {
    if (!process.env.GOOGLE_API_KEY) {
      Logger.error('No Google API key found in environment vars');
      return;
    }

    this.googleClient = createClient({
      key: process.env.GOOGLE_API_KEY,
    });

    if (!overrides) { return; }
    this.updateFrequency = overrides.updateFrequency ?? this.updateFrequency;
    this.options = overrides.options;
    this.options.departure_time = 'now';
  }

  async fetch() {
    const getDirections = promisify(this.googleClient.directions);
    const response = (await getDirections(this.options)).json;

    const routeDurations = response.routes.map((route) =>
        route.legs.map((leg) =>
          leg.duration_in_traffic.value).reduce((runningSum, duration) =>
            runningSum + duration, 0));

    const humanReadableDurations = routeDurations.map((durationInSeconds) =>
      shortEnglishHumanizer(Math.round((durationInSeconds * 1000) / 60000) * 60000));

    Logger.silly(`Google DriveTime: ${routeDurations}, ${humanReadableDurations}`);
    this.data = humanReadableDurations[0];
  }
}

const shortEnglishHumanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  languages: {
    shortEn: {
      y: () => 'y',
      mo: () => 'mo',
      w: () => 'w',
      d: () => 'd',
      h: () => 'h',
      m: () => 'm',
      s: () => 's',
      ms: () => 'ms',
    },
  },
  spacer: '',
  delimiter: ' ',
});

interface IDataSourceOverrides {
  updateFrequency: string;
  options: DirectionsRequest;
}
