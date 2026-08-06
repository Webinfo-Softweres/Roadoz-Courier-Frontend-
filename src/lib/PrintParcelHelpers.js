import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import roadozLogo from "../assets/images/RO-2.png";

const drawExactInvoice = (doc, order) => {
  const LEFT = 8;
  const RIGHT = 140; 
  const WIDTH = RIGHT - LEFT;
  
  // Adjusted column splits for "Big Address"
  // Col 1: Label (25mm) | Col 2: Value (41mm) | Col 3: Label (25mm) | Col 4: Value (41mm)
  const COL_1_WIDTH = 25;
  const COL_2_WIDTH = 41;
  const COL_LABEL_VAL_SPLIT = LEFT + COL_1_WIDTH; // 33
  const COL_MIDDLE = LEFT + (WIDTH / 2);         // 74
  const COL_RIGHT_LABEL_VAL_SPLIT = COL_MIDDLE + COL_1_WIDTH; // 99

  let currY = 12;

  const drawGrid = (x, y, w, h) => doc.rect(x, y, w, h);

  // --- TOP LABEL ---
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CONSIGNEE COPY", RIGHT, currY - 3, { align: "right" });

  // 1. HEADER SECTION
  drawGrid(LEFT, currY, WIDTH, 24);
  doc.line(LEFT + 45, currY, LEFT + 45, currY + 24); 
  try {
    doc.addImage(roadozLogo, "PNG", LEFT + 5, currY + 4, 35, 15);
  } catch (e) {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ROADOZ PVT. LTD.", LEFT + 48, currY + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Courier And Cargo", LEFT + 48, currY + 11);
  doc.setFontSize(6.5);
  doc.text("Room No: 122, DD Vyapar Bhavan, Kadavanthra, Kochi-682020", LEFT + 48, currY + 14);
  doc.text("Phone: +91 9496630687 | Email: info@roadoz.com", LEFT + 48, currY + 17);
  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN: 32AAPCR1988L1ZP      AWB NO: ${order.order_number || "N/A"}`, LEFT + 48, currY + 21);

  currY += 24;

  // 2. META BAR
  drawGrid(LEFT, currY, WIDTH, 16);
  doc.line(LEFT + 35, currY, LEFT + 35, currY + 16); 
  doc.line(LEFT + 70, currY, LEFT + 70, currY + 16); 
  doc.line(LEFT + 95, currY, LEFT + 95, currY + 16); 

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("DATE & TIME", LEFT + 2, currY + 4);
  doc.setFontSize(7);
  const dateStr = order.created_at ? new Date(order.created_at).toLocaleString('en-GB') : "N/A";
  doc.text(dateStr, LEFT + 2, currY + 9);
  doc.text(`Service: ${order.service_type || "Surface"}`, LEFT + 2, currY + 13);

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(14);
  doc.text((order.payment_method || "TO PAY").toUpperCase(), LEFT + 52.5, currY + 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("TOTAL QTY", LEFT + 72, currY + 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(String(order.qty || order.total_boxes || 1), LEFT + 82.5, currY + 11, { align: "center" });

  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, order.order_number || "ORD", { format: "CODE128", displayValue: false, height: 40, margin: 0 });
    doc.addImage(canvas.toDataURL("image/png"), 'PNG', LEFT + 98, currY + 1.5, 38, 11);
    doc.setFontSize(6);
    doc.text(order.order_number || "", LEFT + 117, currY + 14.5, { align: "center" });
  } catch (e) {}

  currY += 16;

  // 3. ROUTE BAR
  drawGrid(LEFT, currY, WIDTH, 8);
  doc.line(COL_MIDDLE, currY, COL_MIDDLE, currY + 8);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`FROM : ${order.sender_city?.toUpperCase() || "N/A"}`, LEFT + 2, currY + 5.5);
  doc.text(`DESTINATION : ${order.receiver_city?.toUpperCase() || "N/A"}`, COL_MIDDLE + 2, currY + 5.5);

  currY += 8;

  // 4. ADDRESS & INFO GRID (Redesigned for bigger addresses)
  const gridH = 40; // Increased height
  drawGrid(LEFT, currY, WIDTH, gridH);
  
  // Vertical Lines
  doc.line(COL_LABEL_VAL_SPLIT, currY, COL_LABEL_VAL_SPLIT, currY + gridH);
  doc.line(COL_MIDDLE, currY, COL_MIDDLE, currY + gridH);
  doc.line(COL_RIGHT_LABEL_VAL_SPLIT, currY, COL_RIGHT_LABEL_VAL_SPLIT, currY + gridH);

  // Horizontal Row Dividers
  doc.line(LEFT, currY + 8, RIGHT, currY + 8); // Name Row
  doc.line(LEFT, currY + 24, RIGHT, currY + 24); // Address Row (BIG)
  doc.line(LEFT, currY + 32, RIGHT, currY + 32); // Contact Row

  doc.setFontSize(7);
  
  // --- Row 1: Names ---
  doc.setFont("helvetica", "normal");
  doc.text("CONSIGNOR", LEFT + 2, currY + 5);
  doc.setFont("helvetica", "bold");
  doc.text(order.sender_name || "N/A", COL_LABEL_VAL_SPLIT + 2, currY + 5);
  
  doc.setFont("helvetica", "normal");
  doc.text("CONSIGNEE", COL_MIDDLE + 2, currY + 5);
  doc.setFont("helvetica", "bold");
  doc.text(order.receiver_name || "N/A", COL_RIGHT_LABEL_VAL_SPLIT + 2, currY + 5);

  // --- Row 2: Address (Big Wrap Area) ---
  currY += 8;
  doc.setFont("helvetica", "normal");
  doc.text("ADDRESS", LEFT + 2, currY + 6);
  doc.setFontSize(6.5);
  const sAddr = doc.splitTextToSize(order.sender_address_line_1 || "N/A", COL_2_WIDTH - 4);
  doc.text(sAddr, COL_LABEL_VAL_SPLIT + 2, currY + 5);

  doc.setFontSize(7);
  doc.text("ADDRESS", COL_MIDDLE + 2, currY + 6);
  doc.setFontSize(6.5);
  const rAddr = doc.splitTextToSize(order.receiver_address_line_1 || "N/A", COL_2_WIDTH - 4);
  doc.text(rAddr, COL_RIGHT_LABEL_VAL_SPLIT + 2, currY + 5);

  // --- Row 3: Contact/Pin ---
  currY += 16;
  doc.setFontSize(7);
  doc.text("CONTACT/PIN", LEFT + 2, currY + 5);
  doc.text(`${order.sender_mobile || "N/A"} / ${order.sender_pincode || ""}`, COL_LABEL_VAL_SPLIT + 2, currY + 5);
  
  doc.text("CONTACT/PIN", COL_MIDDLE + 2, currY + 5);
  doc.text(`${order.receiver_mobile || "N/A"} / ${order.receiver_pincode || ""}`, COL_RIGHT_LABEL_VAL_SPLIT + 2, currY + 5);

  // --- Row 4: Logistics info ---
  currY += 8;
  doc.text(`WT: ${order.weight_kg || 1} KG`, LEFT + 2, currY + 5);
  doc.text(`VALUE: ${order.order_value || 0}`, COL_LABEL_VAL_SPLIT + 2, currY + 5);
  
  doc.text(`DISTRICT`, COL_MIDDLE + 2, currY + 5);
  doc.setFont("helvetica", "bold");
  doc.text(order.receiver_city?.toUpperCase() || "N/A", COL_RIGHT_LABEL_VAL_SPLIT + 2, currY + 5);

  currY += 8;

  // 5. CHARGES TABLE
  const tableH = 32;
  drawGrid(LEFT, currY, WIDTH, tableH);
  doc.line(LEFT + 95, currY, LEFT + 95, currY + tableH); 
  doc.line(LEFT + 115, currY, LEFT + 115, currY + tableH - 8); 
  doc.line(LEFT, currY + 7, RIGHT, currY + 7); 

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ITEM DESCRIPTION", LEFT + 2, currY + 4.5);
  doc.text("Charges", LEFT + 97, currY + 4.5);
  doc.text("Amount", RIGHT - 2, currY + 4.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${order.product_name || "General Parcel"}`, LEFT + 2, currY + 13);
  doc.setFontSize(7);
  doc.text(`SKU: ${order.sku || "N/A"} | Qty: ${order.qty || 1}`, LEFT + 2, currY + 18);

  const chargeLabel = order.payment_method === "Prepaid" ? "Prepaid Amt" : "To Pay Amt";
  doc.text(chargeLabel, LEFT + 97, currY + 13);
  doc.text(parseFloat(order.total_freight || 0).toFixed(2), RIGHT - 2, currY + 13, { align: "right" });

  // Total Bar
  doc.line(LEFT + 95, currY + tableH - 8, RIGHT, currY + tableH - 8);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", LEFT + 97, currY + tableH - 2.5);
  doc.text(parseFloat(order.total_freight || 0).toFixed(2), RIGHT - 2, currY + tableH - 2.5, { align: "right" });

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("BANK: HDFC | A/C: 50200116941777 | IFSC: HDFC0002321", LEFT + 2, currY + tableH - 2.5);

  currY += tableH;

  // 6. FOOTER
  doc.setFontSize(6);
  const terms = "Terms: (1) All shipments subject to standard carriage terms. (2) ROADOZ not responsible for illegal contents. (3) Liability limited to Rs 100 unless insured.";
  doc.text(terms, LEFT, currY + 5);

  const sigY = currY + 18;
  doc.line(LEFT + 5, sigY, LEFT + 45, sigY);
  doc.line(RIGHT - 45, sigY, RIGHT - 5, sigY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Receiver Signature", LEFT + 25, sigY + 4, { align: "center" });
  doc.text("Authorized Signatory", RIGHT - 25, sigY + 4, { align: "center" });
};

export const generateParcelInvoice = (order) => {
  try {
    const doc = new jsPDF({ 
      orientation: "portrait", 
      unit: "mm", 
      format: "a5" 
    });

    drawExactInvoice(doc, order);
    
    // Auto-open print dialog
    const blob = doc.output("bloburl");
    window.open(blob, "_blank");
  } catch (error) {
    console.error("PDF Generation failed:", error);
  }
};