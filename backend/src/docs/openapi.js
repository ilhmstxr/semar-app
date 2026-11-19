export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'SEMAR Web Service API',
    version: '1.0.0',
    description: `
API RESTful untuk sistem **SEMAR** (Sistem Pengelolaan Sampah, Biokonversi Maggot, dan Keuangan Kas).
Menyediakan antarmuka komunikasi data untuk aplikasi mobile (*React Native*), dashboard web (*HTML prototype*), dan perangkat sensor *IoT*.
    `,
    contact: {
      name: 'SEMAR Developer Team',
      email: 'dev@semar.local',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  tags: [
    {
      name: 'General',
      description: 'Endpoint umum dan pemeriksaan kesehatan layanan',
    },
    {
      name: 'Tong Sampah Pintar',
      description: 'Monitoring telemetri berat, suhu, dan status tong sampah pintar per lantai',
    },
    {
      name: 'Catat Setoran & Sensor',
      description: 'Pencatatan setoran sampah pilah harian dan pembacaan sensor IoT',
    },
    {
      name: 'Pengolahan Sampah',
      description: 'Manajemen drum komposter, status biokonversi maggot BSF, dan log panen',
    },
    {
      name: 'Kas & Keuangan',
      description: 'Pencatatan pemasukan, pengeluaran kas operasional, dan ringkasan saldo',
    },
    {
      name: 'Dampak Lingkungan',
      description: 'Statistik pemulihan sampah organik, reduksi emisi CO2, dan tren mingguan',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['General'],
        summary: 'Pemeriksaan Kesehatan API',
        description: 'Mengembalikan status operasional server web service.',
        responses: {
          200: {
            description: 'Layanan berjalan normal',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'OK' },
                    service: { type: 'string', example: 'SEMAR Web Service API' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/bins': {
      get: {
        tags: ['Tong Sampah Pintar'],
        summary: 'Dapatkan Seluruh Status Tong Pintar',
        description: 'Mengambil data telemetri seluruh tong sampah di setiap lantai.',
        responses: {
          200: {
            description: 'Daftar tong sampah berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 5 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/BinItem' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/bins/{id}': {
      get: {
        tags: ['Tong Sampah Pintar'],
        summary: 'Detail Tong Pintar Berdasarkan ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID numerik tong sampah',
            schema: { type: 'integer', example: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Detail data tong sampah',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/BinItem' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Tong sampah tidak ditemukan',
          },
        },
      },
      put: {
        tags: ['Tong Sampah Pintar'],
        summary: 'Perbarui Data / Telemetri Tong Sampah',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID numerik tong sampah',
            schema: { type: 'integer', example: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['Aman', 'Segera', 'Jemput', 'Sensor off'],
                    example: 'Segera',
                  },
                  weightKg: { type: 'number', example: 7.5 },
                  ageHours: { type: 'number', example: 28 },
                  tempC: { type: 'number', nullable: true, example: 32 },
                  percent: { type: 'number', example: 65 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Data tong berhasil diperbarui',
          },
          404: {
            description: 'Tong sampah tidak ditemukan',
          },
        },
      },
    },
        '/api/bins/telemetry': {
      post: {
        tags: ['Tong Sampah Pintar'],
        summary: 'Kirim Data Telemetri Sensor IoT',
        description: 'Endpoint penerima data telemetri real-time dari mikrokontroler sensor IoT tong.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bin_id', 'weight_kg'],
                properties: {
                  bin_id: { type: 'integer', example: 1 },
                  weight_kg: { type: 'number', example: 7.9 },
                  fill_percent: { type: 'integer', example: 68 },
                  waste_age_hours: { type: 'integer', example: 24 },
                  temperature_c: { type: 'number', example: 31.5 },
                  status_badge: { type: 'string', enum: ['Aman', 'Segera', 'Jemput', 'Sensor off'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Data telemetri berhasil disimpan ke database' },
        },
      },
    },
    '/api/bins/{id}/pickup': {
      post: {
        tags: ['Tong Sampah Pintar'],
        summary: 'Tandai Tong Sudah Dijemput',
        description: 'Mereset bobot tong ke 0 kg dan status Aman setelah sampah diangkut petugas.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } },
        ],
        responses: {
          200: { description: 'Tong berhasil direset ke status Aman' },
        },
      },
    },
    '/api/bins/{id}/toggle-sensor': {
      patch: {
        tags: ['Tong Sampah Pintar'],
        summary: 'On/Off Sensor IoT Tong Sampah',
        description: 'Mengaktifkan atau menonaktifkan sensor IoT pada tong sampah tertentu.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', example: 5 },
          },
        ],
        responses: {
          200: {
            description: 'Status sensor berhasil diubah',
          },
          404: {
            description: 'Tong sampah tidak ditemukan',
          },
        },
      },
    },
    '/api/catat/sensor-weights': {
      get: {
        tags: ['Catat Setoran & Sensor'],
        summary: 'Data Berat Real-time Sensor IoT per Lantai',
        responses: {
          200: {
            description: 'Data pembacaan sensor berhasil diambil',
          },
        },
      },
    },
        '/api/catat/upload': {
      post: {
        tags: ['Catat Setoran & Sensor'],
        summary: 'Unggah Foto Bukti Setoran (Max 5MB)',
        description: 'Mengunggah file foto bukti setoran sampah dengan batas maksimal ukuran 5MB.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  photo: { type: 'string', format: 'binary', description: 'File gambar (JPG, PNG, WEBP, max 5MB)' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Foto berhasil diunggah' },
          400: { description: 'Ukuran file melebihi 5MB atau format tidak didukung' },
        },
      },
    },
    '/api/catat/history': {
      get: {
        tags: ['Catat Setoran & Sensor'],
        summary: 'Riwayat Seluruh Setoran Tersimpan',
        responses: {
          200: {
            description: 'Daftar riwayat setoran',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 1 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SetoranRecord' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/catat': {
      post: {
        tags: ['Catat Setoran & Sensor'],
        summary: 'Catat Setoran & Pilah Sampah Baru',
        description: 'Menyimpan pencatatan sampah terpilah (maggot, komposter, anorganik) dan mereset berat tong di lantai terkait.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['floor', 'totalWeight'],
                properties: {
                  floor: { type: 'string', example: 'Lantai 2' },
                  totalWeight: { type: 'number', example: 7.9 },
                  maggotKg: { type: 'number', example: 5.2 },
                  komposterKg: { type: 'number', example: 2.1 },
                  anorganikKg: { type: 'number', example: 0.6 },
                  operator: { type: 'string', example: 'Rina' },
                  corridorOdor: { type: 'string', enum: ['Tidak', 'Sedikit tercium', 'Ya, menyengat'], example: 'Tidak' },
                  photoUrl: { type: 'string', nullable: true, example: '/uploads/foto-sample.jpg' },
                  photoUri: { type: 'string', nullable: true, example: null },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Setoran berhasil dicatat',
          },
          400: {
            description: 'Input tidak valid',
          },
        },
      },
    },
    '/api/catat/{id}': {
      delete: {
        tags: ['Catat Setoran & Sensor'],
        summary: 'Hapus Riwayat Setoran',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', example: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Data setoran berhasil dihapus',
          },
          404: {
            description: 'Data setoran tidak ditemukan',
          },
        },
      },
    },
    '/api/olah/drums': {
      get: {
        tags: ['Pengolahan Sampah'],
        summary: 'Daftar Drum Komposter',
        responses: {
          200: {
            description: 'Daftar drum komposter',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DrumItem' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/olah/drums/{id}': {
      put: {
        tags: ['Pengolahan Sampah'],
        summary: 'Perbarui Parameter Drum Komposter',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', example: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'Fase Aktif' },
                  tempC: { type: 'number', example: 55 },
                  humidityPercent: { type: 'number', example: 60 },
                  days: { type: 'integer', example: 14 },
                  maturityPercent: { type: 'number', example: 75 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Data drum berhasil diperbarui',
          },
        },
      },
    },
    '/api/olah/maggot': {
      get: {
        tags: ['Pengolahan Sampah'],
        summary: 'Status Biokonversi Maggot BSF',
        responses: {
          200: {
            description: 'Status biokonversi maggot',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/MaggotStatus' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Pengolahan Sampah'],
        summary: 'Perbarui Parameter Siklus Maggot',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MaggotStatus' },
            },
          },
        },
        responses: {
          200: {
            description: 'Status biokonversi maggot berhasil diperbarui',
          },
        },
      },
    },
    '/api/olah/harvests': {
      get: {
        tags: ['Pengolahan Sampah'],
        summary: 'Daftar Catatan Panen Kompos / Maggot',
        responses: {
          200: {
            description: 'Daftar riwayat panen',
          },
        },
      },
      post: {
        tags: ['Pengolahan Sampah'],
        summary: 'Tambah Catatan Panen Baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'weightKg'],
                properties: {
                  type: {
                    type: 'string',
                    example: 'Panen prepupa / maggot segar',
                  },
                  weightKg: { type: 'number', example: 7.5 },
                  note: { type: 'string', example: 'Kualitas sangat baik' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Catatan panen berhasil ditambahkan',
          },
        },
      },
    },
    '/api/kas': {
      get: {
        tags: ['Kas & Keuangan'],
        summary: 'Ringkasan Keuangan & Daftar Transaksi',
        description: 'Mengambil total pemasukan, total pengeluaran, saldo bersih, serta daftar riwayat transaksi kas.',
        responses: {
          200: {
            description: 'Ringkasan kas dan riwayat transaksi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    summary: {
                      type: 'object',
                      properties: {
                        totalIncome: { type: 'number', example: 212500 },
                        totalExpense: { type: 'number', example: 43000 },
                        balance: { type: 'number', example: 169500 },
                      },
                    },
                    count: { type: 'integer', example: 7 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/TransactionItem' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Kas & Keuangan'],
        summary: 'Tambah Transaksi Pemasukan / Pengeluaran',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['label', 'amount', 'type'],
                properties: {
                  label: { type: 'string', example: 'Penjualan Maggot Segar 5 kg' },
                  amount: { type: 'number', example: 35000 },
                  type: {
                    type: 'string',
                    enum: ['income', 'expense'],
                    example: 'income',
                  },
                  category: { type: 'string', example: 'Penjualan' },
                  date: { type: 'string', example: '19 Nov' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Transaksi berhasil ditambahkan',
          },
          400: {
            description: 'Input data tidak valid',
          },
        },
      },
    },
    '/api/kas/{id}': {
      delete: {
        tags: ['Kas & Keuangan'],
        summary: 'Hapus Transaksi Kas',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', example: 1 },
          },
        ],
        responses: {
          200: {
            description: 'Transaksi berhasil dihapus',
          },
          404: {
            description: 'Transaksi tidak ditemukan',
          },
        },
      },
    },
    '/api/dampak': {
      get: {
        tags: ['Dampak Lingkungan'],
        summary: 'Statistik Dampak Lingkungan',
        description: 'Mengambil total sampah organik yang terkelola, reduksi emisi, dan tren mingguan serta per lantai.',
        responses: {
          200: {
            description: 'Data statistik dampak lingkungan',
          },
        },
      },
      put: {
        tags: ['Dampak Lingkungan'],
        summary: 'Perbarui Data Dampak Lingkungan',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  weekNumber: { type: 'integer', example: 6 },
                  totalOrganicKg: { type: 'number', example: 570 },
                  preventedEmissionTon: { type: 'string', example: '0,3' },
                  baselineKgPerWeek: { type: 'number', example: 108 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Data dampak lingkungan berhasil diperbarui',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      BinItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          floor: { type: 'string', example: 'Lantai 1' },
          status: {
            type: 'string',
            enum: ['Aman', 'Segera', 'Jemput', 'Sensor off'],
            example: 'Aman',
          },
          weightKg: { type: 'number', example: 4.1 },
          ageHours: { type: 'number', example: 12 },
          tempC: { type: 'number', nullable: true, example: 30 },
          percent: { type: 'number', example: 36 },
          sensorActive: { type: 'boolean', example: true },
          fixedSchedule: { type: 'string', example: '' },
        },
      },
      SetoranRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          floor: { type: 'string', example: 'Lantai 3' },
          time: { type: 'string', example: '07:45' },
          totalWeight: { type: 'number', example: 9.8 },
          maggotKg: { type: 'number', example: 7.6 },
          komposterKg: { type: 'number', example: 1.7 },
          anorganikKg: { type: 'number', example: 0.5 },
          operator: { type: 'string', example: 'Rina' },
          photoUri: { type: 'string', nullable: true, example: null },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      DrumItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Drum 1' },
          status: { type: 'string', example: 'Fase Aktif' },
          tempC: { type: 'number', example: 54 },
          humidityPercent: { type: 'number', example: 62 },
          days: { type: 'integer', example: 12 },
          maturityPercent: { type: 'number', example: 70 },
        },
      },
      MaggotStatus: {
        type: 'object',
        properties: {
          activeBioconversionKg: { type: 'number', example: 85 },
          prepupaHarvestEstimateKg: { type: 'number', example: 14.5 },
          kasgotReadyKg: { type: 'number', example: 42 },
          cycleDay: { type: 'integer', example: 14 },
        },
      },
      TransactionItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          label: { type: 'string', example: 'Maggot segar 6 kg (lele)' },
          amount: { type: 'number', example: 42000 },
          date: { type: 'string', example: '18 Nov' },
          type: { type: 'string', enum: ['income', 'expense'], example: 'income' },
          category: { type: 'string', example: 'Penjualan' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};
