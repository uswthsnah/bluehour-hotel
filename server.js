const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = 'mongodb://localhost:27017/bluehour_db'; 

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Terhubung ke MongoDB!'))
  .catch(err => console.error('❌ Gagal terhubung ke MongoDB:', err));

// PENTING: Schema sudah ditentukan supaya tidak ada field sampah
const TicketSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  loc: { type: String },
  floor: { type: Number },
  guest: { type: String },
  item: { type: String },
  note: { type: String },
  status: { type: String },
  staff: { type: String },
  time: { type: String },
  finishNote: { type: String }
}, { strict: true }); // Diubah ke true agar data rapi

const Ticket = mongoose.model('Ticket', TicketSchema, 'tickets_fix_final');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// LOGIKA: Baca data
app.get('/api/data', async (req, res) => {
    try {
        const data = await Ticket.find({}).lean();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIKA: Update/Insert 1 data (Ditambahkan pemilihan field agar bersih)
app.post('/api/save', async (req, res) => {
    try {
        const newData = req.body;
        console.log(`[SYSTEM] Menyimpan data ID: ${newData.id}`);
        
        // Hanya ambil field yang ada di schema (Mencegah field sampah dari frontend)
        const cleanData = {
            id: newData.id,
            loc: newData.loc || '',
            floor: newData.floor || null,
            guest: newData.guest || '',
            item: newData.item || '',
            note: newData.note || '',
            status: newData.status || 'New',
            staff: newData.staff || '-',
            time: newData.time || '',
            finishNote: newData.finishNote || ''
        };
        
        const existing = await Ticket.findOne({ id: cleanData.id });
        
        if (existing) {
            await Ticket.updateOne({ id: cleanData.id }, { $set: cleanData });
        } else {
            await Ticket.create(cleanData);
        }
        
        res.status(200).json({ message: 'Data berhasil disimpan' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIKA: Sinkronisasi Massal
app.post('/api/data', async (req, res) => {
    try {
        const dataArray = req.body;
        for (const item of dataArray) {
            // Bersihkan juga di endpoint POST array
            const cleanData = {
                id: item.id, loc: item.loc, floor: item.floor, guest: item.guest,
                item: item.item, note: item.note, status: item.status, 
                staff: item.staff, time: item.time, finishNote: item.finishNote || ''
            };
            await Ticket.updateOne({ id: cleanData.id }, { $set: cleanData }, { upsert: true });
        }
        res.status(200).json({ message: 'Semua data disinkronkan' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log('🚀 Server FINAL berjalan di http://localhost:3000');
});