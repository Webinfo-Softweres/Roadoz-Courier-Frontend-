import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const downloadConsigneeExcel = (data) => {
  const consignees = Array.isArray(data) ? data : [data];

  const exportData = consignees.map((c, index) => ({
    NO: index + 1,
    ID: c.id,
    Name: c.name,
    Mobile: c.mobile,
    Email: c.email || "",
    "Address Line 1": c.address_line_1 || "",
    "Address Line 2": c.address_line_2 || "",
    City: c.city || "",
    State: c.state || "",
    Pincode: c.pincode || "",
    Status: c.status || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Consignees");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(file, "Consignees.xlsx");
};
