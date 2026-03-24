const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'registrations.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Turnierkonfiguration ────────────────────────────────────────────────────

const CONFIG = {
  jugendMapping: {
    b_jugend:      { day: 'montag',  label: 'B-Jugend'        },
    g_2020:        { day: 'montag',  label: 'G-Junioren 2020' },
    g_2019:        { day: 'montag',  label: 'G-Junioren 2019' },
    e_maedchen:    { day: 'samstag', label: 'E-Mädchen'       },
    d_2013:        { day: 'samstag', label: 'D-Junioren 2013' },
    e_knaben:      { day: 'samstag', label: 'E-Knaben'        },
    d_2014:        { day: 'samstag', label: 'D-Junioren 2014' },
    f_jugend:      { day: 'sonntag', label: 'F-Jugend'        },
    c_jugend:      { day: 'sonntag', label: 'C-Jugend'        },
    d_juniorinnen: { day: 'sonntag', label: 'D-Juniorinnen'   },
  },

  spendenItems: [
    { id: 'kuchen',     label: 'Kuchen'     },
    { id: 'waffelteig', label: 'Waffelteig' },
    { id: 'salat',      label: 'Salat'      },
  ],

  days: {
    samstag: {
      label: 'Samstag',
      stands: [
        { id: 'kuchentheke',  label: 'Kuchentheke',        capacity: 1 },
        { id: 'biergondel',   label: 'Biergondel',         capacity: 3 },
        { id: 'grill_pommes', label: 'Grill & Pommesbar',  capacity: 3 },
      ],
      slots: [
        { id: 'sa-0900-1000', label: '09:00 – 10:00', youth: ['e_maedchen', 'd_2013'] },
        { id: 'sa-1000-1100', label: '10:00 – 11:00', youth: ['e_maedchen', 'd_2013'] },
        { id: 'sa-1100-1200', label: '11:00 – 12:00', youth: ['e_maedchen', 'd_2013'] },
        { id: 'sa-1200-1300', label: '12:00 – 13:00', youth: ['e_maedchen', 'd_2013'] },
        { id: 'sa-1300-1330', label: '13:00 – 13:30', youth: ['e_maedchen', 'd_2013'] },
        { id: 'sa-1400-1500', label: '14:00 – 15:00', youth: ['e_knaben', 'd_2014'] },
        { id: 'sa-1500-1600', label: '15:00 – 16:00', youth: ['e_knaben', 'd_2014'] },
        { id: 'sa-1600-1700', label: '16:00 – 17:00', youth: ['e_knaben', 'd_2014'] },
        { id: 'sa-1700-1800', label: '17:00 – 18:00', youth: ['e_knaben', 'd_2014'] },
        { id: 'sa-1800-1900', label: '18:00 – 19:00', youth: ['e_knaben', 'd_2014'] },
      ],
    },

    sonntag: {
      label: 'Sonntag',
      stands: [
        { id: 'kuchentheke',  label: 'Kuchentheke',        capacity: 1 },
        { id: 'biergondel',   label: 'Biergondel',         capacity: 3 },
        { id: 'grill_pommes', label: 'Grill & Pommesbar',  capacity: 3 },
      ],
      slots: [
        { id: 'so-0900-1000', label: '09:00 – 10:00', youth: ['f_jugend'] },
        { id: 'so-1000-1100', label: '10:00 – 11:00', youth: ['f_jugend', 'c_jugend'] },
        { id: 'so-1100-1200', label: '11:00 – 12:00', youth: ['f_jugend', 'c_jugend'] },
        { id: 'so-1200-1300', label: '12:00 – 13:00', youth: ['f_jugend', 'c_jugend'] },
        { id: 'so-1300-1400', label: '13:00 – 14:00', youth: ['c_jugend', 'd_juniorinnen'] },
        { id: 'so-1400-1500', label: '14:00 – 15:00', youth: ['c_jugend', 'd_juniorinnen'] },
        { id: 'so-1500-1600', label: '15:00 – 16:00', youth: ['d_juniorinnen'] },
        { id: 'so-1600-1700', label: '16:00 – 17:00', youth: ['d_juniorinnen'] },
        { id: 'so-1700-1800', label: '17:00 – 18:00', youth: ['d_juniorinnen'] },
      ],
    },

    montag: {
      label: 'Montag',
      stands: [
        { id: 'kaffee_waffel', label: 'Kaffee / Waffel',  capacity: 1 },
        { id: 'biergondel',    label: 'Biergondel',        capacity: 3 },
        { id: 'grill_pommes',  label: 'Grill & Pommesbar', capacity: 3 },
      ],
      slots: [
        { id: 'mo-0930-1030', label: '09:30 – 10:30', youth: ['b_jugend', 'g_2020'] },
        { id: 'mo-1030-1130', label: '10:30 – 11:30', youth: ['b_jugend', 'g_2020'] },
        { id: 'mo-1130-1230', label: '11:30 – 12:30', youth: ['b_jugend', 'g_2020'] },
        { id: 'mo-1300-1400', label: '13:00 – 14:00', youth: ['g_2019'] },
        { id: 'mo-1400-1500', label: '14:00 – 15:00', youth: ['g_2019'] },
        { id: 'mo-1500-1600', label: '15:00 – 16:00', youth: ['b_jugend'] },
      ],
    },
  },
};

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

function loadRegistrations() {
  try {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveRegistrations(list) {
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

function calcAvailability(registrations) {
  const avail = {};
  for (const [dayId, day] of Object.entries(CONFIG.days)) {
    avail[dayId] = {};
    for (const slot of day.slots) {
      avail[dayId][slot.id] = {};
      for (const stand of day.stands) {
        avail[dayId][slot.id][stand.id] = {
          capacity: stand.capacity,
          registered: 0,
          remaining: stand.capacity,
          names: [],
        };
      }
    }
  }
  for (const reg of registrations) {
    const entry = avail[reg.day]?.[reg.slotId]?.[reg.standId];
    if (entry) {
      entry.registered++;
      entry.remaining = entry.capacity - entry.registered;
      entry.names.push(reg.name);
    }
  }
  return avail;
}

// ─── API-Routen ───────────────────────────────────────────────────────────────

app.get('/api/config', (_req, res) => res.json(CONFIG));

app.get('/api/availability', (_req, res) => {
  res.json(calcAvailability(loadRegistrations()));
});

app.post('/api/register', (req, res) => {
  const { name, jugend, day, slotId, standId, spenden } = req.body;

  if (!name?.trim() || !jugend || !day || !slotId || !standId) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich.' });
  }

  const registrations = loadRegistrations();
  const avail = calcAvailability(registrations);
  const entry = avail[day]?.[slotId]?.[standId];

  if (!entry || entry.remaining <= 0) {
    return res.status(409).json({ error: 'Dieser Stand ist für den gewählten Zeitslot bereits voll belegt.' });
  }

  registrations.push({
    id: Date.now(),
    name: name.trim(),
    jugend,
    day,
    slotId,
    standId,
    spenden: Array.isArray(spenden) ? spenden : [],
    registeredAt: new Date().toISOString(),
  });

  saveRegistrations(registrations);
  res.json({ success: true });
});

// Admin: alle Anmeldungen
app.get('/api/admin/registrations', (_req, res) => {
  res.json(loadRegistrations());
});

// Admin: Anmeldung löschen (mit Authentifizierung)
app.delete('/api/admin/registrations/:id', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== 'Basic ' + Buffer.from('FGS:1234').toString('base64')) {
    return res.status(401).json({ error: 'Nicht autorisiert.' });
  }
  const id = parseInt(req.params.id, 10);
  const registrations = loadRegistrations();
  const idx = registrations.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Anmeldung nicht gefunden.' });
  }
  registrations.splice(idx, 1);
  saveRegistrations(registrations);
  res.json({ success: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅  Server läuft auf http://localhost:${PORT}`);
  console.log(`   Im Netzwerk erreichbar unter http://<DEINE-IP>:${PORT}\n`);
});
