import roadozLogo from "../assets/images/RO-2.png";

// Named Export
export const generateTripSheetPrint = (data) => {
  if (!data) return;

  const printWindow = window.open("", "_blank");
  // Use a fallback for ID if not a string
  const manifestIdShort = typeof data.id === 'string' ? data.id.split('-')[0].toUpperCase() : 'NEW';
  const tripDate = data.created_at ? new Date(data.created_at).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB");

  // Calculate Totals for Footer
  const summary = (data.parcel_orders || []).reduce((acc, o) => {
    const freight = Number(o.total_freight) || 0;
    const boxes = Number(o.qty) || 1;
    acc.totalFreight += freight;
    acc.totalBoxes += boxes;

    if (o.payment_method === "To Pay") { acc.tpF += freight; acc.tpB += boxes; }
    else if (o.payment_method === "Prepaid") { acc.pdF += freight; acc.pdB += boxes; }
    else { acc.acF += freight; acc.acB += boxes; }
    return acc;
  }, { totalFreight: 0, totalBoxes: 0, tpF: 0, tpB: 0, pdF: 0, pdB: 0, acF: 0, acB: 0 });

  const rows = (data.parcel_orders || []).map((order, index) => {
    const type = order.payment_method === "To Pay" ? "TP" : order.payment_method === "Prepaid" ? "PD" : "AC";
    return `
      <tr>
        <td style="text-align:center">${index + 1}</td>
        <td>${new Date(order.created_at).toLocaleDateString("en-GB")}</td>
        <td style="font-weight:bold">${order.order_number}</td>
        <td><b>${(order.sender_name || '').toUpperCase()}</b><br/><span style="font-size:7px">${order.sender_address_line_1 || ''}, ${order.sender_city || ''}</span></td>
        <td><b>${(order.receiver_name || '').toUpperCase()}</b><br/><span style="font-size:7px">${order.receiver_address_line_1 || ''}, ${order.receiver_city || ''}</span></td>
        <td>${(order.receiver_city || '').toUpperCase()}</td>
        <td style="text-align:center">1</td>
        <td style="text-align:center; font-weight:bold">${type}</td>
        <td style="text-align:center">${order.qty || 1}</td>
        <td style="text-align:right">${Number(order.total_freight || 0).toFixed(2)}</td>
        <td style="text-align:center">0</td>
        <td style="text-align:center">0</td>
        <td style="text-align:right; font-weight:bold">${Number(order.total_freight || 0).toFixed(2)}</td>
        <td></td>
      </tr>
    `;
  }).join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Manifest ${manifestIdShort}</title>
        <style>
          @page { size: A4 landscape; margin: 5mm; }
          body { font-family: sans-serif; font-size: 9px; margin: 0; padding: 10px; background: white; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          th, td { border: 1px solid black; padding: 4px; }
          th { background: #f0f0f0; text-transform: uppercase; font-size: 8px; }
          .header-box { display: flex; justify-content: space-between; align-items: center; border: 2px solid black; padding: 10px; margin-bottom: 5px; }
          .summary-grid { display: flex; border: 2px solid black; border-top: none; }
          .summary-col { flex: 1; padding: 5px; border-right: 1px solid black; }
          .sig-section { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 40px; }
          .sig-box { text-align: center; border-top: 1px solid black; width: 150px; padding-top: 5px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div><img src="${roadozLogo}" style="height:40px" /></div>
          <div style="text-align:center">
            <h1 style="margin:0; font-size:18px">DELIVERY & COLLECTION STATEMENT</h1>
            <p style="margin:0; font-weight:bold">HUB TRANSFER: ${data.city || 'MAIN'} TO ${data.city_destination || 'DESTINATION'}</p>
          </div>
          <div style="text-align:right">
            <b>MANIFEST ID:</b> DISP${manifestIdShort}<br>
            <b>DATE:</b> ${tripDate}<br>
            <b>VEHICLE:</b> ${data.vehicle_number || data.vehicle_id || 'N/A'}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>SL</th><th>DATE</th><th>LR NO</th><th width="18%">CONSIGNOR</th><th width="18%">CONSIGNEE</th>
              <th>DESTINATION</th><th>INV</th><th>TYPE</th><th>BOX</th><th>FREIGHT</th><th>TA</th><th>BD</th><th>BALANCE</th><th>REMARKS</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="summary-grid">
          <div class="summary-col"><b>TOTAL MANIFEST</b><br>Freight: ${summary.totalFreight.toFixed(2)}<br>Boxes: ${summary.totalBoxes}</div>
          <div class="summary-col"><b>TOPAY (TP)</b><br>Freight: ${summary.tpF.toFixed(2)}<br>Boxes: ${summary.tpB}</div>
          <div class="summary-col"><b>PREPAID (PD)</b><br>Freight: ${summary.pdF.toFixed(2)}<br>Boxes: ${summary.pdB}</div>
          <div class="summary-col"><b>ACCOUNT (AC)</b><br>Freight: ${summary.acF.toFixed(2)}<br>Boxes: ${summary.acB}</div>
        </div>
        <div class="sig-section">
          <div class="sig-box">Dispatched By<br/><span style="font-size:8px">Authorized Signatory</span></div>
          <div class="sig-box">Driver's Signature<br/><span style="font-size:8px">(${data.driver_name || 'Driver'})</span></div>
          <div class="sig-box">Received By<br/><span style="font-size:8px">Receiver Stamp</span></div>
        </div>
        <script>
          window.onload = () => { 
            setTimeout(() => { 
              window.print(); 
              // window.close(); // Optional: uncomment if you want the tab to close after printing
            }, 700); 
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// Add this line at the bottom to prevent "export not found" errors
export default generateTripSheetPrint;