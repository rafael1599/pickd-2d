import { jsPDF } from "jspdf";
import "jspdf-autotable";

/**
 * Generates a PDF report for the consolidation movements.
 */
export function generatePDFReport(consolidationResult) {
    if (!consolidationResult || !consolidationResult.plan) return;

    const doc = new jsPDF();
    const date = new Date().toLocaleString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22); // Orange-500
    doc.text("WAREHOUSE OPS: PLAN DE CONSOLIDACION", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado: ${date}`, 14, 30);
    doc.text(`Objetivo: Desocupar Bay 3 (Rows 20-34) → Bay 1 & 2`, 14, 35);

    // Stats
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("RESUMEN DE OPERACION", 14, 50);
    
    const statsData = [
        ["Total Items en Bay 3", consolidationResult.stats.totalItemsProposed],
        ["Items Reubicados", consolidationResult.stats.totalItemsMoved],
        ["Items que permanecen en Bay 3", consolidationResult.stats.unplacedItems]
    ];
    
    doc.autoTable({
        startY: 55,
        head: [["Concepto", "Cantidad"]],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40] }
    });

    // Movements Table
    doc.setFontSize(14);
    doc.text("LISTA DE MOVIMIENTOS LOGISTICOS", 14, doc.lastAutoTable.finalY + 15);

    const movements = consolidationResult.plan.map((move, index) => [
        index + 1,
        move.sku,
        move.qty,
        `ROW ${move.from}`,
        `ROW ${move.to}`
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [["#", "SKU", "QTY", "DESDE (Origen)", "HACIA (Destino)"]],
        body: movements,
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22] }, // Orange-500
        columnStyles: {
            0: { cellWidth: 10 },
            2: { cellWidth: 20 },
            3: { fontStyle: 'bold' },
            4: { fontStyle: 'bold', textColor: [249, 115, 22] }
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Hoja ${i} de ${pageCount} - Warehouse Visualizer v1.0`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`Warehouse_Consolidation_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
