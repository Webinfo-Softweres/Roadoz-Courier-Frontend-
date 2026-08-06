import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Barcode from 'react-barcode';
import { getParcelOrderDetailApi } from '../services/apiCalls';
import logo from "../assets/images/RO-2.png";

const ParcelInvoice = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (id) {
      getParcelOrderDetailApi(id).then(setOrder);
    }
  }, [id]);

  if (!order) return <div className="p-10 text-center">Loading Consignment Note...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Print Settings */}
      <style>{`
        @page { size: A5 landscape; margin: 2mm; }
        @media print {
          body { background: none; padding: 0; }
          .no-print { display: none; }
          .invoice-card { border: none !important; box-shadow: none !important; margin: 0 !important; width: 210mm; height: 148mm; }
        }
        .invoice-card {
          width: 200mm;
          height: 140mm;
          background: white;
          border: 1px solid #000;
          margin: auto;
          font-family: 'Arial', sans-serif;
          font-size: 10px;
          color: #000;
          padding: 5px;
          display: flex;
          flex-direction: column;
        }
        .b-table td, .b-table th { border: 0.5px solid #000; padding: 3px 6px; }
        .bg-label { background-color: #f3f4f6; font-weight: bold; width: 120px; }
      `}</style>

      <div className="no-print mb-4 flex justify-center gap-4">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded shadow">Print Consignee Copy</button>
      </div>

      <div className="invoice-card relative">
        <div className="text-right text-[8px] font-bold uppercase mb-1">Consignee Copy</div>

        {/* Header Section */}
        <div className="flex border border-black">
          <div className="w-1/3 p-2 flex items-center justify-center border-r border-black">
            <img src={logo} className="h-12 object-contain" alt="Roadoz Logo" />
          </div>
          <div className="w-2/3 p-2 text-center relative">
            <h1 className="text-xl font-black">ROADOZ PVT. LTD.</h1>
            <p className="text-[9px] font-bold">Courier And Cargo</p>
            <p className="text-[8px]">Room No: 122, DD Vyapar Bhavan, Kadavanthra, Kochi-682020</p>
            <p className="text-[8px]">Phone: +91 9496630687 | Email: info@roadoz.com</p>
            <div className="flex justify-center gap-4 mt-1 font-bold text-[9px]">
              <span>GSTIN: 32AAPCR1988L1ZP</span>
              <span>AWB NO: {order.order_number}</span>
            </div>
          </div>
        </div>

        {/* Date / Payment / Barcode Section */}
        <div className="flex border-x border-b border-black">
          <div className="w-1/4 p-2 border-r border-black">
            <p className="font-bold text-[8px] uppercase">Date & Time</p>
            <p className="font-bold">{new Date(order.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-[9px]">Service: {order.service_type || 'Surface'}</p>
          </div>
          <div className="w-1/4 flex items-center justify-center border-r border-black">
            <span className="text-xl font-black uppercase italic">{order.payment_method}</span>
          </div>
          <div className="w-1/6 p-2 border-r border-black text-center">
            <p className="font-bold text-[8px]">TOTAL QTY</p>
            <p className="text-xl font-bold">{order.qty}</p>
          </div>
          <div className="w-1/3 flex items-center justify-center p-1">
            <Barcode value={order.order_number} height={30} width={1.2} fontSize={10} margin={0} />
          </div>
        </div>

        {/* Origin / Destination Blue Bar */}
        <div className="flex bg-white border-x border-black font-bold text-[9px]">
          <div className="w-1/2 p-1 border-r border-black">
            FROM : {order.sender_city?.toUpperCase()}, {order.sender_state?.toUpperCase()} - {order.sender_pincode}
          </div>
          <div className="w-1/2 p-1">
            DESTINATION : {order.receiver_city?.toUpperCase()}, {order.receiver_state?.toUpperCase()} - {order.receiver_pincode}
          </div>
        </div>

        {/* Consignor vs Consignee Details */}
        <table className="w-full border-collapse b-table text-[9px]">
          <tbody>
            <tr>
              <td className="bg-label">CONSIGNOR</td>
              <td className="w-[35%]">{order.sender_name}</td>
              <td className="bg-label">CONSIGNEE</td>
              <td>{order.receiver_name}</td>
            </tr>
            <tr>
              <td className="bg-label">CONTACT NO</td>
              <td>{order.sender_mobile}</td>
              <td className="bg-label">ADDRESS</td>
              <td>{order.receiver_address_line_1}</td>
            </tr>
            <tr>
              <td className="bg-label">ADDRESS</td>
              <td>{order.sender_address_line_1}</td>
              <td className="bg-label">DISTRICT</td>
              <td>{order.receiver_city}, {order.receiver_state} - {order.receiver_pincode}</td>
            </tr>
            <tr>
              <td className="p-0" colSpan={2}>
                <div className="flex h-full">
                  <div className="bg-label p-1 border-r border-black w-[120px]">Invoice No: {order.invoicenumber || 'N/A'}</div>
                  <div className="p-1 font-bold">Weight: {order.weight_kg} kg</div>
                </div>
              </td>
              <td className="bg-label">CONTACT NO</td>
              <td>{order.receiver_mobile}</td>
            </tr>
            <tr>
              <td className="p-0" colSpan={2}>
                <div className="flex h-full">
                  <div className="bg-label p-1 border-r border-black w-[120px]">Invoice Amount: {order.order_value}</div>
                  <div className="p-1 font-bold">Type: B2C</div>
                </div>
              </td>
              <td className="bg-label">Booked By</td>
              <td className="font-bold">SALES_TEAM</td>
            </tr>
          </tbody>
        </table>

        {/* Descriptions and Charges */}
        <div className="flex flex-1 border-x border-b border-black">
          <div className="w-3/4 border-r border-black">
            <div className="flex bg-gray-100 font-bold border-b border-black">
              <div className="p-1">DESCRIPTIONS / ITEM NAME</div>
            </div>
            <div className="p-2 font-bold uppercase italic">
              {order.product_name} (Qty: {order.qty})
            </div>
          </div>
          <div className="w-1/4">
            <div className="flex bg-gray-100 font-bold border-b border-black text-center">
              <div className="w-2/3 border-r border-black p-1">Charges</div>
              <div className="w-1/3 p-1">Amount</div>
            </div>
            <div className="flex flex-col h-full justify-between">
              <div className="flex text-[9px] p-1">
                <div className="w-2/3">{order.payment_method} Amount</div>
                <div className="w-1/3 text-right">{(order.total_freight || 0).toFixed(2)}</div>
              </div>
              <div className="flex font-black border-t border-black p-1 bg-gray-50">
                <div className="w-2/3 text-lg">TOTAL</div>
                <div className="w-1/3 text-right text-lg">{(order.total_freight || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details & Terms */}
        <div className="mt-auto">
          <div className="text-[8px] font-bold p-1">
            BANK: HDFC | A/C: 50200116941777 | IFSC: HDFC0002321
          </div>
          <div className="text-[7px] border-t border-black pt-1 italic px-1">
            Terms & conditions: (1) All shipments subject to standard carriage terms. (2) ROADOZ not responsible for illegal items. (3) Max liability Rs 100/- unless insured.
          </div>
          <div className="flex justify-between px-10 mt-6 pb-2">
            <div className="text-center border-t border-black pt-1 w-32 font-bold text-[9px]">Receiver Signature</div>
            <div className="text-center border-t border-black pt-1 w-32 font-bold text-[9px]">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParcelInvoice;