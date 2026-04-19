const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date }, // Eski/Günlük uyumluluğu için
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String },
    // YENİ EKLENEN ALAN: Etkinlik rengini kaydetmek için
    color: { type: String, default: 'blue' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);