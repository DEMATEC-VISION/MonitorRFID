// ============================================================================
// Dematec Vision — Emiroglio RFID Personnel Monitoring System
// Demo Dataset, Zone Topology & Persistence Layer
// ============================================================================

const STORAGE_KEY = 'dematec_emiroglio_rfid_v1';

const ZONES = [
  {
    id: 'ZONE_C',
    code: 'ZONE C',
    name: 'Quality Control & Lab',
    shortName: 'QC Lab',
    readerId: 'RDR-PROD-02',
    antennas: ['ANT-C1', 'ANT-C2'],
    readerIp: '10.24.10.22',
    restricted: false,
    capacity: 6,
    color: '#0EA5E9',
    // Isometric map anchor (viewBox 1200 x 680)
    mapX: 465,
    mapY: 225,
    calloutSide: 'left',
    calloutY: 145,
    pinSpread: [
      { dx: -18, dy: 8 }, { dx: 12, dy: -6 }, { dx: 26, dy: 14 }, { dx: -8, dy: 22 }
    ]
  },
  {
    id: 'ZONE_D',
    code: 'ZONE D',
    name: 'Raw Material Warehouse',
    shortName: 'Warehouse',
    readerId: 'RDR-PROD-02',
    antennas: ['ANT-D1', 'ANT-D2'],
    readerIp: '10.24.10.23',
    restricted: false,
    capacity: 10,
    color: '#6366F1',
    mapX: 372,
    mapY: 365,
    calloutSide: 'left',
    calloutY: 280,
    pinSpread: [
      { dx: -20, dy: -8 }, { dx: 14, dy: 6 }, { dx: -6, dy: 20 }, { dx: 24, dy: -12 }
    ]
  },
  {
    id: 'GATE',
    code: 'GATE 01',
    name: 'Main Gate IN/OUT Portal',
    shortName: 'Entry Portal',
    readerId: 'RDR-GATE-01',
    antennas: ['PORTAL-IN', 'PORTAL-OUT'],
    readerIp: '10.24.10.10',
    restricted: false,
    isGate: true,
    capacity: 20,
    color: '#10B981',
    mapX: 435,
    mapY: 485,
    calloutSide: 'left',
    calloutY: 440,
    pinSpread: [
      { dx: -15, dy: 4 }, { dx: 15, dy: -4 }, { dx: 0, dy: 16 }
    ]
  },
  {
    id: 'ZONE_A',
    code: 'ZONE A',
    name: 'Spinning & Weaving Hall',
    shortName: 'Weaving Hall',
    readerId: 'RDR-PROD-01',
    antennas: ['ANT-A1', 'ANT-A2', 'ANT-A3', 'ANT-A4'],
    readerIp: '10.24.10.20',
    restricted: false,
    capacity: 16,
    color: '#F59E0B',
    mapX: 605,
    mapY: 335,
    calloutSide: 'left',
    calloutY: 575,
    pinSpread: [
      { dx: -32, dy: -12 }, { dx: -8, dy: -22 }, { dx: 20, dy: -14 },
      { dx: -24, dy: 14 }, { dx: 6, dy: 6 }, { dx: 34, dy: 12 }, { dx: -4, dy: 28 }
    ]
  },
  {
    id: 'ZONE_B',
    code: 'ZONE B',
    name: 'Dyeing & Finishing Line',
    shortName: 'Dyeing Line',
    readerId: 'RDR-PROD-01',
    antennas: ['ANT-B1', 'ANT-B2'],
    readerIp: '10.24.10.21',
    restricted: false,
    capacity: 12,
    color: '#0284C7',
    mapX: 735,
    mapY: 195,
    calloutSide: 'right',
    calloutY: 145,
    pinSpread: [
      { dx: -22, dy: 6 }, { dx: 10, dy: -10 }, { dx: 26, dy: 14 }, { dx: -6, dy: 24 }
    ]
  },
  {
    id: 'ZONE_E',
    code: 'ZONE E',
    name: 'Maintenance & Utilities',
    shortName: 'Maintenance',
    readerId: 'RDR-PROD-03',
    antennas: ['ANT-E1', 'ANT-E2'],
    readerIp: '10.24.10.24',
    restricted: false,
    capacity: 8,
    color: '#475569',
    mapX: 775,
    mapY: 365,
    calloutSide: 'right',
    calloutY: 325,
    pinSpread: [
      { dx: -16, dy: -6 }, { dx: 16, dy: 8 }, { dx: -4, dy: 20 }
    ]
  },
  {
    id: 'ZONE_F',
    code: 'ZONE F',
    name: 'Chemical & Silo Vault',
    shortName: 'Chemical Vault',
    readerId: 'RDR-PROD-03',
    antennas: ['ANT-F1'],
    readerIp: '10.24.10.25',
    restricted: true,
    capacity: 3,
    color: '#EF4444',
    mapX: 615,
    mapY: 535,
    calloutSide: 'right',
    calloutY: 515,
    pinSpread: [
      { dx: -14, dy: 6 }, { dx: 14, dy: -6 }, { dx: 0, dy: 16 }
    ]
  }
];

const DEFAULT_RULES = {
  outOfZoneMinutes: 15,
  restrictedZoneImmediate: true,
  lateGraceMinutes: 10,
  maxShiftHours: 8.5,
  missingGateScan: true,
  channels: {
    dashboard: true,
    email: true,
    sms: true,
    webhook: false
  }
};

const DEFAULT_EMPLOYEES = [
  {
    id: 'EMP-101',
    name: 'Marco Bellini',
    role: 'Weaving Line Lead',
    department: 'Spinning & Weaving',
    phone: '+40 722 418 201',
    email: 'm.bellini@emiroglio.local',
    emergencyContact: 'Elena Bellini (+40 722 901 112)',
    rfidUid: 'E280-1170-2000-0101',
    defaultZone: 'ZONE_A',
    allowedZones: ['GATE', 'ZONE_A', 'ZONE_C', 'ZONE_D'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 15,
    status: 'on_site',
    currentZone: 'ZONE_A',
    clockInTime: '06:54',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -51,
    hoursToday: 7.4,
    hoursWeek: 37.5,
    defaultZonePct: 94
  },
  {
    id: 'EMP-102',
    name: 'Andrei Ionescu',
    role: 'Loom Operator',
    department: 'Spinning & Weaving',
    phone: '+40 723 551 304',
    email: 'a.ionescu@emiroglio.local',
    emergencyContact: 'Maria Ionescu (+40 723 551 305)',
    rfidUid: 'E280-1170-2000-0102',
    defaultZone: 'ZONE_A',
    allowedZones: ['GATE', 'ZONE_A', 'ZONE_D'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 15,
    status: 'on_site',
    currentZone: 'ZONE_A',
    clockInTime: '06:58',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -54,
    hoursToday: 7.3,
    hoursWeek: 36.8,
    defaultZonePct: 91
  },
  {
    id: 'EMP-103',
    name: 'Elena Georgieva',
    role: 'Spinning Technician',
    department: 'Spinning & Weaving',
    phone: '+359 88 742 1190',
    email: 'e.georgieva@emiroglio.local',
    emergencyContact: 'Petar Georgiev (+359 88 742 1191)',
    rfidUid: 'E280-1170-2000-0103',
    defaultZone: 'ZONE_A',
    allowedZones: ['GATE', 'ZONE_A', 'ZONE_C'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 15,
    status: 'on_site',
    currentZone: 'ZONE_D',
    clockInTime: '06:56',
    clockOutTime: null,
    awayMinutes: 22,
    rssi: -59,
    hoursToday: 7.3,
    hoursWeek: 38.0,
    defaultZonePct: 76
  },
  {
    id: 'EMP-104',
    name: 'Stefan Popescu',
    role: 'Weaving Machine Operator',
    department: 'Spinning & Weaving',
    phone: '+40 744 209 812',
    email: 's.popescu@emiroglio.local',
    emergencyContact: 'Ioana Popescu (+40 744 209 813)',
    rfidUid: 'E280-1170-2000-0104',
    defaultZone: 'ZONE_A',
    allowedZones: ['GATE', 'ZONE_A', 'ZONE_D'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 15,
    status: 'on_site',
    currentZone: 'ZONE_A',
    clockInTime: '07:24',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -52,
    hoursToday: 6.9,
    hoursWeek: 34.2,
    defaultZonePct: 89
  },
  {
    id: 'EMP-105',
    name: 'Radu Dumitru',
    role: 'Yarn Feeder Operator',
    department: 'Spinning & Weaving',
    phone: '+40 745 811 402',
    email: 'r.dumitru@emiroglio.local',
    emergencyContact: 'Dan Dumitru (+40 745 811 400)',
    rfidUid: 'E280-1170-2000-0105',
    defaultZone: 'ZONE_A',
    allowedZones: ['GATE', 'ZONE_A', 'ZONE_D'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 15,
    status: 'on_site',
    currentZone: 'ZONE_A',
    clockInTime: '06:51',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -49,
    hoursToday: 7.5,
    hoursWeek: 39.1,
    defaultZonePct: 95
  },
  {
    id: 'EMP-106',
    name: 'Giulia Conti',
    role: 'Dyeing Process Specialist',
    department: 'Dyeing & Finishing',
    phone: '+39 347 892 4410',
    email: 'g.conti@emiroglio.local',
    emergencyContact: 'Luca Conti (+39 347 892 4411)',
    rfidUid: 'E280-1170-2000-0106',
    defaultZone: 'ZONE_B',
    allowedZones: ['GATE', 'ZONE_B', 'ZONE_C', 'ZONE_F'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 20,
    status: 'on_site',
    currentZone: 'ZONE_B',
    clockInTime: '06:55',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -50,
    hoursToday: 7.4,
    hoursWeek: 38.4,
    defaultZonePct: 92
  },
  {
    id: 'EMP-107',
    name: 'Ivan Dimitrov',
    role: 'Finishing Line Operator',
    department: 'Dyeing & Finishing',
    phone: '+359 89 615 2201',
    email: 'i.dimitrov@emiroglio.local',
    emergencyContact: 'Krasimira Dimitrova (+359 89 615 2202)',
    rfidUid: 'E280-1170-2000-0107',
    defaultZone: 'ZONE_B',
    allowedZones: ['GATE', 'ZONE_B', 'ZONE_D'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 15,
    status: 'on_site',
    currentZone: 'ZONE_F',
    clockInTime: '06:59',
    clockOutTime: null,
    awayMinutes: 6,
    rssi: -47,
    hoursToday: 7.3,
    hoursWeek: 37.2,
    defaultZonePct: 84
  },
  {
    id: 'EMP-108',
    name: 'Cristina Marin',
    role: 'Color Mixing Operator',
    department: 'Dyeing & Finishing',
    phone: '+40 731 609 114',
    email: 'c.marin@emiroglio.local',
    emergencyContact: 'Vlad Marin (+40 731 609 115)',
    rfidUid: 'E280-1170-2000-0108',
    defaultZone: 'ZONE_B',
    allowedZones: ['GATE', 'ZONE_B', 'ZONE_F'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 15,
    status: 'on_site',
    currentZone: 'ZONE_B',
    clockInTime: '06:52',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -55,
    hoursToday: 7.5,
    hoursWeek: 37.9,
    defaultZonePct: 90
  },
  {
    id: 'EMP-109',
    name: 'Alina Vasilescu',
    role: 'Quality Assurance Inspector',
    department: 'Quality Control',
    phone: '+40 726 304 998',
    email: 'a.vasilescu@emiroglio.local',
    emergencyContact: 'Mihai Vasilescu (+40 726 304 999)',
    rfidUid: 'E280-1170-2000-0109',
    defaultZone: 'ZONE_C',
    allowedZones: ['GATE', 'ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 30,
    status: 'on_site',
    currentZone: 'ZONE_C',
    clockInTime: '06:57',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -48,
    hoursToday: 7.3,
    hoursWeek: 37.0,
    defaultZonePct: 86
  },
  {
    id: 'EMP-110',
    name: 'Nikolay Petrov',
    role: 'Textile Lab Analyst',
    department: 'Quality Control',
    phone: '+359 87 904 3312',
    email: 'n.petrov@emiroglio.local',
    emergencyContact: 'Desislava Petrova (+359 87 904 3313)',
    rfidUid: 'E280-1170-2000-0110',
    defaultZone: 'ZONE_C',
    allowedZones: ['GATE', 'ZONE_C', 'ZONE_B'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 20,
    status: 'on_site',
    currentZone: 'ZONE_C',
    clockInTime: '07:02',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -53,
    hoursToday: 7.2,
    hoursWeek: 36.5,
    defaultZonePct: 93
  },
  {
    id: 'EMP-111',
    name: 'Bogdan Stan',
    role: 'Warehouse Coordinator',
    department: 'Logistics & Warehouse',
    phone: '+40 721 884 712',
    email: 'b.stan@emiroglio.local',
    emergencyContact: 'Laura Stan (+40 721 884 713)',
    rfidUid: 'E280-1170-2000-0111',
    defaultZone: 'ZONE_D',
    allowedZones: ['GATE', 'ZONE_D', 'ZONE_A', 'ZONE_B'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 20,
    status: 'on_site',
    currentZone: 'ZONE_D',
    clockInTime: '06:48',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -51,
    hoursToday: 7.5,
    hoursWeek: 38.5,
    defaultZonePct: 88
  },
  {
    id: 'EMP-112',
    name: 'Georgi Kolev',
    role: 'Forklift & Material Handler',
    department: 'Logistics & Warehouse',
    phone: '+359 88 519 6640',
    email: 'g.kolev@emiroglio.local',
    emergencyContact: 'Tanya Koleva (+359 88 519 6641)',
    rfidUid: 'E280-1170-2000-0112',
    defaultZone: 'ZONE_D',
    allowedZones: ['GATE', 'ZONE_D', 'ZONE_A'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 20,
    status: 'on_site',
    currentZone: 'GATE',
    clockInTime: '06:55',
    clockOutTime: null,
    awayMinutes: 4,
    rssi: -56,
    hoursToday: 7.4,
    hoursWeek: 37.8,
    defaultZonePct: 82
  },
  {
    id: 'EMP-113',
    name: 'Daniele Rossi',
    role: 'Senior Maintenance Engineer',
    department: 'Maintenance & Utilities',
    phone: '+39 338 512 9044',
    email: 'd.rossi@emiroglio.local',
    emergencyContact: 'Chiara Rossi (+39 338 512 9045)',
    rfidUid: 'E280-1170-2000-0113',
    defaultZone: 'ZONE_E',
    allowedZones: ['GATE', 'ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D', 'ZONE_E', 'ZONE_F'],
    shiftStart: '06:00',
    shiftEnd: '14:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 45,
    status: 'on_site',
    currentZone: 'ZONE_E',
    clockInTime: '05:52',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -50,
    hoursToday: 9.1,
    hoursWeek: 43.2,
    defaultZonePct: 79
  },
  {
    id: 'EMP-114',
    name: 'Florin Munteanu',
    role: 'Electrical Technician',
    department: 'Maintenance & Utilities',
    phone: '+40 740 198 633',
    email: 'f.munteanu@emiroglio.local',
    emergencyContact: 'Ana Munteanu (+40 740 198 634)',
    rfidUid: 'E280-1170-2000-0114',
    defaultZone: 'ZONE_E',
    allowedZones: ['GATE', 'ZONE_A', 'ZONE_B', 'ZONE_E', 'ZONE_F'],
    shiftStart: '07:00',
    shiftEnd: '15:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 30,
    status: 'on_site',
    currentZone: 'ZONE_E',
    clockInTime: '06:58',
    clockOutTime: null,
    awayMinutes: 0,
    rssi: -53,
    hoursToday: 7.3,
    hoursWeek: 37.6,
    defaultZonePct: 85
  },
  {
    id: 'EMP-115',
    name: 'Maria Stoyanova',
    role: 'Shift II Weaving Operator',
    department: 'Spinning & Weaving',
    phone: '+359 88 201 7743',
    email: 'm.stoyanova@emiroglio.local',
    emergencyContact: 'Boris Stoyanov (+359 88 201 7744)',
    rfidUid: 'E280-1170-2000-0115',
    defaultZone: 'ZONE_A',
    allowedZones: ['GATE', 'ZONE_A', 'ZONE_D'],
    shiftStart: '15:00',
    shiftEnd: '23:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 15,
    status: 'checked_out',
    currentZone: null,
    clockInTime: 'Yesterday 14:55',
    clockOutTime: '23:32',
    awayMinutes: 0,
    rssi: null,
    hoursToday: 0,
    hoursWeek: 34.0,
    defaultZonePct: 96
  },
  {
    id: 'EMP-116',
    name: 'Catalin Neagu',
    role: 'Shift II Dyeing Operator',
    department: 'Dyeing & Finishing',
    phone: '+40 733 912 550',
    email: 'c.neagu@emiroglio.local',
    emergencyContact: 'Raluca Neagu (+40 733 912 551)',
    rfidUid: 'E280-1170-2000-0116',
    defaultZone: 'ZONE_B',
    allowedZones: ['GATE', 'ZONE_B', 'ZONE_D'],
    shiftStart: '15:00',
    shiftEnd: '23:30',
    maxShiftHours: 8.5,
    maxAwayMinutes: 15,
    status: 'checked_out',
    currentZone: null,
    clockInTime: 'Yesterday 14:58',
    clockOutTime: '23:28',
    awayMinutes: 0,
    rssi: null,
    hoursToday: 0,
    hoursWeek: 33.5,
    defaultZonePct: 92
  }
];

const DEFAULT_ATTENDANCE_LOGS = [
  { id: 'LOG-9014', time: '07:24:11', employeeId: 'EMP-104', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'Late Arrival (+24 min)', status: 'late' },
  { id: 'LOG-9013', time: '07:02:18', employeeId: 'EMP-110', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time (within grace)', status: 'on_time' },
  { id: 'LOG-9012', time: '06:59:44', employeeId: 'EMP-107', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9011', time: '06:58:20', employeeId: 'EMP-114', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9010', time: '06:58:02', employeeId: 'EMP-102', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9009', time: '06:57:31', employeeId: 'EMP-109', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9008', time: '06:56:15', employeeId: 'EMP-103', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9007', time: '06:55:49', employeeId: 'EMP-106', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9006', time: '06:55:12', employeeId: 'EMP-112', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9005', time: '06:54:05', employeeId: 'EMP-101', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9004', time: '06:52:40', employeeId: 'EMP-108', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9003', time: '06:51:18', employeeId: 'EMP-105', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9002', time: '06:48:33', employeeId: 'EMP-111', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'On-Time', status: 'on_time' },
  { id: 'LOG-9001', time: '05:52:09', employeeId: 'EMP-113', direction: 'IN', reader: 'RDR-GATE-01 / PORTAL-IN', note: 'Early Shift (Overtime Active)', status: 'overtime' },
  { id: 'LOG-8999', time: 'Yesterday 23:32', employeeId: 'EMP-115', direction: 'OUT', reader: 'RDR-GATE-01 / PORTAL-OUT', note: 'Shift II Complete (8.6h)', status: 'on_time' },
  { id: 'LOG-8998', time: 'Yesterday 23:28', employeeId: 'EMP-116', direction: 'OUT', reader: 'RDR-GATE-01 / PORTAL-OUT', note: 'Shift II Complete (8.5h)', status: 'on_time' }
];

const DEFAULT_ALERTS = [
  {
    id: 'ALT-404',
    time: '14:18:04',
    severity: 'critical',
    type: 'Restricted Zone Entry',
    employeeId: 'EMP-107',
    zoneId: 'ZONE_F',
    message: 'Ivan Dimitrov (Dyeing & Finishing) detected in restricted Zone F — Chemical & Silo Vault without authorization.',
    status: 'active',
    channelsSent: ['Dashboard', 'SMS', 'Email']
  },
  {
    id: 'ALT-403',
    time: '14:06:30',
    severity: 'warning',
    type: 'Out of Default Position',
    employeeId: 'EMP-103',
    zoneId: 'ZONE_D',
    message: 'Elena Georgieva has been in Zone D (Warehouse) for 22 min — exceeds 15 min threshold from default Zone A.',
    status: 'active',
    channelsSent: ['Dashboard', 'Email']
  },
  {
    id: 'ALT-402',
    time: '14:00:12',
    severity: 'warning',
    type: 'Overtime / Max Hours',
    employeeId: 'EMP-113',
    zoneId: 'ZONE_E',
    message: 'Daniele Rossi reached 9.1 hrs active shift duration (limit: 8.5 hrs).',
    status: 'active',
    channelsSent: ['Dashboard', 'Email']
  },
  {
    id: 'ALT-401',
    time: '07:24:11',
    severity: 'info',
    type: 'Late Shift Arrival',
    employeeId: 'EMP-104',
    zoneId: 'GATE',
    message: 'Stefan Popescu clocked IN at 07:24 (24 min past 07:00 shift start; grace period 10 min).',
    status: 'acknowledged',
    channelsSent: ['Dashboard', 'Email']
  }
];

const DEFAULT_DISPATCH_LOG = [
  { time: '14:18:05', channel: 'SMS', recipient: '+40 722 000 911 (Plant Safety)', summary: '[CRITICAL] EMP-107 Ivan Dimitrov entered Restricted Zone F (Chemical Vault).' },
  { time: '14:18:05', channel: 'Email', recipient: 'supervisor@emiroglio.local', summary: '[CRITICAL] Unauthorized RFID Read at ANT-F1 — EMP-107.' },
  { time: '14:06:31', channel: 'Email', recipient: 'weaving-lead@emiroglio.local', summary: '[WARNING] EMP-103 Elena Georgieva outside default Zone A > 15 min (currently Zone D).' },
  { time: '14:00:13', channel: 'Email', recipient: 'hr-attendance@emiroglio.local', summary: '[WARNING] EMP-113 Daniele Rossi exceeded 8.5h daily shift limit (9.1h).' },
  { time: '07:24:12', channel: 'Email', recipient: 'hr-attendance@emiroglio.local', summary: '[INFO] Late IN scan: EMP-104 Stefan Popescu at 07:24:11.' }
];

const DEFAULT_BOM = [
  { id: 1, category: 'RFID Cards', item: 'Printable UHF EPC Gen2 PVC Employee Badges + Holder', qty: 200, unitPrice: 2.5 },
  { id: 2, category: 'IN/OUT Portals', item: 'Directional UHF RFID Gate Portal (4-Port Reader, 2 Antennas, Optical Beam)', qty: 2, unitPrice: 3200 },
  { id: 3, category: 'Zone Readers', item: 'Industrial 4-Port Fixed UHF RFID Reader (IP65, PoE+)', qty: 3, unitPrice: 1450 },
  { id: 4, category: 'Zone Antennas', item: 'Circularly Polarized UHF Panel Antenna (8-9 dBi, IP67) + Bracket & RF Cable', qty: 12, unitPrice: 220 },
  { id: 5, category: 'Enrollment', item: 'Desktop USB UHF RFID Reader / Card Encoder (HR Desk)', qty: 1, unitPrice: 320 },
  { id: 6, category: 'Network', item: 'Industrial Managed PoE+ Switch & Cabling Kit', qty: 1, unitPrice: 950 },
  { id: 7, category: 'Software', item: 'Dematec RFID Monitoring Suite (DB, IN/OUT, Live Map, Reports, Alert Engine)', qty: 1, unitPrice: 8500 },
  { id: 8, category: 'Services', item: 'RF Site Survey, Installation, Calibration, Integration & Staff Training', qty: 1, unitPrice: 3800 }
];

function cloneData(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.employees) && Array.isArray(parsed.alerts)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not load saved state, using defaults.', e);
  }
  return {
    employees: cloneData(DEFAULT_EMPLOYEES),
    attendanceLogs: cloneData(DEFAULT_ATTENDANCE_LOGS),
    alerts: cloneData(DEFAULT_ALERTS),
    dispatchLog: cloneData(DEFAULT_DISPATCH_LOG),
    rules: cloneData(DEFAULT_RULES),
    bom: cloneData(DEFAULT_BOM)
  };
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to persist state to localStorage.', e);
  }
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return loadState();
}
