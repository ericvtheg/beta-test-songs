import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface IRequestAnalytics {
  $device: 'Desktop' | 'Mobile' | 'Tablet' | null;
  $os: ReturnType<typeof parseOS>;
  $browser: ReturnType<typeof parseBrowser>;
  $browser_version: ReturnType<typeof parseBrowserVersion>;
  $ip: string;
  $longitude: string;
  $latitude: string;
  $city: string;
  $country: string;
  timezone: string;
  distinct_id: string;
}

export const Analytics = createParamDecorator(
  (data, ctx: ExecutionContext): IRequestAnalytics => {
    const req = ctx.switchToHttp().getRequest();
    const { headers } = req;
    const userAgent = headers['User-Agent'] ?? headers['user-agent'] ?? '';

    const coalesceDevice = () => {
      if (headers['CloudFront-Is-Desktop-Viewer'] === true) {
        return 'Desktop';
      } else if (headers['CloudFront-Is-Mobile-Viewer'] === true) {
        return 'Mobile';
      } else if (headers['CloudFront-Is-Tablet-Viewer'] === true) {
        return 'Tablet';
      }
      return null;
    };

    return {
      $device: coalesceDevice(),
      $os: parseOS(userAgent),
      $browser: parseBrowser(userAgent),
      $browser_version: parseBrowserVersion(userAgent),
      $ip: headers['CloudFront-Viewer-Address']?.split(':')[0],
      $longitude: headers['CloudFront-Viewer-Longitude'],
      $latitude: headers['CloudFront-Viewer-Latitude'],
      $city: headers['CloudFront-Viewer-City'],
      $country: headers['CloudFront-Viewer-Country-Region-Name'],
      timezone: headers['CloudFront-Viewer-Time-Zone'],
      distinct_id: headers['BtsUuid'],
    };
  },
);

const includes = (str: string, needle: string) => {
  return str.indexOf(needle) !== -1;
};

/**
 * This function detects which browser is running this script.
 * The order of the checks are important since many user agents
 * include key words used in later checks.
 */
const parseBrowser = (user_agent: string) => {
  if (includes(user_agent, ' OPR/')) {
    if (includes(user_agent, 'Mini')) {
      return 'Opera Mini';
    }
    return 'Opera';
  } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
    return 'BlackBerry';
  } else if (
    includes(user_agent, 'IEMobile') ||
    includes(user_agent, 'WPDesktop')
  ) {
    return 'Internet Explorer Mobile';
  } else if (includes(user_agent, 'Edge')) {
    return 'Microsoft Edge';
  } else if (includes(user_agent, 'FBIOS')) {
    return 'Facebook Mobile';
  } else if (includes(user_agent, 'Chrome')) {
    return 'Chrome';
  } else if (includes(user_agent, 'CriOS')) {
    return 'Chrome iOS';
  } else if (
    includes(user_agent, 'UCWEB') ||
    includes(user_agent, 'UCBrowser')
  ) {
    return 'UC Browser';
  } else if (includes(user_agent, 'FxiOS')) {
    return 'Firefox iOS';
  } else if (includes(user_agent, 'Safari')) {
    if (includes(user_agent, 'Mobile')) {
      return 'Mobile Safari';
    }
    return 'Safari';
  } else if (includes(user_agent, 'Android')) {
    return 'Android Mobile';
  } else if (includes(user_agent, 'Konqueror')) {
    return 'Konqueror';
  } else if (includes(user_agent, 'Firefox')) {
    return 'Firefox';
  } else if (includes(user_agent, 'MSIE') || includes(user_agent, 'Trident/')) {
    return 'Internet Explorer';
  } else if (includes(user_agent, 'Gecko')) {
    return 'Mozilla';
  } else {
    return null;
  }
};

/**
 * This function detects which browser version is running this script,
 * parsing major and minor version (e.g., 42.1). User agent strings from:
 * http://www.useragentstring.com/pages/useragentstring.php
 */
const parseBrowserVersion = (userAgent: string) => {
  const browser = parseBrowser(userAgent);
  const versionRegexs = {
    'Internet Explorer Mobile': /rv:(\d+(\.\d+)?)/,
    'Microsoft Edge': /Edge\/(\d+(\.\d+)?)/,
    Chrome: /Chrome\/(\d+(\.\d+)?)/,
    'Chrome iOS': /CriOS\/(\d+(\.\d+)?)/,
    'UC Browser': /(UCBrowser|UCWEB)\/(\d+(\.\d+)?)/,
    Safari: /Version\/(\d+(\.\d+)?)/,
    'Mobile Safari': /Version\/(\d+(\.\d+)?)/,
    Opera: /(Opera|OPR)\/(\d+(\.\d+)?)/,
    Firefox: /Firefox\/(\d+(\.\d+)?)/,
    'Firefox iOS': /FxiOS\/(\d+(\.\d+)?)/,
    Konqueror: /Konqueror:(\d+(\.\d+)?)/,
    BlackBerry: /BlackBerry (\d+(\.\d+)?)/,
    'Android Mobile': /android\s(\d+(\.\d+)?)/,
    'Internet Explorer': /(rv:|MSIE )(\d+(\.\d+)?)/,
    Mozilla: /rv:(\d+(\.\d+)?)/,
  };
  const regex = versionRegexs[browser ?? ''];
  if (regex === undefined) {
    return null;
  }
  const matches = userAgent.match(regex);
  if (!matches) {
    return null;
  }
  return parseFloat(matches[matches.length - 2]);
};

const parseOS = (userAgent: string) => {
  const a = userAgent;
  if (/Windows/i.test(a)) {
    if (/Phone/.test(a) || /WPDesktop/.test(a)) {
      return 'Windows Phone';
    }
    return 'Windows';
  } else if (/(iPhone|iPad|iPod)/.test(a)) {
    return 'iOS';
  } else if (/Android/.test(a)) {
    return 'Android';
  } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
    return 'BlackBerry';
  } else if (/Mac/i.test(a)) {
    return 'macOS';
  } else if (/Linux/.test(a)) {
    return 'Linux';
  } else if (/CrOS/.test(a)) {
    return 'Chrome OS';
  } else {
    return null;
  }
};
