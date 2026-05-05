import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const downloadInvoiceExcel = (data) => {
  const orders = Array.isArray(data) ? data : [data];

  const invoiceData = orders.map((order) => ({
    "Transaction ID": order.transactionId,
    "Invoice No": order.id,
    "Customer Name": order.customer?.name,
    Phone: order.customer?.phone,
    "Order ID": order.order?.id,
    "Shipment ID": order.shipment?.id || "",
    Courier: order.shipment?.courier || "",
    "From City": order.route?.from,
    "From Pincode": order.route?.fromPin,
    "To City": order.route?.to,
    "To Pincode": order.route?.toPin,
    "Payment Type": order.payment?.method,
    "Total Amount": order.payment?.total,
    Weight: order.weight,
    Dimensions: order.dims,
    "Created Date": order.created,
  }));

  const worksheet = XLSX.utils.json_to_sheet(invoiceData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(file, "Invoices.xlsx");
};
