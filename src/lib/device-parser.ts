/**
 * Device & User-Agent Parser for SPPG Dapur Enterprise
 * Menghasilkan informasi perangkat yang rapi, profesional, dan mudah dipahami
 * tanpa spam atau raw string yang membingungkan.
 */

export interface ParsedDeviceInfo {
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  deviceName: string;
  browserName: string;
  osName: string;
  ipAddress: string;
}

export function parseUserAgent(uaString: string | null | undefined, ipRaw?: string | null): ParsedDeviceInfo {
  const ua = uaString || '';

  // 1. Deteksi Tipe Perangkat
  let deviceType: 'Mobile' | 'Tablet' | 'Desktop' = 'Desktop';
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // 2. Deteksi OS
  let osName = 'Sistem Operasi Tidak Dikenal';
  if (/Windows NT 10.0/i.test(ua)) osName = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) osName = 'Windows 8.1';
  else if (/Windows NT 6.2/i.test(ua)) osName = 'Windows 8';
  else if (/Windows NT 6.1/i.test(ua)) osName = 'Windows 7';
  else if (/Windows/i.test(ua)) osName = 'Windows';
  else if (/Android\s*([0-9\.]+)?/i.test(ua)) {
    const match = ua.match(/Android\s*([0-9\.]+)/i);
    osName = match ? `Android ${match[1]}` : 'Android';
  } else if (/iPhone OS\s*([0-9_]+)?/i.test(ua)) {
    const match = ua.match(/iPhone OS\s*([0-9_]+)/i);
    osName = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/iPad.*OS\s*([0-9_]+)?/i.test(ua)) {
    const match = ua.match(/OS\s*([0-9_]+)/i);
    osName = match ? `iPadOS ${match[1].replace(/_/g, '.')}` : 'iPadOS';
  } else if (/Mac OS X\s*([0-9_]+)?/i.test(ua)) {
    const match = ua.match(/Mac OS X\s*([0-9_]+)/i);
    osName = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/Linux/i.test(ua)) osName = 'Linux';

  // 3. Deteksi Browser
  let browserName = 'Browser Web';
  if (/Edg\/([0-9\.]+)/i.test(ua)) {
    const match = ua.match(/Edg\/([0-9\.]+)/i);
    browserName = match ? `Microsoft Edge ${match[1].split('.')[0]}` : 'Microsoft Edge';
  } else if (/OPR\/([0-9\.]+)/i.test(ua) || /Opera/i.test(ua)) {
    browserName = 'Opera';
  } else if (/SamsungBrowser\/([0-9\.]+)/i.test(ua)) {
    browserName = 'Samsung Internet';
  } else if (/Chrome\/([0-9\.]+)/i.test(ua)) {
    const match = ua.match(/Chrome\/([0-9\.]+)/i);
    const ver = match ? ` ${match[1].split('.')[0]}` : '';
    browserName = deviceType === 'Mobile' ? `Chrome Mobile${ver}` : `Google Chrome${ver}`;
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    const match = ua.match(/Version\/([0-9\.]+)/i);
    const ver = match ? ` ${match[1].split('.')[0]}` : '';
    browserName = deviceType === 'Mobile' ? `Safari Mobile${ver}` : `Safari${ver}`;
  } else if (/Firefox\/([0-9\.]+)/i.test(ua)) {
    const match = ua.match(/Firefox\/([0-9\.]+)/i);
    browserName = match ? `Firefox ${match[1].split('.')[0]}` : 'Firefox';
  }

  // 4. Deteksi Nama Perangkat Human-Friendly
  let deviceName = 'Perangkat Tidak Dikenal';
  if (/iPhone/i.test(ua)) deviceName = 'Apple iPhone';
  else if (/iPad/i.test(ua)) deviceName = 'Apple iPad';
  else if (/Macintosh|Mac OS/i.test(ua)) deviceName = 'Apple Mac';
  else if (/SM-[A-Za-z0-9]+/i.test(ua) || /Samsung/i.test(ua)) deviceName = 'Samsung Galaxy';
  else if (/Xiaomi|Redmi|POCO/i.test(ua)) deviceName = 'Xiaomi / Redmi';
  else if (/OPPO|CPH[0-9]+/i.test(ua)) deviceName = 'OPPO Smartphone';
  else if (/vivo|V[0-9]{4}/i.test(ua)) deviceName = 'Vivo Smartphone';
  else if (/Realme/i.test(ua)) deviceName = 'Realme Smartphone';
  else if (/Pixel\s*[0-9a-zA-Z]*/i.test(ua)) deviceName = 'Google Pixel';
  else if (deviceType === 'Mobile') deviceName = 'Smartphone Android';
  else if (deviceType === 'Tablet') deviceName = 'Tablet Android';
  else if (/Windows/i.test(ua)) deviceName = 'PC / Laptop Windows';
  else if (/Linux/i.test(ua)) deviceName = 'Komputer Linux';

  // 5. Bersihkan IP Address
  let ipAddress = '127.0.0.1';
  if (ipRaw) {
    const cleanIp = ipRaw.split(',')[0].trim();
    if (cleanIp === '::1' || cleanIp === '::ffff:127.0.0.1') {
      ipAddress = '127.0.0.1 (Lokal)';
    } else {
      ipAddress = cleanIp;
    }
  }

  return {
    deviceType,
    deviceName,
    browserName,
    osName,
    ipAddress,
  };
}
