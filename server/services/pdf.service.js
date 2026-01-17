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
}

module.exports = new PdfService();
