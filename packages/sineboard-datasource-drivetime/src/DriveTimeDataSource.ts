import { createClient, DirectionsRequest, GoogleMapsClient } from '@google/maps';
import { IDataSource } from '@yatesdev/sineboard-core';
import { Logger } from '@yatesdev/sineboard-log';
import humanizeDuration from 'humanize-duration';

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
      key: process.env.GOOGLE_API_KEY || 'AIzaSyBdGRCC8NMdhAF2kSMYEJ6uN2cFwuTb-6k',
    });

    if (!overrides) { return; }
    this.updateFrequency = overrides.updateFrequency ?? this.updateFrequency;
    this.options = overrides.options;
    this.options.departure_time = 'now';
  }

  fetch() {
    // const { json: result } = await this.googleClient.directions(this.options).asPromise();
    this.googleClient.directions(this.options, (err, response) => {
      const routeDurations = response.json.routes.map((route) =>
        route.legs.map((leg) =>
          leg.duration_in_traffic.value).reduce((runningSum, duration) =>
            runningSum + duration, 0));

      const humanReadableDurations = routeDurations.map((durationInSeconds) =>
        shortEnglishHumanizer(Math.round((durationInSeconds * 1000) / 60000) * 60000));

      console.log(routeDurations, humanReadableDurations);
      this.data = humanReadableDurations[0];
    });
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
