// Pojagi Studio — PDF Export
import { fmtDim } from './calculator.js';

export function exportPDF(config, pattern, canvasElement) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('portrait', 'pt', 'letter');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;

  // --- Page 1: Client Preview ---
  doc.setFontSize(20);
  doc.text('StellaLeeStudio', margin, margin);

  doc.setFontSize(14);
  const patternNames = { tile: 'Tile', frame: 'Frame', square: 'Square', diamond: 'Diamond', nested: 'Nested Rectangle' };
  const patternName = patternNames[config.patternName] || config.patternName;
  doc.text(`Pattern: ${patternName}`, margin, margin + 24);

  // Render canvas image
  const imgData = canvasElement.toDataURL('image/png');
  const canvasAspect = canvasElement.width / canvasElement.height;
  const maxImgW = contentW;
  const maxImgH = pageH - 200;
  let imgW, imgH;
  if (canvasAspect > maxImgW / maxImgH) {
    imgW = maxImgW;
    imgH = maxImgW / canvasAspect;
  } else {
    imgH = maxImgH;
    imgW = maxImgH * canvasAspect;
  }
  const imgX = margin + (contentW - imgW) / 2;
  const imgY = margin + 40;
  doc.addImage(imgData, 'PNG', imgX, imgY, imgW, imgH);

  // Dimensions label
  let y = imgY + imgH + 20;
  doc.setFontSize(11);
  doc.text(`Overall: ${config.width}" W x ${config.height}" H`, margin, y);
  y += 16;
  doc.text(`Hems — Sides: ${config.hemSides}"  Top: ${config.hemTop}"  Bottom: ${config.hemBottom}"  |  Seam: ${config.seamAllowance}"`, margin, y);
  y += 16;

  // Tile layout summary (if pattern has _layout)
  if (pattern._layout) {
    const layout = pattern._layout(config);
    if (layout.tileW && layout.tileH) {
      doc.text(`${layout.cols} × ${layout.rows} tiles, each ${fmtDim(layout.tileW)}" × ${fmtDim(layout.tileH)}"`, margin, y);
      y += 16;
      const actualW = layout.cols * layout.tileW;
      const actualH = layout.rows * layout.tileH;
      const diffW = config.width - actualW;
      const diffH = config.height - actualH;
      if (Math.abs(diffW) > 0.001 || Math.abs(diffH) > 0.001) {
        const parts = [];
        if (Math.abs(diffW) > 0.001) parts.push(`${fmtDim(diffW)}" width`);
        if (Math.abs(diffH) > 0.001) parts.push(`${fmtDim(diffH)}" height`);
        doc.setTextColor(192, 57, 43);
        doc.text(`Remainder: ${parts.join(', ')}`, margin, y);
        doc.setTextColor(0);
        y += 16;
      }
    }
  }
  y += 8;

  // Color legend
  const usedColors = {};
  for (const [zoneId, color] of Object.entries(config.zoneColors)) {
    if (!usedColors[color.hex]) {
      usedColors[color.hex] = color;
    }
  }
  const colorList = Object.values(usedColors);
  if (colorList.length > 0) {
    doc.setFontSize(12);
    doc.text('Colors Used:', margin, y);
    y += 16;
    for (const c of colorList) {
      doc.setFillColor(c.hex);
      doc.rect(margin, y - 8, 12, 12, 'F');
      doc.setDrawColor(180);
      doc.rect(margin, y - 8, 12, 12, 'S');
      doc.setFontSize(10);
      doc.setTextColor(0);
      const source = c.line ? `(${c.line})` : '';
      doc.text(`${c.name} ${source}`, margin + 18, y + 1);
      y += 18;
    }
  }

  // --- Page 2: Cut Sheet ---
  doc.addPage();
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text('Cut Sheet', margin, margin);

  doc.setFontSize(11);
  doc.text(`Pattern: ${patternName}  |  ${config.width}" x ${config.height}"`, margin, margin + 20);

  let cutY = margin + 36;
  if (pattern._layout) {
    const layout = pattern._layout(config);
    if (layout.tileW && layout.tileH) {
      doc.text(`${layout.cols} × ${layout.rows} tiles, each ${fmtDim(layout.tileW)}" × ${fmtDim(layout.tileH)}"`, margin, cutY);
      cutY += 14;
      const actualW = layout.cols * layout.tileW;
      const actualH = layout.rows * layout.tileH;
      const diffW = config.width - actualW;
      const diffH = config.height - actualH;
      if (Math.abs(diffW) > 0.001 || Math.abs(diffH) > 0.001) {
        const parts = [];
        if (Math.abs(diffW) > 0.001) parts.push(`${fmtDim(diffW)}" width`);
        if (Math.abs(diffH) > 0.001) parts.push(`${fmtDim(diffH)}" height`);
        doc.setTextColor(192, 57, 43);
        doc.text(`Remainder: ${parts.join(', ')}`, margin, cutY);
        doc.setTextColor(0);
        cutY += 14;
      }
    }
  }

  const cuts = pattern.calculateCuts(config);

  // Table header
  const colX = [margin, margin + 160, margin + 195, margin + 280, margin + 350, margin + 420];
  const headers = ['Piece', 'Qty', 'Color', 'Cut W', 'Cut H', 'Visible'];
  y = cutY + 12;
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], colX[i], y);
  }
  doc.setFont(undefined, 'normal');
  y += 4;
  doc.setDrawColor(0);
  doc.line(margin, y, pageW - margin, y);
  y += 14;

  // Table rows
  const fabricTotals = {};
  for (const cut of cuts) {
    doc.text(cut.name, colX[0], y);
    doc.text(String(cut.quantity), colX[1], y);

    if (cut.color) {
      doc.setFillColor(cut.color);
      doc.rect(colX[2], y - 8, 10, 10, 'F');
      doc.setDrawColor(180);
      doc.rect(colX[2], y - 8, 10, 10, 'S');
      doc.setTextColor(0);
      doc.text(cut.colorName || '', colX[2] + 14, y);
    } else {
      doc.text('—', colX[2], y);
    }

    doc.text(`${fmtDim(cut.cutWidth)}"`, colX[3], y);
    doc.text(`${fmtDim(cut.cutHeight)}"`, colX[4], y);
    if (cut.visibleWidth && cut.visibleHeight) {
      doc.text(`${fmtDim(cut.visibleWidth)}" x ${fmtDim(cut.visibleHeight)}"`, colX[5], y);
    }
    y += 16;

    // Accumulate fabric totals
    const colorKey = cut.color || 'unassigned';
    if (!fabricTotals[colorKey]) {
      fabricTotals[colorKey] = { name: cut.colorName || 'Unassigned', hex: cut.color, area: 0 };
    }
    fabricTotals[colorKey].area += cut.quantity * cut.cutWidth * cut.cutHeight;
  }

  // Fabric yardage summary
  y += 10;
  doc.setDrawColor(0);
  doc.line(margin, y, pageW - margin, y);
  y += 18;
  doc.setFont(undefined, 'bold');
  doc.text('Fabric Yardage Estimate (58" bolt width):', margin, y);
  doc.setFont(undefined, 'normal');
  y += 16;

  const boltWidth = 58;
  for (const [key, total] of Object.entries(fabricTotals)) {
    const linearInches = total.area / boltWidth;
    const yards = Math.ceil(linearInches / 36 * 10) / 10;
    if (total.hex) {
      doc.setFillColor(total.hex);
      doc.rect(margin, y - 8, 10, 10, 'F');
      doc.setDrawColor(180);
      doc.rect(margin, y - 8, 10, 10, 'S');
    }
    doc.setTextColor(0);
    doc.text(`${total.name}: ${yards} yd`, margin + 16, y);
    y += 16;
  }

  // Seam allowance reference
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Internal seam: ${config.seamAllowance}" per side  |  Sides/Bottom hem: ${config.hemSides}"  |  Top hem: ${config.hemTop}"`, margin, y);

  doc.save('pojagi-studio-export.pdf');
}

// --- Client PDF: clean single-page preview for sharing ---
export function exportClientPDF(config, pattern, canvasElement) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('portrait', 'pt', 'letter');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const bottomMargin = 60;
  const contentW = pageW - margin * 2;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(44, 62, 80); // #2c3e50
  doc.text('StellaLeeStudio', margin, margin + 4);

  // Pattern name
  const patternNames = { tile: 'Tile', frame: 'Frame', square: 'Square', diamond: 'Diamond', nested: 'Nested Rectangle' };
  const patternName = patternNames[config.patternName] || config.patternName;
  doc.setFontSize(13);
  doc.setTextColor(100);
  doc.text(`${patternName}  —  ${config.width}" x ${config.height}"`, margin, margin + 22);

  // Canvas image (no dimensions shown — caller should ensure design view without dims)
  const imgData = canvasElement.toDataURL('image/png');
  const canvasAspect = canvasElement.width / canvasElement.height;

  // Available space for image
  const imgTop = margin + 40;
  const colorLegendH = Object.keys(config.zoneColors).length > 0 ? 100 : 0;
  const maxImgH = pageH - imgTop - bottomMargin - colorLegendH - 10;
  const maxImgW = contentW;

  let imgW, imgH;
  if (canvasAspect > maxImgW / maxImgH) {
    imgW = maxImgW;
    imgH = maxImgW / canvasAspect;
  } else {
    imgH = maxImgH;
    imgW = maxImgH * canvasAspect;
  }
  const imgX = margin + (contentW - imgW) / 2;
  doc.addImage(imgData, 'PNG', imgX, imgTop, imgW, imgH);

  // Color legend
  let y = imgTop + imgH + 20;
  const usedColors = {};
  for (const [zoneId, color] of Object.entries(config.zoneColors)) {
    if (!usedColors[color.hex]) {
      usedColors[color.hex] = color;
    }
  }
  const colorList = Object.values(usedColors);
  if (colorList.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text('Colors:', margin, y);
    y += 14;
    for (const c of colorList) {
      doc.setFillColor(c.hex);
      doc.rect(margin, y - 8, 10, 10, 'F');
      doc.setDrawColor(180);
      doc.rect(margin, y - 8, 10, 10, 'S');
      doc.setFontSize(9);
      doc.setTextColor(60);
      const source = c.line ? `(${c.line})` : '';
      doc.text(`${c.name} ${source}`, margin + 16, y);
      y += 14;
    }
  }

  // Etsy URL — bottom right
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('etsy.com/shop/StellaLeeStudio', pageW - margin, pageH - bottomMargin + 20, { align: 'right' });

  doc.save('pojagi-studio-client.pdf');
}
