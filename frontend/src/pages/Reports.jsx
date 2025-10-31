import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Reports = () => {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef();

  // Fetch items and transactions
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/reports/get");

      // Safe parsing for items
      const itemsData = Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.data)
          ? res.data
          : [];

      // Safe parsing for transactions
      const txnData = Array.isArray(res?.data?.transactions)
        ? res.data.transactions
        : [];

      setItems(itemsData);
      setTransactions(txnData);
      setError("");
    } catch (err) {
      console.error("Error fetching reports data:", err);
      setError("Failed to load report data. Please check your server.");
      setItems([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // PDF Export Function
  const exportToPDF = async () => {
    setExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`inventory-report-${timestamp}.pdf`);
      
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF report");
    } finally {
      setExporting(false);
    }
  };

  // Alternative simple PDF export (text-based)
  const exportSimplePDF = () => {
    setExporting(true);
    try {
      const pdf = new jsPDF();
      
      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Inventory Management Report', 20, 20);
      
      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
      
      let yPosition = 50;
      
      // Summary Section
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Summary', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Total Items: ${items.length}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Out of Stock: ${totalOutOfStockItems}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Total Transactions: ${transactions.length}`, 20, yPosition);
      yPosition += 15;
      
      // Stock Summary Section
      if (items.length > 0) {
        pdf.setFontSize(16);
        pdf.text('Stock Summary', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(8);
        // Table headers
        pdf.text('Item Name', 20, yPosition);
        pdf.text('Category', 80, yPosition);
        pdf.text('Stock', 140, yPosition);
        pdf.text('Status', 160, yPosition);
        yPosition += 5;
        
        // Table rows
        items.forEach((item, index) => {
          if (yPosition > 270) { // New page if needed
            pdf.addPage();
            yPosition = 20;
          }
          
          const status = getItemStatus(item);
          pdf.text(item.item_name || item.name || 'Unknown', 20, yPosition);
          pdf.text(item.category_name || item.category || 'Uncategorized', 80, yPosition);
          pdf.text(String(item.quantity || 0), 140, yPosition);
          pdf.text(status === 'available' ? 'Available' : 'Out of Stock', 160, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // Transactions Section
      if (transactions.length > 0) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(16);
        pdf.text('Recent Transactions', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(8);
        // Table headers
        pdf.text('Date', 20, yPosition);
        pdf.text('Item', 60, yPosition);
        pdf.text('Type', 120, yPosition);
        pdf.text('Qty', 140, yPosition);
        yPosition += 5;
        
        // Table rows (limit to 20 transactions)
        transactions.slice(0, 20).forEach((txn) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const date = new Date(txn.date || txn.createdAt).toLocaleDateString();
          pdf.text(date, 20, yPosition);
          pdf.text(txn.item_name || txn.item?.name || 'Unknown', 60, yPosition);
          pdf.text(txn.transaction_type === 'IN' ? 'IN' : 'OUT', 120, yPosition);
          pdf.text(String(txn.quantity), 140, yPosition);
          yPosition += 6;
        });
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`inventory-report-${timestamp}.pdf`);
      
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF report");
    } finally {
      setExporting(false);
    }
  };

  // Helpers
  const getItemStatus = (item) => {
    const quantity = item.quantity || 0;
    return quantity === 0 ? "out-of-stock" : "available";
  };

  const totalOutOfStockItems = items.filter(
    (item) => (item.quantity || 0) === 0
  ).length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Inventory Reports</h1>
            <p className="text-gray-500 text-sm">
              Dynamic inventory insights and analytics
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm font-medium flex items-center"
            >
              <span className="mr-2">↻</span> Refresh
            </button>
            <button 
              onClick={exportSimplePDF}
              disabled={exporting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <span className="mr-2">📄</span> Export Report
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <p className="text-red-600">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-800">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Report Content (for PDF export) */}
      <div ref={reportRef} className="bg-white p-6 rounded-lg shadow-sm">
        {/* Report Header for PDF */}
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management Report</h1>
          <p className="text-gray-600 mt-2">Generated on {new Date().toLocaleString()}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{totalOutOfStockItems}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">❌</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Transactions</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {transactions.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Summary Table */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Stock Summary</h2>
            <p className="text-sm text-gray-500">Current inventory status across all items</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-200">Item Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-200">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-200">Current Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400 text-sm border border-gray-200">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const status = getItemStatus(item);
                    const statusConfig = {
                      available: { class: "bg-green-100 text-green-700", label: "Available" },
                      "out-of-stock": { class: "bg-red-100 text-red-700", label: "Out of Stock" },
                    };

                    return (
                      <tr key={item.id} className="border border-gray-200">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-200">
                          {item.item_name || item.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                          {item.category_name || "Uncategorized"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                          <span className="font-semibold">{item.quantity || 0}</span> units
                        </td>
                        <td className="px-4 py-3 border border-gray-200">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded ${statusConfig[status].class}`}
                          >
                            {statusConfig[status].label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transactions Table */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
            <p className="text-sm text-gray-500">Recent IN/OUT transactions recorded in the system</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-200">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-200">Item</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-200">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-200">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border border-gray-200">Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-400 text-sm border border-gray-200">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 50).map((txn) => (
                    <tr key={txn.id} className="border border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                        {new Date(txn.date || txn.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-200">
                        {txn.item_name || txn.item?.name || "Unknown Item"}
                      </td>
                      <td className="px-4 py-3 text-sm border border-gray-200">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${txn.transaction_type === "IN"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {txn.transaction_type === "IN" ? "IN (Add)" : "OUT (Reduce)"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{txn.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 border border-gray-200">{txn.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center border-t pt-4">
          <p className="text-sm text-gray-500">
            Report generated on {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;