// ============================================================================
// Dematec Vision — Emiroglio RFID Personnel Monitoring System
// Interactive Front-End Application Logic
// ============================================================================

(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let state = loadState();
  let selectedZoneId = null;
  let simRunning = true;
  let simTimer = null;
  let demoAlertCounter = 0;

  const VIEW_META = {
    map: {
      title: 'Live Production Floor & Real-Time RFID Positioning',
      subtitle: 'UHF RFID Zone Telemetry • Shift I (07:00 – 15:30) • Live antenna tracking'
    },
    attendance: {
      title: 'IN / OUT Gate Attendance Monitor',
      subtitle: 'Directional RFID entry/exit portals • Automated shift hours & tardiness verification'
    },
    employees: {
      title: 'Employee Database & RFID Card Registry',
      subtitle: 'Manage personnel profiles, unique UHF EPC badges, default stations & parameter limits'
    },
    reports: {
      title: 'Hours Worked & Production Zone Reports',
      subtitle: 'Attendance summaries, default-position compliance analytics & CSV/PDF exports'
    },
    alerts: {
      title: 'Automated Parameter Alerts & Notification Engine',
      subtitle: 'Real-time threshold violation tracking, rule configuration & SMS/Email dispatch logs'
    },
    offer: {
      title: 'Client Proposal, Architecture & Commercial BOM',
      subtitle: 'Prepared by Dematec Vision for Emiroglio • Interactive Scope & Cost Estimator'
    }
  };

  // --- Helpers ---
  function getZone(zoneId) {
    return ZONES.find((z) => z.id === zoneId) || null;
  }

  function getEmployee(empId) {
    return state.employees.find((e) => e.id === empId) || null;
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0].toUpperCase())
      .join('');
  }

  function nowTimeStr() {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  }

  function nowShortTime() {
    const d = new Date();
    return d.toTimeString().slice(0, 5);
  }

  function formatEur(n) {
    return '€' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getEmployeeTelemetryStatus(emp) {
    if (emp.status !== 'on_site' || !emp.currentZone) {
      return { level: 'out', label: 'Checked Out', badgeClass: 'badge-neutral' };
    }
    const zone = getZone(emp.currentZone);
    const isUnauthorized = !emp.allowedZones.includes(emp.currentZone);
    if ((zone && zone.restricted && isUnauthorized) || isUnauthorized) {
      return { level: 'danger', label: 'Unauthorized Zone', badgeClass: 'badge-danger' };
    }
    const maxAway = emp.maxAwayMinutes || state.rules.outOfZoneMinutes;
    if (emp.currentZone !== emp.defaultZone && emp.awayMinutes > maxAway) {
      return { level: 'warn', label: `Away ${emp.awayMinutes}m (> ${maxAway}m)`, badgeClass: 'badge-warn' };
    }
    const maxHrs = emp.maxShiftHours || state.rules.maxShiftHours;
    if (emp.hoursToday > maxHrs) {
      return { level: 'warn', label: `Overtime (${emp.hoursToday.toFixed(1)}h)`, badgeClass: 'badge-warn' };
    }
    if (emp.currentZone !== emp.defaultZone) {
      return { level: 'info', label: `In ${zone ? zone.shortName : emp.currentZone} (${emp.awayMinutes}m)`, badgeClass: 'badge-info' };
    }
    return { level: 'ok', label: 'On Default Position', badgeClass: 'badge-ok' };
  }

  function showToast(title, body, variant = 'warn') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${variant}`;
    el.innerHTML = `<div style="font-weight:700;margin-bottom:2px;">${escapeHtml(title)}</div><div style="opacity:.92">${escapeHtml(body)}</div>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      el.style.transition = 'all 0.25s ease';
      setTimeout(() => el.remove(), 260);
    }, 4800);
  }

  function pushAlert({ severity, type, employeeId, zoneId, message }) {
    const id = 'ALT-' + (405 + state.alerts.length);
    const time = nowTimeStr();
    const channels = [];
    if (state.rules.channels.dashboard) channels.push('Dashboard');
    if (state.rules.channels.email) channels.push('Email');
    if (state.rules.channels.sms && severity === 'critical') channels.push('SMS');
    if (state.rules.channels.webhook) channels.push('Webhook');

    const newAlert = {
      id,
      time,
      severity,
      type,
      employeeId,
      zoneId,
      message,
      status: 'active',
      channelsSent: channels
    };
    state.alerts.unshift(newAlert);

    channels.forEach((ch) => {
      if (ch === 'Dashboard') return;
      state.dispatchLog.unshift({
        time,
        channel: ch,
        recipient: ch === 'SMS' ? '+40 722 000 911 (Plant Safety)' : 'supervisor@emiroglio.local',
        summary: `[${severity.toUpperCase()}] ${type}: ${message}`
      });
    });

    saveState(state);
    if (state.rules.channels.dashboard) {
      showToast(`${severity === 'critical' ? '🚨' : '⚠️'} ${type}`, message, severity === 'critical' ? 'critical' : 'warn');
    }
  }

  // --- Navigation ---
  function switchView(viewName) {
    document.querySelectorAll('.view-panel').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    const panel = document.getElementById('view-' + viewName);
    const btn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');

    const meta = VIEW_META[viewName] || VIEW_META.map;
    document.getElementById('topbarTitle').textContent = meta.title;
    document.getElementById('topbarSubtitle').textContent = meta.subtitle;

    renderAll();
  }

  // --- SVG Isometric Map Rendering ---
  function renderIsometricMap() {
    const antennaLayer = document.getElementById('svgAntennaLayer');
    const calloutsLayer = document.getElementById('svgCalloutsLayer');
    const pinsLayer = document.getElementById('svgEmployeePinsLayer');
    const statusFilter = document.getElementById('mapStatusFilter').value;

    antennaLayer.innerHTML = '';
    calloutsLayer.innerHTML = '';
    pinsLayer.innerHTML = '';

    // Highlight selected 3D building group
    document.querySelectorAll('#isometricMapSvg .zone-group').forEach((g) => {
      g.classList.toggle('selected', g.dataset.zone === selectedZoneId);
    });

    const onSiteEmployees = state.employees.filter((e) => e.status === 'on_site' && e.currentZone);

    // 1. Render RFID Antennas + Coverage Rings + Clean Horizontal Leader Callouts
    ZONES.forEach((zone) => {
      const zoneEmps = onSiteEmployees.filter((e) => e.currentZone === zone.id);
      const hasDanger = zoneEmps.some((e) => getEmployeeTelemetryStatus(e).level === 'danger');
      const hasWarn = zoneEmps.some((e) => getEmployeeTelemetryStatus(e).level === 'warn');

      const ringColor = hasDanger ? '#ef4444' : hasWarn ? '#f59e0b' : zone.isGate ? '#10b981' : '#0ea5e9';

      // Pulsing RFID signal wave at antenna center
      const antG = document.createElementNS(SVG_NS, 'g');
      antG.style.cursor = 'pointer';
      antG.addEventListener('click', () => selectZone(zone.id));

      const pulse = document.createElementNS(SVG_NS, 'circle');
      pulse.setAttribute('cx', zone.mapX);
      pulse.setAttribute('cy', zone.mapY);
      pulse.setAttribute('r', hasDanger ? '26' : '22');
      pulse.setAttribute('fill', 'none');
      pulse.setAttribute('stroke', ringColor);
      pulse.setAttribute('stroke-width', hasDanger ? '2.5' : '1.8');
      pulse.setAttribute('class', hasDanger ? 'rfid-pulse-danger' : 'rfid-pulse');
      antG.appendChild(pulse);

      // Static antenna coverage ring
      const staticRing = document.createElementNS(SVG_NS, 'circle');
      staticRing.setAttribute('cx', zone.mapX);
      staticRing.setAttribute('cy', zone.mapY);
      staticRing.setAttribute('r', '18');
      staticRing.setAttribute('fill', ringColor);
      staticRing.setAttribute('fill-opacity', hasDanger ? '0.16' : '0.09');
      staticRing.setAttribute('stroke', ringColor);
      staticRing.setAttribute('stroke-width', '1.4');
      staticRing.setAttribute('stroke-dasharray', zone.restricted ? '4,3' : 'none');
      antG.appendChild(staticRing);

      // Antenna core dot
      const core = document.createElementNS(SVG_NS, 'circle');
      core.setAttribute('cx', zone.mapX);
      core.setAttribute('cy', zone.mapY);
      core.setAttribute('r', '4');
      core.setAttribute('fill', ringColor);
      antG.appendChild(core);

      antennaLayer.appendChild(antG);

      // Clean Horizontal Leader-Line Callout (signature look from reference screenshot)
      const isLeft = zone.calloutSide === 'left';
      const boxW = 216;
      const boxH = 48;
      const boxX = isLeft ? 16 : 1200 - 16 - boxW;
      const boxY = zone.calloutY - boxH / 2;
      const lineStartX = isLeft ? boxX + boxW : boxX;
      const elbowX = isLeft ? Math.min(zone.mapX - 24, boxX + boxW + 34) : Math.max(zone.mapX + 24, boxX - 34);

      const callG = document.createElementNS(SVG_NS, 'g');
      callG.setAttribute('class', 'callout-box');
      callG.addEventListener('click', () => selectZone(zone.id));

      // Leader line path
      const path = document.createElementNS(SVG_NS, 'polyline');
      path.setAttribute('points', `${lineStartX},${zone.calloutY} ${elbowX},${zone.calloutY} ${zone.mapX},${zone.mapY}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', hasDanger ? '#ef4444' : selectedZoneId === zone.id ? '#f59e0b' : '#94a3b8');
      path.setAttribute('stroke-width', hasDanger || selectedZoneId === zone.id ? '1.8' : '1.15');
      callG.appendChild(path);

      // Callout card background
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('class', 'callout-bg');
      rect.setAttribute('x', boxX);
      rect.setAttribute('y', boxY);
      rect.setAttribute('width', boxW);
      rect.setAttribute('height', boxH);
      rect.setAttribute('rx', '8');
      rect.setAttribute('fill', hasDanger ? '#fef2f2' : selectedZoneId === zone.id ? '#fffbeb' : '#ffffff');
      rect.setAttribute('stroke', hasDanger ? '#ef4444' : selectedZoneId === zone.id ? '#f59e0b' : '#cbd5e1');
      rect.setAttribute('stroke-width', hasDanger || selectedZoneId === zone.id ? '1.6' : '1');
      callG.appendChild(rect);

      // Status pill bar on left edge of callout
      const accent = document.createElementNS(SVG_NS, 'rect');
      accent.setAttribute('x', boxX);
      accent.setAttribute('y', boxY);
      accent.setAttribute('width', '5');
      accent.setAttribute('height', boxH);
      accent.setAttribute('rx', '3');
      accent.setAttribute('fill', ringColor);
      callG.appendChild(accent);

      // Title text
      const titleTxt = document.createElementNS(SVG_NS, 'text');
      titleTxt.setAttribute('x', boxX + 14);
      titleTxt.setAttribute('y', boxY + 19);
      titleTxt.setAttribute('font-size', '12');
      titleTxt.setAttribute('font-weight', '700');
      titleTxt.setAttribute('fill', '#0f172a');
      titleTxt.textContent = `${zone.code} • ${zone.shortName}`;
      callG.appendChild(titleTxt);

      // Status subtext
      const subTxt = document.createElementNS(SVG_NS, 'text');
      subTxt.setAttribute('x', boxX + 14);
      subTxt.setAttribute('y', boxY + 36);
      subTxt.setAttribute('font-size', '11');
      subTxt.setAttribute('font-weight', hasDanger ? '700' : '500');
      subTxt.setAttribute('fill', hasDanger ? '#dc2626' : hasWarn ? '#b45309' : '#475569');
      const statusLabel = hasDanger
        ? `ALERT: Unauthorized (${zoneEmps.length})`
        : hasWarn
        ? `${zoneEmps.length} Active • Threshold Warn`
        : zone.restricted
        ? `Restricted • ${zoneEmps.length} Clear`
        : `${zoneEmps.length} Staff • ${zone.antennas.length} Ant OK`;
      subTxt.textContent = statusLabel;
      callG.appendChild(subTxt);

      calloutsLayer.appendChild(callG);
    });

    // 2. Render Live Moving Employee Pins on the Isometric Floor
    const byZoneIndex = {};
    onSiteEmployees.forEach((emp) => {
      const tel = getEmployeeTelemetryStatus(emp);
      if (statusFilter === 'ok' && tel.level !== 'ok') return;
      if (statusFilter === 'alert' && tel.level === 'ok') return;
      if (selectedZoneId && emp.currentZone !== selectedZoneId) return;

      const zone = getZone(emp.currentZone);
      if (!zone) return;

      const idx = byZoneIndex[zone.id] || 0;
      byZoneIndex[zone.id] = idx + 1;
      const spread = zone.pinSpread[idx % zone.pinSpread.length] || { dx: 0, dy: 0 };
      const px = zone.mapX + spread.dx;
      const py = zone.mapY + spread.dy;

      const fillMap = { ok: '#059669', info: '#0284c7', warn: '#d97706', danger: '#dc2626' };
      const pinColor = fillMap[tel.level] || '#0f172a';

      const pinG = document.createElementNS(SVG_NS, 'g');
      pinG.setAttribute('class', 'emp-pin');
      pinG.setAttribute('transform', `translate(${px}, ${py})`);
      pinG.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openTelemetryDrawer(emp.id);
      });

      const titleEl = document.createElementNS(SVG_NS, 'title');
      titleEl.textContent = `${emp.name} (${emp.id})\nZone: ${zone.name}\nStatus: ${tel.label}\nRFID: ${emp.rfidUid}`;
      pinG.appendChild(titleEl);

      if (tel.level === 'danger') {
        const alarmRing = document.createElementNS(SVG_NS, 'circle');
        alarmRing.setAttribute('r', '18');
        alarmRing.setAttribute('fill', 'none');
        alarmRing.setAttribute('stroke', '#ef4444');
        alarmRing.setAttribute('stroke-width', '2.2');
        alarmRing.setAttribute('class', 'rfid-pulse-danger');
        pinG.appendChild(alarmRing);
      }

      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('class', 'emp-pin-circle');
      circle.setAttribute('r', '13');
      circle.setAttribute('fill', pinColor);
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2.5');
      circle.setAttribute('filter', 'url(#pinShadow)');
      pinG.appendChild(circle);

      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('y', '4');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '9.5');
      label.setAttribute('font-weight', '700');
      label.setAttribute('fill', '#ffffff');
      label.textContent = initials(emp.name);
      pinG.appendChild(label);

      pinsLayer.appendChild(pinG);
    });
  }

  function selectZone(zoneId) {
    selectedZoneId = selectedZoneId === zoneId ? null : zoneId;
    document.getElementById('btnClearZoneFilter').style.display = selectedZoneId ? 'inline-flex' : 'none';
    renderIsometricMap();
    renderMapSidePanel();
  }

  function renderMapSidePanel() {
    const titleEl = document.getElementById('sideZoneTitle');
    const badgeEl = document.getElementById('sideZoneBadge');
    const detailBox = document.getElementById('zoneDetailBox');
    const rosterList = document.getElementById('liveRosterList');

    let emps = state.employees.filter((e) => e.status === 'on_site');
    if (selectedZoneId) {
      const z = getZone(selectedZoneId);
      emps = emps.filter((e) => e.currentZone === selectedZoneId);
      titleEl.textContent = `${z.code} — ${z.shortName}`;
      badgeEl.textContent = `${emps.length} Active`;
      badgeEl.className = z.restricted && emps.some((e) => !e.allowedZones.includes(z.id)) ? 'badge badge-danger' : 'badge badge-info';
      detailBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:13px;">${escapeHtml(z.name)}</strong>
          ${z.restricted ? '<span class="badge badge-danger">Restricted</span>' : '<span class="badge badge-ok">Online</span>'}
        </div>
        <div class="zone-meta-grid">
          <div class="zone-meta-item"><span>Fixed Reader</span><strong>${z.readerId}</strong></div>
          <div class="zone-meta-item"><span>Reader IP</span><strong>${z.readerIp}</strong></div>
          <div class="zone-meta-item"><span>Antennas</span><strong>${z.antennas.join(', ')}</strong></div>
          <div class="zone-meta-item"><span>Zone Load</span><strong>${emps.length} / ${z.capacity}</strong></div>
        </div>
      `;
    } else {
      titleEl.textContent = 'Live On-Site Roster';
      badgeEl.textContent = `${emps.length} Active`;
      badgeEl.className = 'badge badge-info';
      detailBox.innerHTML = `
        <div style="font-size:12px;color:var(--text-secondary);">
          Click any <strong>3D zone building</strong> or <strong>callout</strong> to inspect antenna health, or click a worker below for live RFID telemetry.
        </div>
      `;
    }

    // Sort alerts first
    const weight = { danger: 0, warn: 1, info: 2, ok: 3, out: 4 };
    emps.sort((a, b) => weight[getEmployeeTelemetryStatus(a).level] - weight[getEmployeeTelemetryStatus(b).level]);

    if (!emps.length) {
      rosterList.innerHTML = `<div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:12.5px;">No personnel currently detected in this zone.</div>`;
      return;
    }

    rosterList.innerHTML = emps
      .map((emp) => {
        const tel = getEmployeeTelemetryStatus(emp);
        const curZ = getZone(emp.currentZone);
        const defZ = getZone(emp.defaultZone);
        const rowClass = tel.level === 'danger' ? 'alert-danger' : tel.level === 'warn' ? 'alert-warn' : '';
        return `
          <div class="roster-item ${rowClass}" data-emp-id="${emp.id}">
            <div class="avatar ${tel.level}">${initials(emp.name)}</div>
            <div class="roster-info">
              <div class="roster-name">${escapeHtml(emp.name)}</div>
              <div class="roster-sub">${curZ ? curZ.code : '-'} (Default: ${defZ ? defZ.code : '-'}) • ${emp.rssi || -52} dBm</div>
            </div>
            <span class="badge ${tel.badgeClass}">${escapeHtml(tel.label)}</span>
          </div>
        `;
      })
      .join('');

    rosterList.querySelectorAll('.roster-item').forEach((el) => {
      el.addEventListener('click', () => openTelemetryDrawer(el.dataset.empId));
    });
  }

  // --- KPIs & Sidebar Badges ---
  function renderKPIs() {
    const onSite = state.employees.filter((e) => e.status === 'on_site');
    const onStation = onSite.filter((e) => e.currentZone === e.defaultZone);
    const outOfZone = onSite.filter((e) => e.currentZone !== e.defaultZone);
    const activeAlerts = state.alerts.filter((a) => a.status === 'active');
    const avgHrs = onSite.length ? onSite.reduce((s, e) => s + (e.hoursToday || 0), 0) / onSite.length : 0;

    document.getElementById('kpiOnSite').textContent = onSite.length;
    document.getElementById('kpiOnSiteMeta').textContent = `of ${state.employees.length} registered RFID cards`;
    document.getElementById('kpiOnStation').textContent = onStation.length;
    const pct = onSite.length ? Math.round((onStation.length / onSite.length) * 100) : 0;
    document.getElementById('kpiOnStationMeta').textContent = `${pct}% default station compliance`;
    document.getElementById('kpiOutOfZone').textContent = outOfZone.length;
    document.getElementById('kpiActiveAlerts').textContent = activeAlerts.length;
    document.getElementById('kpiAvgHours').textContent = avgHrs.toFixed(1) + 'h';

    document.getElementById('navOnSiteCount').textContent = onSite.length;
    document.getElementById('navTotalEmp').textContent = state.employees.length;
    const alertBadge = document.getElementById('navAlertBadge');
    alertBadge.textContent = activeAlerts.length;
    alertBadge.style.display = activeAlerts.length > 0 ? 'inline-block' : 'none';
  }

  // --- VIEW 2: Attendance IN / OUT ---
  function renderAttendance() {
    const simSelect = document.getElementById('simEmpSelect');
    const currentSel = simSelect.value;
    simSelect.innerHTML = state.employees
      .map((e) => `<option value="${e.id}">${escapeHtml(e.name)} (${e.id}) — ${e.status === 'on_site' ? 'On-Site' : 'Out'}</option>`)
      .join('');
    if (currentSel && getEmployee(currentSel)) simSelect.value = currentSel;

    const onSiteCount = state.employees.filter((e) => e.status === 'on_site').length;
    const outCount = state.employees.length - onSiteCount;
    const lateCount = state.attendanceLogs.filter((l) => l.status === 'late').length;
    const otCount = state.employees.filter((e) => e.hoursToday > (e.maxShiftHours || state.rules.maxShiftHours)).length;

    document.getElementById('attClockedIn').textContent = onSiteCount;
    document.getElementById('attClockedOut').textContent = outCount;
    document.getElementById('attLateCount').textContent = lateCount;
    document.getElementById('attOvertimeCount').textContent = otCount;

    const q = (document.getElementById('attSearch').value || '').toLowerCase();
    const dirFilter = document.getElementById('attDirFilter').value;

    const filtered = state.attendanceLogs.filter((log) => {
      const emp = getEmployee(log.employeeId);
      if (dirFilter !== 'all' && log.direction !== dirFilter) return false;
      if (q) {
        const hay = `${emp ? emp.name : ''} ${emp ? emp.rfidUid : ''} ${log.employeeId} ${log.note}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = filtered
      .map((log) => {
        const emp = getEmployee(log.employeeId) || { name: log.employeeId, department: '-', rfidUid: '-' };
        const dirBadge = log.direction === 'IN' ? '<span class="badge badge-ok">➔ IN</span>' : '<span class="badge badge-neutral">← OUT</span>';
        const statusBadge =
          log.status === 'late'
            ? `<span class="badge badge-warn">${escapeHtml(log.note)}</span>`
            : log.status === 'overtime'
            ? `<span class="badge badge-danger">${escapeHtml(log.note)}</span>`
            : `<span class="badge badge-ok">${escapeHtml(log.note)}</span>`;
        return `
          <tr>
            <td class="mono"><strong>${escapeHtml(log.time)}</strong></td>
            <td>${dirBadge}</td>
            <td><strong>${escapeHtml(emp.name)}</strong> <span style="color:var(--text-muted);font-size:11.5px;">(${escapeHtml(log.employeeId)})</span></td>
            <td>${escapeHtml(emp.department)}</td>
            <td class="mono">${escapeHtml(emp.rfidUid)}</td>
            <td class="mono" style="color:var(--text-secondary);">${escapeHtml(log.reader)}</td>
            <td>${statusBadge}</td>
          </tr>
        `;
      })
      .join('');
  }

  function simulateGateScan() {
    const empId = document.getElementById('simEmpSelect').value;
    const direction = document.getElementById('simDirectionSelect').value;
    const timeVal = document.getElementById('simTimeInput').value || nowShortTime();
    const emp = getEmployee(empId);
    if (!emp) return;

    let status = 'on_time';
    let note = direction === 'IN' ? 'On-Time Gate Scan' : `Shift Checkout (${emp.hoursToday.toFixed(1)}h logged)`;

    if (direction === 'IN') {
      emp.status = 'on_site';
      emp.currentZone = emp.defaultZone;
      emp.clockInTime = timeVal;
      emp.clockOutTime = null;
      emp.awayMinutes = 0;
      emp.rssi = -50;
      if (emp.hoursToday === 0) emp.hoursToday = 0.2;

      // Check late arrival vs shiftStart
      const [sh, sm] = (emp.shiftStart || '07:00').split(':').map(Number);
      const [th, tm] = timeVal.split(':').map(Number);
      const diffMin = th * 60 + tm - (sh * 60 + sm);
      if (diffMin > state.rules.lateGraceMinutes) {
        status = 'late';
        note = `Late Arrival (+${diffMin} min)`;
        pushAlert({
          severity: 'warning',
          type: 'Late Shift Arrival',
          employeeId: emp.id,
          zoneId: 'GATE',
          message: `${emp.name} clocked IN at ${timeVal} (+${diffMin} min past ${emp.shiftStart} shift start).`
        });
      } else {
        showToast('✅ RFID Gate IN Verified', `${emp.name} entered facility (${emp.rfidUid}). Positioned in ${getZone(emp.defaultZone).shortName}.`, 'ok');
      }
    } else {
      emp.status = 'checked_out';
      emp.currentZone = null;
      emp.clockOutTime = timeVal;
      emp.awayMinutes = 0;
      emp.rssi = null;
      showToast('🚪 RFID Gate OUT Verified', `${emp.name} exited facility at ${timeVal}.`, 'ok');
    }

    state.attendanceLogs.unshift({
      id: 'LOG-' + (9020 + state.attendanceLogs.length),
      time: `${timeVal}:${String(new Date().getSeconds()).padStart(2, '0')}`,
      employeeId: emp.id,
      direction,
      reader: direction === 'IN' ? 'RDR-GATE-01 / PORTAL-IN' : 'RDR-GATE-01 / PORTAL-OUT',
      note,
      status
    });

    saveState(state);
    renderAll();
  }

  // --- VIEW 3: Employee Database ---
  function renderEmployees() {
    const zoneFilterEl = document.getElementById('empZoneFilter');
    if (zoneFilterEl.options.length <= 1) {
      ZONES.filter((z) => !z.isGate).forEach((z) => {
        const opt = document.createElement('option');
        opt.value = z.id;
        opt.textContent = `${z.code} — ${z.shortName}`;
        zoneFilterEl.appendChild(opt);
      });
    }

    const q = (document.getElementById('empSearch').value || '').toLowerCase();
    const dept = document.getElementById('empDeptFilter').value;
    const zFilter = zoneFilterEl.value;

    const filtered = state.employees.filter((e) => {
      if (dept !== 'all' && e.department !== dept) return false;
      if (zFilter !== 'all' && e.defaultZone !== zFilter) return false;
      if (q) {
        const hay = `${e.id} ${e.name} ${e.role} ${e.rfidUid} ${e.phone} ${e.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const tbody = document.getElementById('employeesTableBody');
    tbody.innerHTML = filtered
      .map((emp) => {
        const defZ = getZone(emp.defaultZone);
        const tel = getEmployeeTelemetryStatus(emp);
        return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="avatar ${tel.level}">${initials(emp.name)}</div>
                <div>
                  <strong>${escapeHtml(emp.name)}</strong>
                  <div style="font-size:11.5px;color:var(--text-muted);">${escapeHtml(emp.id)} • ${escapeHtml(emp.role)}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-size:12.5px;">${escapeHtml(emp.phone || '-')}</div>
              <div style="font-size:11.5px;color:var(--text-muted);">${escapeHtml(emp.email || '-')}</div>
            </td>
            <td>
              <span class="mono" style="background:var(--bg-muted);padding:3px 7px;border-radius:5px;font-weight:600;">${escapeHtml(emp.rfidUid)}</span>
            </td>
            <td>
              <strong>${defZ ? escapeHtml(defZ.code) : '-'}</strong>
              <div style="font-size:11.5px;color:var(--text-muted);">${defZ ? escapeHtml(defZ.shortName) : ''}</div>
            </td>
            <td style="font-size:12px;">
              <div>Shift ${escapeHtml(emp.shiftStart)} • Max ${emp.maxShiftHours}h</div>
              <div style="color:var(--text-muted);">Away limit: ${emp.maxAwayMinutes} min</div>
            </td>
            <td><span class="badge ${tel.badgeClass}">${escapeHtml(tel.label)}</span></td>
            <td style="text-align:right;white-space:nowrap;">
              <button class="btn btn-outline btn-sm" data-action="inspect" data-id="${emp.id}">Inspect</button>
              <button class="btn btn-outline btn-sm" data-action="edit" data-id="${emp.id}">Edit</button>
              <button class="btn btn-danger-soft btn-sm" data-action="delete" data-id="${emp.id}">✕</button>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === 'inspect') openTelemetryDrawer(id);
        if (action === 'edit') openEmployeeModal(id);
        if (action === 'delete') {
          if (confirm(`Remove employee ${id} and deactivate their RFID card?`)) {
            state.employees = state.employees.filter((e) => e.id !== id);
            saveState(state);
            showToast('Employee Removed', `Record ${id} removed from database.`, 'ok');
            renderAll();
          }
        }
      });
    });
  }

  function openEmployeeModal(empId = null) {
    const defZoneSelect = document.getElementById('formEmpDefaultZone');
    defZoneSelect.innerHTML = ZONES.filter((z) => !z.isGate)
      .map((z) => `<option value="${z.id}">${z.code} — ${z.name}</option>`)
      .join('');

    const allowedWrap = document.getElementById('formAllowedZones');
    const emp = empId ? getEmployee(empId) : null;
    const defaultAllowed = emp ? emp.allowedZones : ['GATE', 'ZONE_A', 'ZONE_D'];

    allowedWrap.innerHTML = ZONES.map(
      (z) => `
      <label class="zone-check-pill">
        <input type="checkbox" value="${z.id}" ${defaultAllowed.includes(z.id) ? 'checked' : ''} />
        ${z.code} (${z.shortName})${z.restricted ? ' 🔒' : ''}
      </label>
    `
    ).join('');

    document.getElementById('empModalTitle').textContent = emp ? `Edit Employee — ${emp.name}` : 'Register New Employee & Assign RFID Card';
    document.getElementById('formEmpOriginalId').value = emp ? emp.id : '';
    const nextNum = 101 + state.employees.length;
    document.getElementById('formEmpId').value = emp ? emp.id : `EMP-${nextNum}`;
    document.getElementById('formEmpName').value = emp ? emp.name : '';
    document.getElementById('formEmpDept').value = emp ? emp.department : 'Spinning & Weaving';
    document.getElementById('formEmpRole').value = emp ? emp.role : '';
    document.getElementById('formEmpPhone').value = emp ? emp.phone : '';
    document.getElementById('formEmpEmail').value = emp ? emp.email : '';
    document.getElementById('formEmpEmergency').value = emp ? emp.emergencyContact : '';
    document.getElementById('formEmpRfid').value = emp ? emp.rfidUid : generateEpc();
    document.getElementById('formEmpDefaultZone').value = emp ? emp.defaultZone : 'ZONE_A';
    document.getElementById('formEmpMaxAway').value = emp ? emp.maxAwayMinutes : state.rules.outOfZoneMinutes;
    document.getElementById('formEmpShiftStart').value = emp ? emp.shiftStart : '07:00';
    document.getElementById('formEmpMaxHours').value = emp ? emp.maxShiftHours : state.rules.maxShiftHours;

    document.getElementById('empModalBackdrop').classList.add('open');
  }

  function closeEmployeeModal() {
    document.getElementById('empModalBackdrop').classList.remove('open');
  }

  function generateEpc() {
    const rand = Math.floor(1000 + Math.random() * 8999);
    return `E280-1170-2000-${rand}`;
  }

  function handleEmployeeFormSubmit(ev) {
    ev.preventDefault();
    const originalId = document.getElementById('formEmpOriginalId').value;
    const defaultZone = document.getElementById('formEmpDefaultZone').value;
    const allowedZones = Array.from(document.querySelectorAll('#formAllowedZones input:checked')).map((i) => i.value);
    if (!allowedZones.includes(defaultZone)) allowedZones.push(defaultZone);
    if (!allowedZones.includes('GATE')) allowedZones.push('GATE');

    const payload = {
      id: document.getElementById('formEmpId').value.trim(),
      name: document.getElementById('formEmpName').value.trim(),
      department: document.getElementById('formEmpDept').value,
      role: document.getElementById('formEmpRole').value.trim(),
      phone: document.getElementById('formEmpPhone').value.trim(),
      email: document.getElementById('formEmpEmail').value.trim(),
      emergencyContact: document.getElementById('formEmpEmergency').value.trim(),
      rfidUid: document.getElementById('formEmpRfid').value.trim(),
      defaultZone,
      allowedZones,
      shiftStart: document.getElementById('formEmpShiftStart').value || '07:00',
      shiftEnd: '15:30',
      maxShiftHours: parseFloat(document.getElementById('formEmpMaxHours').value) || 8.5,
      maxAwayMinutes: parseInt(document.getElementById('formEmpMaxAway').value, 10) || 15
    };

    if (originalId) {
      const idx = state.employees.findIndex((e) => e.id === originalId);
      if (idx >= 0) {
        state.employees[idx] = { ...state.employees[idx], ...payload };
      }
      showToast('Profile Updated', `${payload.name} (${payload.rfidUid}) saved.`, 'ok');
    } else {
      state.employees.push({
        ...payload,
        status: 'on_site',
        currentZone: payload.defaultZone,
        clockInTime: nowShortTime(),
        clockOutTime: null,
        awayMinutes: 0,
        rssi: -51,
        hoursToday: 0.5,
        hoursWeek: 0.5,
        defaultZonePct: 100
      });
      showToast('RFID Card Issued', `${payload.name} registered & active in ${getZone(payload.defaultZone).shortName}.`, 'ok');
    }

    saveState(state);
    closeEmployeeModal();
    renderAll();
  }

  // --- Telemetry Slide-Over Drawer ---
  function openTelemetryDrawer(empId) {
    const emp = getEmployee(empId);
    if (!emp) return;
    const tel = getEmployeeTelemetryStatus(emp);
    const curZ = getZone(emp.currentZone);
    const defZ = getZone(emp.defaultZone);

    const body = document.getElementById('telemetryDrawerBody');
    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
        <div class="avatar ${tel.level}" style="width:48px;height:48px;font-size:16px;">${initials(emp.name)}</div>
        <div>
          <div style="font-size:17px;font-weight:800;">${escapeHtml(emp.name)}</div>
          <div style="font-size:12.5px;color:var(--text-muted);">${escapeHtml(emp.role)} • ${escapeHtml(emp.department)}</div>
          <div style="margin-top:6px;"><span class="badge ${tel.badgeClass}">${escapeHtml(tel.label)}</span></div>
        </div>
      </div>

      <div style="background:var(--bg-subtle);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:16px;">
        <div class="drawer-kv"><span>Employee ID</span><strong class="mono">${escapeHtml(emp.id)}</strong></div>
        <div class="drawer-kv"><span>RFID EPC Card</span><strong class="mono">${escapeHtml(emp.rfidUid)}</strong></div>
        <div class="drawer-kv"><span>Current Zone</span><strong>${curZ ? `${curZ.code} — ${curZ.shortName}` : 'Off-Site'}</strong></div>
        <div class="drawer-kv"><span>Default Position</span><strong>${defZ ? `${defZ.code} — ${defZ.shortName}` : '-'}</strong></div>
        <div class="drawer-kv"><span>Signal Strength</span><strong class="mono">${emp.rssi ? emp.rssi + ' dBm (Strong)' : 'N/A'}</strong></div>
        <div class="drawer-kv"><span>Clock-IN Time</span><strong class="mono">${escapeHtml(emp.clockInTime || '-')}</strong></div>
        <div class="drawer-kv"><span>Hours Today / Limit</span><strong class="mono">${emp.hoursToday.toFixed(1)}h / ${emp.maxShiftHours}h</strong></div>
        <div class="drawer-kv"><span>Away from Station</span><strong>${emp.awayMinutes} min (Limit: ${emp.maxAwayMinutes}m)</strong></div>
        <div class="drawer-kv"><span>Phone</span><strong>${escapeHtml(emp.phone || '-')}</strong></div>
        <div class="drawer-kv" style="border:none;"><span>Emergency Contact</span><strong>${escapeHtml(emp.emergencyContact || '-')}</strong></div>
      </div>

      <div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">DEMO CONTROL: MOVE EMPLOYEE TO ZONE</div>
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <select id="drawerMoveZoneSelect" class="select" style="flex:1;">
          ${ZONES.map((z) => `<option value="${z.id}" ${emp.currentZone === z.id ? 'selected' : ''}>${z.code} — ${z.shortName}${z.restricted ? ' (Restricted)' : ''}</option>`).join('')}
        </select>
        <button id="btnDrawerMove" class="btn btn-amber btn-sm">Move Now</button>
      </div>

      <div style="display:flex;gap:8px;">
        <button id="btnDrawerReturn" class="btn btn-primary btn-sm" style="flex:1;justify-content:center;">Return to Default Zone</button>
        <button id="btnDrawerEdit" class="btn btn-outline btn-sm">Edit Profile</button>
      </div>
    `;

    document.getElementById('btnDrawerMove').addEventListener('click', () => {
      const targetZone = document.getElementById('drawerMoveZoneSelect').value;
      moveEmployeeToZone(emp.id, targetZone);
      openTelemetryDrawer(emp.id);
    });
    document.getElementById('btnDrawerReturn').addEventListener('click', () => {
      moveEmployeeToZone(emp.id, emp.defaultZone);
      openTelemetryDrawer(emp.id);
    });
    document.getElementById('btnDrawerEdit').addEventListener('click', () => {
      closeTelemetryDrawer();
      openEmployeeModal(emp.id);
    });

    document.getElementById('telemetryDrawerBackdrop').classList.add('open');
  }

  function closeTelemetryDrawer() {
    document.getElementById('telemetryDrawerBackdrop').classList.remove('open');
  }

  function moveEmployeeToZone(empId, targetZoneId) {
    const emp = getEmployee(empId);
    const zone = getZone(targetZoneId);
    if (!emp || !zone) return;

    emp.status = 'on_site';
    emp.currentZone = targetZoneId;
    emp.rssi = -46 - Math.floor(Math.random() * 14);
    emp.awayMinutes = targetZoneId === emp.defaultZone ? 0 : Math.max(emp.awayMinutes, 2);

    const unauthorized = !emp.allowedZones.includes(targetZoneId);
    if (unauthorized && state.rules.restrictedZoneImmediate) {
      pushAlert({
        severity: 'critical',
        type: 'Restricted Zone Entry',
        employeeId: emp.id,
        zoneId: zone.id,
        message: `${emp.name} (${emp.department}) detected in unauthorized ${zone.code} (${zone.name}) via ${zone.readerId}.`
      });
    } else if (targetZoneId === emp.defaultZone) {
      showToast('Position Verified', `${emp.name} returned to default ${zone.code} (${zone.shortName}).`, 'ok');
    }

    saveState(state);
    renderAll();
  }

  // --- VIEW 4: Reports & Analytics ---
  function renderReports() {
    const range = document.getElementById('reportRange').value;
    const dept = document.getElementById('reportDeptFilter').value;
    const mult = range === 'today' ? 1 : range === 'week' ? 5 : 21;

    const list = state.employees.filter((e) => dept === 'all' || e.department === dept);
    document.getElementById('reportRowCount').textContent = `${list.length} Employees`;

    // Chart 1: Hours Worked Bars (top 8)
    const hoursContainer = document.getElementById('chartHoursBars');
    const maxScale = range === 'today' ? 10 : range === 'week' ? 46 : 190;
    hoursContainer.innerHTML = list
      .slice(0, 8)
      .map((e) => {
        const hrs = range === 'today' ? e.hoursToday : range === 'week' ? e.hoursWeek : e.hoursWeek * 4.1;
        const limit = e.maxShiftHours * mult;
        const isOt = hrs > limit;
        const wPct = Math.min(100, Math.round((hrs / maxScale) * 100));
        return `
          <div class="bar-row">
            <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;">${escapeHtml(e.name)}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${wPct}%;background:${isOt ? '#ef4444' : '#0f172a'};"></div>
            </div>
            <div class="mono" style="text-align:right;font-weight:700;color:${isOt ? '#dc2626' : 'var(--text-primary)'};">${hrs.toFixed(1)}h</div>
          </div>
        `;
      })
      .join('');

    // Chart 2: Default Zone Compliance % by Zone
    const zoneContainer = document.getElementById('chartZoneCompliance');
    const prodZones = ZONES.filter((z) => !z.isGate && !z.restricted);
    zoneContainer.innerHTML = prodZones
      .map((z) => {
        const zEmps = list.filter((e) => e.defaultZone === z.id);
        const avgPct = zEmps.length ? Math.round(zEmps.reduce((s, e) => s + e.defaultZonePct, 0) / zEmps.length) : 0;
        const col = avgPct >= 90 ? '#10b981' : avgPct >= 80 ? '#f59e0b' : '#ef4444';
        return `
          <div class="bar-row">
            <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;">${z.code} ${z.shortName}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${avgPct}%;background:${col};"></div>
            </div>
            <div class="mono" style="text-align:right;font-weight:700;">${avgPct}%</div>
          </div>
        `;
      })
      .join('');

    // Detailed Table
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = list
      .map((e) => {
        const hrs = range === 'today' ? e.hoursToday : range === 'week' ? e.hoursWeek : e.hoursWeek * 4.1;
        const ot = Math.max(0, hrs - e.maxShiftHours * mult);
        const defZ = getZone(e.defaultZone);
        const ok = ot === 0 && e.defaultZonePct >= 85;
        return `
          <tr>
            <td><strong>${escapeHtml(e.name)}</strong> <span style="color:var(--text-muted);font-size:11px;">(${e.id})</span></td>
            <td>${escapeHtml(e.department)}</td>
            <td class="mono">${escapeHtml(e.rfidUid)}</td>
            <td>${defZ ? `${defZ.code} (${defZ.shortName})` : '-'}</td>
            <td class="mono"><strong>${hrs.toFixed(1)} h</strong></td>
            <td class="mono" style="color:${ot > 0 ? 'var(--danger)' : 'var(--text-muted)'};">${ot > 0 ? '+' + ot.toFixed(1) + ' h' : '0.0 h'}</td>
            <td class="mono"><strong>${e.defaultZonePct}%</strong></td>
            <td>${ok ? '<span class="badge badge-ok">Within Parameters</span>' : '<span class="badge badge-warn">Review Needed</span>'}</td>
          </tr>
        `;
      })
      .join('');
  }

  // --- VIEW 5: Alerts & Parameter Rules ---
  function renderAlerts() {
    const statusFilter = document.getElementById('alertFilterStatus').value;
    const container = document.getElementById('alertsFeedContainer');
    const filtered = state.alerts.filter((a) => statusFilter === 'all' || a.status === statusFilter);

    if (!filtered.length) {
      container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);">No alerts match the selected filter. All employee parameters are nominal.</div>`;
    } else {
      container.innerHTML = filtered
        .map((a) => {
          const sevBadge =
            a.severity === 'critical'
              ? '<span class="badge badge-danger">CRITICAL</span>'
              : a.severity === 'warning'
              ? '<span class="badge badge-warn">WARNING</span>'
              : '<span class="badge badge-info">INFO</span>';
          const statusBadge =
            a.status === 'active'
              ? '<span class="badge badge-danger">Active</span>'
              : a.status === 'acknowledged'
              ? '<span class="badge badge-warn">Acknowledged</span>'
              : '<span class="badge badge-ok">Resolved</span>';
          return `
            <div class="alert-item ${a.severity} ${a.status === 'resolved' ? 'resolved' : ''}">
              <div class="alert-top">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  ${sevBadge}
                  <strong>${escapeHtml(a.type)}</strong>
                  <span class="mono" style="font-size:11.5px;color:var(--text-muted);">${escapeHtml(a.id)} • ${escapeHtml(a.time)}</span>
                </div>
                ${statusBadge}
              </div>
              <div style="font-size:13px;color:var(--text-primary);">${escapeHtml(a.message)}</div>
              <div class="alert-actions">
                <div>Dispatched via: <strong>${escapeHtml((a.channelsSent || []).join(', ') || 'Dashboard')}</strong></div>
                <div style="display:flex;gap:6px;">
                  ${a.status === 'active' ? `<button class="btn btn-outline btn-sm" data-alert-act="ack" data-id="${a.id}">Acknowledge</button>` : ''}
                  ${a.status !== 'resolved' ? `<button class="btn btn-primary btn-sm" data-alert-act="resolve" data-id="${a.id}">Resolve</button>` : ''}
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      container.querySelectorAll('button[data-alert-act]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const alert = state.alerts.find((x) => x.id === btn.dataset.id);
          if (!alert) return;
          alert.status = btn.dataset.alertAct === 'ack' ? 'acknowledged' : 'resolved';
          saveState(state);
          renderAll();
        });
      });
    }

    // Populate rules inputs
    document.getElementById('ruleOutMinutes').value = state.rules.outOfZoneMinutes;
    document.getElementById('ruleRestricted').checked = !!state.rules.restrictedZoneImmediate;
    document.getElementById('ruleLateGrace').value = state.rules.lateGraceMinutes;
    document.getElementById('ruleMaxHours').value = state.rules.maxShiftHours;
    document.getElementById('chDash').checked = !!state.rules.channels.dashboard;
    document.getElementById('chEmail').checked = !!state.rules.channels.email;
    document.getElementById('chSms').checked = !!state.rules.channels.sms;
    document.getElementById('chWebhook').checked = !!state.rules.channels.webhook;

    // Outbound Dispatch Log
    const dispEl = document.getElementById('dispatchLogContainer');
    dispEl.innerHTML = state.dispatchLog
      .slice(0, 12)
      .map(
        (d) => `
      <div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span class="badge ${d.channel === 'SMS' ? 'badge-danger' : 'badge-info'}">${escapeHtml(d.channel)}</span>
          <span class="mono" style="color:var(--text-muted);">${escapeHtml(d.time)}</span>
        </div>
        <div style="font-weight:600;color:var(--text-secondary);">${escapeHtml(d.recipient)}</div>
        <div style="color:var(--text-primary);margin-top:2px;">${escapeHtml(d.summary)}</div>
      </div>
    `
      )
      .join('');
  }

  // --- VIEW 6: Interactive Offer BOM ---
  function renderOfferBom() {
    const tbody = document.getElementById('bomTableBody');
    let grandTotal = 0;

    tbody.innerHTML = state.bom
      .map((row, idx) => {
        const lineTotal = (Number(row.qty) || 0) * (Number(row.unitPrice) || 0);
        grandTotal += lineTotal;
        return `
          <tr>
            <td class="mono">${idx + 1}</td>
            <td><strong>${escapeHtml(row.category)}</strong></td>
            <td>${escapeHtml(row.item)}</td>
            <td style="text-align:right;">
              <input type="number" min="0" step="1" class="bom-num-input" data-bom-idx="${idx}" data-field="qty" value="${row.qty}" />
            </td>
            <td style="text-align:right;">
              <input type="number" min="0" step="10" class="bom-num-input" data-bom-idx="${idx}" data-field="unitPrice" value="${row.unitPrice}" />
            </td>
            <td class="mono" style="text-align:right;font-weight:700;">${formatEur(lineTotal)}</td>
          </tr>
        `;
      })
      .join('');

    document.getElementById('bomGrandTotal').textContent = formatEur(grandTotal);

    tbody.querySelectorAll('.bom-num-input').forEach((inp) => {
      inp.addEventListener('change', () => {
        const idx = parseInt(inp.dataset.bomIdx, 10);
        const field = inp.dataset.field;
        state.bom[idx][field] = Math.max(0, parseFloat(inp.value) || 0);
        saveState(state);
        renderOfferBom();
      });
    });
  }

  // --- CSV Export Utility ---
  function downloadCsv(filename, headers, rows) {
    const csvLines = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('CSV Exported', `Downloaded ${filename}`, 'ok');
  }

  // --- Live Telemetry Simulation Loop ---
  function simulationTick() {
    if (!simRunning) return;
    const onSite = state.employees.filter((e) => e.status === 'on_site');
    if (!onSite.length) return;

    // Slightly fluctuate RSSI for realism
    onSite.forEach((e) => {
      e.rssi = Math.max(-68, Math.min(-44, (e.rssi || -52) + (Math.floor(Math.random() * 5) - 2)));
      if (e.currentZone && e.currentZone !== e.defaultZone) {
        e.awayMinutes = (e.awayMinutes || 0) + 1;
      }
    });

    // Randomly move one authorized worker gently to showcase live movement
    const candidate = onSite[Math.floor(Math.random() * onSite.length)];
    if (candidate && candidate.allowedZones.length > 1 && candidate.currentZone !== 'ZONE_F') {
      const choices = candidate.allowedZones.filter((z) => z !== 'GATE');
      const nextZone = Math.random() < 0.65 ? candidate.defaultZone : choices[Math.floor(Math.random() * choices.length)];
      if (nextZone && nextZone !== candidate.currentZone) {
        candidate.currentZone = nextZone;
        candidate.awayMinutes = nextZone === candidate.defaultZone ? 0 : 1;
      }
    }

    renderKPIs();
    renderIsometricMap();
    renderMapSidePanel();
  }

  function triggerDemoAlert() {
    demoAlertCounter++;
    const onSite = state.employees.filter((e) => e.status === 'on_site');
    if (!onSite.length) return;

    if (demoAlertCounter % 2 === 1) {
      // Restricted Zone breach demo
      const target = onSite.find((e) => !e.allowedZones.includes('ZONE_F') && e.currentZone !== 'ZONE_F') || onSite[0];
      moveEmployeeToZone(target.id, 'ZONE_F');
    } else {
      // Out of default position threshold exceeded demo
      const target = onSite.find((e) => e.defaultZone === 'ZONE_A') || onSite[0];
      target.currentZone = 'ZONE_E';
      target.awayMinutes = (target.maxAwayMinutes || state.rules.outOfZoneMinutes) + 4;
      pushAlert({
        severity: 'warning',
        type: 'Out of Default Position',
        employeeId: target.id,
        zoneId: 'ZONE_E',
        message: `${target.name} has been outside assigned ${getZone(target.defaultZone).code} for ${target.awayMinutes} min (detected in Zone E — Maintenance).`
      });
      saveState(state);
      renderAll();
    }
  }

  function renderAll() {
    renderKPIs();
    renderIsometricMap();
    renderMapSidePanel();
    renderAttendance();
    renderEmployees();
    renderReports();
    renderAlerts();
    renderOfferBom();
  }

  // --- Wire Event Listeners ---
  function init() {
    // Sidebar nav
    document.querySelectorAll('.nav-btn[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Clickable 3D buildings on SVG map
    document.querySelectorAll('#isometricMapSvg .zone-group').forEach((g) => {
      g.addEventListener('click', () => selectZone(g.dataset.zone));
    });

    document.getElementById('btnClearZoneFilter').addEventListener('click', () => {
      selectedZoneId = null;
      document.getElementById('btnClearZoneFilter').style.display = 'none';
      renderIsometricMap();
      renderMapSidePanel();
    });

    document.getElementById('mapStatusFilter').addEventListener('change', renderIsometricMap);

    // Topbar controls
    document.getElementById('btnToggleSim').addEventListener('click', () => {
      simRunning = !simRunning;
      document.getElementById('simIcon').textContent = simRunning ? '⏸' : '▶';
      document.getElementById('simLabel').textContent = simRunning ? 'Pause Live Sim' : 'Resume Live Sim';
      document.getElementById('liveDot').classList.toggle('paused', !simRunning);
      showToast(simRunning ? 'Live Simulation Resumed' : 'Live Simulation Paused', simRunning ? 'RFID antenna polling active.' : 'Floor positions frozen for inspection.', 'ok');
    });

    document.getElementById('btnDemoAlert').addEventListener('click', triggerDemoAlert);
    document.getElementById('btnQuickAddEmp').addEventListener('click', () => openEmployeeModal(null));
    document.getElementById('btnAddEmployee').addEventListener('click', () => openEmployeeModal(null));

    // Employee modal
    document.getElementById('btnCloseEmpModal').addEventListener('click', closeEmployeeModal);
    document.getElementById('btnCancelEmpModal').addEventListener('click', closeEmployeeModal);
    document.getElementById('btnGenRfid').addEventListener('click', () => {
      document.getElementById('formEmpRfid').value = generateEpc();
    });
    document.getElementById('empForm').addEventListener('submit', handleEmployeeFormSubmit);

    // Telemetry drawer
    document.getElementById('btnCloseDrawer').addEventListener('click', closeTelemetryDrawer);
    document.getElementById('telemetryDrawerBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'telemetryDrawerBackdrop') closeTelemetryDrawer();
    });

    // Attendance controls
    document.getElementById('simTimeInput').value = nowShortTime();
    document.getElementById('btnSimulateScan').addEventListener('click', simulateGateScan);
    document.getElementById('attSearch').addEventListener('input', renderAttendance);
    document.getElementById('attDirFilter').addEventListener('change', renderAttendance);

    // Employee filters
    document.getElementById('empSearch').addEventListener('input', renderEmployees);
    document.getElementById('empDeptFilter').addEventListener('change', renderEmployees);
    document.getElementById('empZoneFilter').addEventListener('change', renderEmployees);

    // Report filters
    document.getElementById('reportRange').addEventListener('change', renderReports);
    document.getElementById('reportDeptFilter').addEventListener('change', renderReports);

    // Alerts controls
    document.getElementById('alertFilterStatus').addEventListener('change', renderAlerts);
    document.getElementById('btnResolveAll').addEventListener('click', () => {
      state.alerts.forEach((a) => (a.status = 'resolved'));
      saveState(state);
      showToast('All Alerts Resolved', 'Alert feed cleared.', 'ok');
      renderAll();
    });

    document.getElementById('btnSaveRules').addEventListener('click', () => {
      state.rules.outOfZoneMinutes = parseInt(document.getElementById('ruleOutMinutes').value, 10) || 15;
      state.rules.restrictedZoneImmediate = document.getElementById('ruleRestricted').checked;
      state.rules.lateGraceMinutes = parseInt(document.getElementById('ruleLateGrace').value, 10) || 10;
      state.rules.maxShiftHours = parseFloat(document.getElementById('ruleMaxHours').value) || 8.5;
      state.rules.channels = {
        dashboard: document.getElementById('chDash').checked,
        email: document.getElementById('chEmail').checked,
        sms: document.getElementById('chSms').checked,
        webhook: document.getElementById('chWebhook').checked
      };
      saveState(state);
      showToast('Rules Saved', 'Parameter alert thresholds updated for all zones.', 'ok');
      renderAll();
    });

    // CSV Exports
    document.getElementById('btnExportAttendanceCsv').addEventListener('click', () => {
      downloadCsv(
        'emiroglio_rfid_attendance.csv',
        ['Timestamp', 'Direction', 'EmployeeID', 'Name', 'RFID_UID', 'Reader', 'Status'],
        state.attendanceLogs.map((l) => {
          const e = getEmployee(l.employeeId) || {};
          return [l.time, l.direction, l.employeeId, e.name || '', e.rfidUid || '', l.reader, l.note];
        })
      );
    });

    document.getElementById('btnExportEmployeesCsv').addEventListener('click', () => {
      downloadCsv(
        'emiroglio_rfid_employees.csv',
        ['EmployeeID', 'FullName', 'Department', 'Role', 'Phone', 'Email', 'RFID_UID', 'DefaultZone', 'ShiftStart', 'MaxHours', 'MaxAwayMin'],
        state.employees.map((e) => [e.id, e.name, e.department, e.role, e.phone, e.email, e.rfidUid, e.defaultZone, e.shiftStart, e.maxShiftHours, e.maxAwayMinutes])
      );
    });

    document.getElementById('btnExportReportCsv').addEventListener('click', () => {
      downloadCsv(
        'emiroglio_hours_and_positions_report.csv',
        ['EmployeeID', 'FullName', 'Department', 'RFID_UID', 'DefaultZone', 'HoursToday', 'HoursWeek', 'DefaultZoneCompliancePct'],
        state.employees.map((e) => [e.id, e.name, e.department, e.rfidUid, e.defaultZone, e.hoursToday, e.hoursWeek, e.defaultZonePct + '%'])
      );
    });

    // Reset demo data
    document.getElementById('btnResetDemo').addEventListener('click', () => {
      if (confirm('Reset all demo employees, attendance logs, alerts, and BOM numbers to initial defaults?')) {
        state = resetState();
        selectedZoneId = null;
        showToast('Demo Reset', 'Initial Emiroglio RFID dataset restored.', 'ok');
        renderAll();
      }
    });

    // Live clock
    function updateClock() {
      document.getElementById('liveClock').textContent = nowTimeStr();
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Initial render + live simulation interval
    renderAll();
    simTimer = setInterval(simulationTick, 4500);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
