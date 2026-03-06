"use strict";
/* -------------------------------------------------------
    TravelSync - PDF Service
    GoBD uyumlu raporlama servisi
------------------------------------------------------- */

const PdfPrinter = require('pdfmake');

// Font tanımlamaları
const fonts = {
    Roboto: {
        normal: 'node_modules/pdfmake/build/vfs_fonts/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/build/vfs_fonts/Roboto-Medium.ttf',
        italics: 'node_modules/pdfmake/build/vfs_fonts/Roboto-Italic.ttf',
        bolditalics: 'node_modules/pdfmake/build/vfs_fonts/Roboto-MediumItalic.ttf'
    }
};

const printer = new PdfPrinter(fonts);

/**
 * PDF Servisi
 * GoBD uyumlu rapor oluşturma
 */
class PdfService {
    constructor() {
        this.companyInfo = {
            name: 'TravelSync',
            version: '1.0.0'
        };
    }

    /**
     * GoBD Uyumlu Vergi Raporu Oluştur
     * @param {String} organizationId - Organization ID
     * @param {Object} dateRange - { start: Date, end: Date }
     * @param {Object} organization - Organization bilgileri
     * @returns {Promise<Buffer>} PDF buffer
     */
    async generateGoBDReport(organizationId, dateRange, organization) {
        const { AuditLog, Reservation } = require('../models');

        // Audit logları çek
        const auditLogs = await AuditLog.find({
            organization_id: organizationId,
            created_at: {
                $gte: new Date(dateRange.start),
                $lte: new Date(dateRange.end)
            }
        }).sort({ created_at: 1 }).lean();

        // Rezervasyonları çek
        const reservations = await Reservation.find({
            organization_id: organizationId,
            created_at: {
                $gte: new Date(dateRange.start),
                $lte: new Date(dateRange.end)
            },
            deleted_at: null
        }).sort({ created_at: 1 }).lean();

        // Rapor hashı oluştur (değiştirilemezlik için)
        const crypto = require('crypto');
        const reportData = JSON.stringify({ auditLogs, reservations, dateRange });
        const reportHash = crypto.createHash('sha256').update(reportData).digest('hex');

        // PDF döküman tanımı
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],

            header: {
                columns: [
                    { text: 'GoBD Uyumlu Rapor', style: 'headerText' },
                    { text: `Tarih: ${new Date().toLocaleDateString('de-DE')}`, alignment: 'right', style: 'headerText' }
                ],
                margin: [40, 20]
            },

            footer: function (currentPage, pageCount) {
                return {
                    columns: [
                        { text: `Hash: ${reportHash.substring(0, 16)}...`, style: 'footerText' },
                        { text: `Sayfa ${currentPage} / ${pageCount}`, alignment: 'right', style: 'footerText' }
                    ],
                    margin: [40, 20]
                };
            },

            content: [
                // Başlık
                { text: 'GoBD Uyumlu Vergi Raporu', style: 'title' },
                { text: 'Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern', style: 'subtitle' },

                { text: '', margin: [0, 10] },

                // Organizasyon bilgileri
                { text: 'Organizasyon Bilgileri', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*', '*'],
                        body: [
                            ['Organizasyon Adı', organization?.name || 'N/A'],
                            ['Vergi Numarası', organization?.tax_id || 'Belirtilmemiş'],
                            ['Rapor Dönemi', `${new Date(dateRange.start).toLocaleDateString('de-DE')} - ${new Date(dateRange.end).toLocaleDateString('de-DE')}`],
                            ['Oluşturma Tarihi', new Date().toLocaleString('de-DE')],
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 5, 0, 15]
                },

                // Özet
                { text: 'Özet Bilgiler', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*', '*'],
                        body: [
                            ['Toplam İşlem Sayısı (Audit Log)', auditLogs.length.toString()],
                            ['Toplam Rezervasyon Sayısı', reservations.length.toString()],
                            ['Rapor Hash (SHA-256)', reportHash.substring(0, 32) + '...'],
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 5, 0, 15]
                },

                // Rezervasyon özeti
                { text: 'Rezervasyon Özeti', style: 'sectionHeader' },
                this._generateReservationSummaryTable(reservations),

                // Audit log tablosu
                { text: '', pageBreak: 'before' },
                { text: 'İşlem Geçmişi (Audit Log)', style: 'sectionHeader' },
                this._generateAuditLogTable(auditLogs),

                // Onay bölümü
                { text: '', margin: [0, 30] },
                { text: 'Dijital Onay', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [`Bu rapor ${new Date().toISOString()} tarihinde otomatik olarak oluşturulmuştur.`],
                            [`Rapor Hash: ${reportHash}`],
                            ['Bu hash değeri raporun değiştirilmediğini doğrulamak için kullanılabilir.']
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 5, 0, 15]
                }
            ],

            styles: {
                title: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 5]
                },
                subtitle: {
                    fontSize: 10,
                    italics: true,
                    alignment: 'center',
                    color: '#666666',
                    margin: [0, 0, 0, 20]
                },
                sectionHeader: {
                    fontSize: 14,
                    bold: true,
                    color: '#2563eb',
                    margin: [0, 10, 0, 5]
                },
                tableHeader: {
                    bold: true,
                    fillColor: '#f3f4f6'
                },
                headerText: {
                    fontSize: 9,
                    color: '#666666'
                },
                footerText: {
                    fontSize: 8,
                    color: '#999999'
                }
            }
        };

        // PDF oluştur
        return new Promise((resolve, reject) => {
            try {
                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                const chunks = [];

                pdfDoc.on('data', chunk => chunks.push(chunk));
                pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', reject);

                pdfDoc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Rezervasyon özet tablosu oluştur
     */
    _generateReservationSummaryTable(reservations) {
        if (reservations.length === 0) {
            return { text: 'Bu dönemde rezervasyon bulunmamaktadır.', italics: true, margin: [0, 5, 0, 15] };
        }

        // Durumlara göre grupla
        const statusCounts = reservations.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {});

        // Toplam gelir
        const totalRevenue = reservations.reduce((sum, r) => sum + (r.total_with_tax || 0), 0);

        const tableBody = [
            [{ text: 'Metrik', style: 'tableHeader' }, { text: 'Değer', style: 'tableHeader' }],
            ['Toplam Rezervasyon', reservations.length.toString()],
            ['Toplam Gelir', `€${totalRevenue.toFixed(2)}`],
        ];

        // Status counts
        Object.entries(statusCounts).forEach(([status, count]) => {
            tableBody.push([`Durum: ${status}`, count.toString()]);
        });

        return {
            table: {
                widths: ['*', 'auto'],
                body: tableBody
            },
            layout: 'lightHorizontalLines',
            margin: [0, 5, 0, 15]
        };
    }

    /**
     * Audit log tablosu oluştur
     */
    _generateAuditLogTable(auditLogs) {
        if (auditLogs.length === 0) {
            return { text: 'Bu dönemde işlem kaydı bulunmamaktadır.', italics: true, margin: [0, 5, 0, 15] };
        }

        // Son 50 log (çok fazla olursa PDF büyür)
        const logsToShow = auditLogs.slice(-50);

        const tableBody = [
            [
                { text: 'Tarih', style: 'tableHeader' },
                { text: 'İşlem', style: 'tableHeader' },
                { text: 'Varlık', style: 'tableHeader' },
                { text: 'Açıklama', style: 'tableHeader' }
            ]
        ];

        logsToShow.forEach(log => {
            tableBody.push([
                new Date(log.created_at).toLocaleString('de-DE'),
                log.action || 'N/A',
                log.entity_type || 'N/A',
                (log.description || '').substring(0, 50) + ((log.description || '').length > 50 ? '...' : '')
            ]);
        });

        if (auditLogs.length > 50) {
            tableBody.push([{ text: `... ve ${auditLogs.length - 50} işlem daha`, colSpan: 4, italics: true }]);
        }

        return {
            table: {
                widths: ['auto', 'auto', 'auto', '*'],
                body: tableBody
            },
            layout: 'lightHorizontalLines',
            margin: [0, 5, 0, 15]
        };
    }

    /**
     * Rezervasyon detay raporu oluştur
     */
    async generateReservationReport(reservationId) {
        const { Reservation } = require('../models');

        const reservation = await Reservation.findById(reservationId)
            .populate('property_id', 'name')
            .populate('room_type_id', 'name')
            .populate('rate_plan_id', 'name')
            .lean();

        if (!reservation) {
            throw new Error('Reservation not found');
        }

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],

            content: [
                { text: 'Rezervasyon Onay Belgesi', style: 'title' },
                { text: `Referans: ${reservation.booking_reference}`, style: 'subtitle' },

                { text: 'Misafir Bilgileri', style: 'sectionHeader', margin: [0, 20, 0, 5] },
                {
                    table: {
                        widths: ['*', '*'],
                        body: [
                            ['İsim', reservation.guest?.name || 'N/A'],
                            ['E-posta', reservation.guest?.email || 'N/A'],
                            ['Telefon', reservation.guest?.phone || 'N/A'],
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },

                { text: 'Konaklama Detayları', style: 'sectionHeader', margin: [0, 20, 0, 5] },
                {
                    table: {
                        widths: ['*', '*'],
                        body: [
                            ['Otel', reservation.property_id?.name || 'N/A'],
                            ['Oda Tipi', reservation.room_type_id?.name || 'N/A'],
                            ['Fiyat Planı', reservation.rate_plan_id?.name || 'N/A'],
                            ['Giriş', new Date(reservation.check_in_date).toLocaleDateString('de-DE')],
                            ['Çıkış', new Date(reservation.check_out_date).toLocaleDateString('de-DE')],
                            ['Gece Sayısı', (reservation.nights || 0).toString()],
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },

                { text: 'Ödeme Bilgileri', style: 'sectionHeader', margin: [0, 20, 0, 5] },
                {
                    table: {
                        widths: ['*', '*'],
                        body: [
                            ['Toplam (Vergisiz)', `€${(reservation.total_price || 0).toFixed(2)}`],
                            ['Vergi', `€${(reservation.tax_amount || 0).toFixed(2)}`],
                            ['Toplam', `€${(reservation.total_with_tax || 0).toFixed(2)}`],
                        ]
                    },
                    layout: 'lightHorizontalLines'
                }
            ],

            styles: {
                title: { fontSize: 18, bold: true, alignment: 'center' },
                subtitle: { fontSize: 12, alignment: 'center', color: '#666666', margin: [0, 0, 0, 20] },
                sectionHeader: { fontSize: 14, bold: true, color: '#2563eb' }
            }
        };

        return new Promise((resolve, reject) => {
            try {
                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                const chunks = [];

                pdfDoc.on('data', chunk => chunks.push(chunk));
                pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', reject);

                pdfDoc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
    /**
     * B2B Paket Teklif PDF'i Oluştur (Package Proposal)
     */
    async generatePackageProposal(pkg, organization) {
        // PDF döküman tanımı
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 80],

            header: {
                columns: [
                    { text: 'Seyehat Teklifi (Travel Proposal)', style: 'headerText' },
                    { text: `Tarih: ${new Date().toLocaleDateString('de-DE')}`, alignment: 'right', style: 'headerText' }
                ],
                margin: [40, 20]
            },

            footer: function (currentPage, pageCount) {
                return {
                    columns: [
                        { text: organization?.name || 'TravelSync Agency', style: 'footerText' },
                        { text: `Sayfa ${currentPage} / ${pageCount}`, alignment: 'right', style: 'footerText' }
                    ],
                    margin: [40, 20]
                };
            },

            content: [
                // Başlık ve Acente Bilgileri
                {
                    columns: [
                        { text: organization?.name || 'Acente Adı', style: 'agencyTitle' },
                        { text: `Teklif Kodu: ${pkg.code || 'N/A'}`, alignment: 'right', style: 'quoteCode' }
                    ]
                },
                { text: organization?.contact?.email || '', style: 'agencyContact' },
                { text: organization?.contact?.phone || '', style: 'agencyContact', margin: [0, 0, 0, 30] },

                // Paket Özeti
                { text: pkg.name || 'Özel Paket Tur', style: 'title' },
                { text: pkg.description || 'Bu teklif size özel hazırlanmıştır.', margin: [0, 0, 0, 20] },

                // Temel Bilgiler Tablosu
                { text: 'Tur Özeti', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*', '*'],
                        body: [
                            ['Varış Noktası', `${pkg.destination?.city || ''}, ${pkg.destination?.country || ''}`],
                            ['Süre', `${pkg.duration?.nights || 0} Gece / ${pkg.duration?.days || 0} Gün`],
                            ['Tarih Aralığı', `${new Date(pkg.valid_from).toLocaleDateString('de-DE')} - ${new Date(pkg.valid_to).toLocaleDateString('de-DE')}`],
                            ['Tur Tipi', pkg.package_type || 'Custom']
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 5, 0, 20]
                },

                // Konaklama
                this._generatePackageAccommodationTable(pkg.accommodation),

                // Ekstralar
                this._generatePackageExtrasTable(pkg),

                // Fiyat Özeti
                { text: '', margin: [0, 20] },
                { text: 'Fiyat Detayı', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            [{ text: 'Kişi Başı Ücret', style: 'tableHeader' }, { text: 'Tutar', style: 'tableHeader' }],
                            ['YetişkinFiyatı', `${pkg.pricing?.price_adult || 0} ${pkg.pricing?.currency || 'EUR'}`],
                            ...(pkg.pricing?.price_child ? [['Çocuk Fiyatı', `${pkg.pricing.price_child} ${pkg.pricing?.currency || 'EUR'}`]] : []),
                            ...(pkg.pricing?.single_supplement ? [['Tek Kişi Farkı', `${pkg.pricing.single_supplement} ${pkg.pricing?.currency || 'EUR'}`]] : []),
                            ['Pakete Dahil Olanlar', { text: `${pkg.pricing?.includes_transfers ? 'Transfer ✔\n' : ''}${pkg.pricing?.includes_activities ? 'Aktivite ✔' : ''}`, italics: true }]
                        ]
                    },
                    layout: 'headerLineOnly',
                    margin: [0, 5, 0, 30]
                },

                // Kurallar ve Şartlar
                { text: 'Kurallar ve İptal Şartları', style: 'sectionHeader' },
                { text: pkg.cancellation_policy || 'Standart iptal kuralları geçerlidir.', fontSize: 10, margin: [0, 5, 0, 10] },
                { text: pkg.terms_conditions || '', fontSize: 10 }
            ],

            styles: {
                title: { fontSize: 22, bold: true, color: '#1e3a8a', margin: [0, 0, 0, 5] },
                agencyTitle: { fontSize: 16, bold: true, color: '#334155' },
                quoteCode: { fontSize: 14, color: '#64748b' },
                agencyContact: { fontSize: 10, color: '#64748b' },
                sectionHeader: { fontSize: 14, bold: true, color: '#2563eb', margin: [0, 10, 0, 5] },
                tableHeader: { bold: true, fillColor: '#f3f4f6' },
                headerText: { fontSize: 9, color: '#666666' },
                footerText: { fontSize: 8, color: '#999999' }
            }
        };

        // PDF oluştur
        return new Promise((resolve, reject) => {
            try {
                // The constructor is initialized at the top level of this file 
                // so we use that instance: this assumes `printer` is globally defined in this file.
                // However, pdfmake needs to be initialized. The file already has `const printer = new PdfPrinter(fonts);` at top.
                // We'll just rely on the existing instance from line 19.
                // Wait, it's outside class. So we can just use `printer.createPdfKitDocument`.

                // Note: The file defines `const printer = new PdfPrinter(fonts);` at line 19 outside class.
                // We shouldn't require it again here but use the outer scope variable.
                const pdfmake = require('pdfmake');
                const fonts = {
                    Roboto: {
                        normal: 'node_modules/pdfmake/build/vfs_fonts/Roboto-Regular.ttf',
                        bold: 'node_modules/pdfmake/build/vfs_fonts/Roboto-Medium.ttf',
                        italics: 'node_modules/pdfmake/build/vfs_fonts/Roboto-Italic.ttf',
                        bolditalics: 'node_modules/pdfmake/build/vfs_fonts/Roboto-MediumItalic.ttf'
                    }
                };
                const localPrinter = new pdfmake(fonts);

                const pdfDoc = localPrinter.createPdfKitDocument(docDefinition);
                const chunks = [];

                pdfDoc.on('data', chunk => chunks.push(chunk));
                pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', reject);

                pdfDoc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    _generatePackageAccommodationTable(accommodation) {
        if (!accommodation || accommodation.length === 0) {
            return { text: '' };
        }

        const tableBody = [
            [{ text: 'Otel', style: 'tableHeader' }, { text: 'Oda Tipi', style: 'tableHeader' }, { text: 'Pansiyon', style: 'tableHeader' }, { text: 'Gece', style: 'tableHeader' }]
        ];

        accommodation.forEach(acc => {
            tableBody.push([
                acc.hotel_name || 'Bilinmiyor',
                acc.room_name || 'Standart',
                acc.board_type ? acc.board_type.replace('_', ' ').toUpperCase() : 'Bilinmiyor',
                (acc.nights || 0).toString()
            ]);
        });

        return [
            { text: 'Konaklama Planı', style: 'sectionHeader' },
            {
                table: { widths: ['*', 'auto', 'auto', 'auto'], body: tableBody },
                layout: 'lightHorizontalLines',
                margin: [0, 5, 0, 15]
            }
        ];
    }

    _generatePackageExtrasTable(pkg) {
        const hasTransfers = pkg.transfers && pkg.transfers.length > 0;
        const hasActivities = pkg.activities && pkg.activities.length > 0;

        if (!hasTransfers && !hasActivities) return { text: '' };

        const tableBody = [
            [{ text: 'Tür', style: 'tableHeader' }, { text: 'Açıklama', style: 'tableHeader' }, { text: 'Dahil mi?', style: 'tableHeader' }]
        ];

        if (hasTransfers) {
            pkg.transfers.forEach(t => {
                tableBody.push([
                    'Transfer',
                    `${t.type ? t.type.replace('_', ' ') : 'Transfer'} - ${t.from_location || ''} -> ${t.to_location || ''}`,
                    t.included ? 'Evet' : 'Hayır'
                ]);
            });
        }

        if (hasActivities) {
            pkg.activities.forEach(a => {
                tableBody.push([
                    'Aktivite',
                    a.name || 'Tur Programı',
                    a.included ? 'Evet' : 'Hayır'
                ]);
            });
        }

        return [
            { text: 'Transfer ve Aktiviteler', style: 'sectionHeader' },
            {
                table: { widths: ['auto', '*', 'auto'], body: tableBody },
                layout: 'lightHorizontalLines',
                margin: [0, 5, 0, 15]
            }
        ];
    }
}

module.exports = new PdfService();
