import type { ApiOrder } from "@/lib/api";

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export function printOrderBill(order: ApiOrder) {
  const itemRows = (order.items || []).map((item, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="item-name">${item.productName}</td>
      <td class="item-qty">${item.quantity}</td>
      <td class="item-price">${inr(item.productPrice)}</td>
      <td class="item-total">${inr(item.productPrice * item.quantity)}</td>
    </tr>`).join("");

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const orderTime = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${order.id} — Ethura Jewelry</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #ffffff;
      color: #1a1612;
      font-size: 13px;
      line-height: 1.5;
    }

    .page {
      max-width: 740px;
      margin: 0 auto;
      padding: 40px 48px;
    }

    /* ─── Header ─── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 28px;
      border-bottom: 2px solid #1a1612;
      margin-bottom: 28px;
    }
    .brand-block { display: flex; flex-direction: column; }
    .brand-name {
      font-size: 36px;
      letter-spacing: 10px;
      color: #1a1612;
      font-weight: 400;
      text-transform: uppercase;
      line-height: 1;
    }
    .brand-tagline {
      font-size: 9px;
      letter-spacing: 3px;
      color: #c4983f;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .brand-details {
      font-size: 11px;
      color: #777;
      margin-top: 8px;
      line-height: 1.6;
    }

    .invoice-title-block { text-align: right; }
    .invoice-title {
      font-size: 24px;
      letter-spacing: 4px;
      color: #c4983f;
      text-transform: uppercase;
      font-weight: 400;
    }
    .invoice-id {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #1a1612;
      font-weight: 700;
      margin-top: 4px;
    }
    .invoice-date { font-size: 11px; color: #777; margin-top: 4px; }

    /* ─── Gold accent bar ─── */
    .gold-bar {
      background: linear-gradient(90deg, #c4983f, #d4a853, #e8c87a, #d4a853, #c4983f);
      height: 3px;
      border-radius: 2px;
      margin: 20px 0;
    }

    /* ─── Info Grid ─── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .info-box {
      background: #faf8f5;
      border: 1px solid #e8ddd0;
      border-radius: 6px;
      padding: 16px 18px;
    }
    .info-box-label {
      font-size: 9px;
      letter-spacing: 3px;
      color: #c4983f;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .info-box p { font-size: 12px; color: #1a1612; line-height: 1.7; }
    .info-box .name { font-size: 13px; font-weight: 700; }

    /* ─── Status badges ─── */
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .badge-paid    { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-razorpay { background: #ede9fe; color: #4c1d95; }
    .badge-cod      { background: #f3f4f6; color: #374151; }

    /* ─── Items Table ─── */
    .section-title {
      font-size: 9px;
      letter-spacing: 3px;
      color: #c4983f;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 10px;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr {
      background: #1a1612;
    }
    thead th {
      padding: 10px 14px;
      font-size: 9px;
      letter-spacing: 2px;
      color: #d4a853;
      text-transform: uppercase;
      font-weight: 500;
      text-align: left;
    }
    thead th.right { text-align: right; }
    .row-even { background: #faf8f5; }
    .row-odd  { background: #ffffff; }
    td { padding: 10px 14px; border-bottom: 1px solid #f0ebe2; }
    .item-name  { font-size: 13px; color: #1a1612; }
    .item-qty   { font-size: 12px; color: #666; text-align: center; }
    .item-price { font-size: 12px; color: #666; text-align: right; }
    .item-total { font-size: 13px; font-weight: 700; color: #c4983f; text-align: right; }

    /* Totals */
    .totals { margin-top: 0; }
    .totals tr td {
      padding: 8px 14px;
      border: none;
      font-size: 12px;
    }
    .totals .label { color: #666; }
    .totals .value { text-align: right; font-weight: 600; color: #1a1612; }
    .totals .free  { color: #16a34a; }
    .total-row td  {
      background: #1a1612 !important;
      padding: 12px 14px !important;
      border: none !important;
    }
    .total-row .label { color: #d4a853 !important; font-size: 13px !important; font-weight: 600 !important; letter-spacing: 2px; }
    .total-row .value { color: #d4a853 !important; font-size: 16px !important; font-weight: 700 !important; text-align: right; }

    /* ─── Gift notice ─── */
    .gift-box {
      background: #fff8e6;
      border: 1px solid #f0d080;
      border-radius: 6px;
      padding: 14px 18px;
      margin-top: 20px;
      font-size: 12px;
      color: #92400e;
    }
    .gift-box .gift-label {
      font-size: 9px; letter-spacing: 2px; color: #d97706;
      text-transform: uppercase; font-weight: 600; margin-bottom: 4px;
    }

    /* ─── Footer ─── */
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e8ddd0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-left { font-size: 11px; color: #999; line-height: 1.7; }
    .footer-right { text-align: right; }
    .footer-brand { font-size: 18px; letter-spacing: 5px; color: #c4983f; }
    .footer-copy  { font-size: 10px; color: #bbb; margin-top: 2px; }

    .thank-you {
      text-align: center;
      margin: 24px 0 0;
      font-size: 12px;
      letter-spacing: 2px;
      color: #c4983f;
      text-transform: uppercase;
    }

    .cancelled-banner {
      background: #fef2f2;
      border: 2px solid #ef4444;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
      text-align: center;
    }
    .cancelled-banner .cancelled-title {
      font-size: 16px;
      font-weight: 700;
      color: #dc2626;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .cancelled-banner .cancelled-detail {
      font-size: 11px;
      color: #991b1b;
      margin-top: 4px;
    }

    /* ─── Print-only ─── */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page { padding: 24px 32px; }
    }
    @media screen {
      body { background: #f0ebe2; }
      .page {
        margin: 24px auto;
        background: white;
        box-shadow: 0 4px 32px rgba(0,0,0,0.12);
        border-radius: 8px;
      }
    }
  </style>
</head>
<body>
  <!-- Print/Download buttons (screen only) -->
  <div class="no-print" style="text-align:center;padding:16px;background:#1a1612;position:sticky;top:0;z-index:99;display:flex;justify-content:center;gap:12px;">
    <button onclick="window.print()" style="background:#d4a853;color:#1a1612;border:none;padding:10px 24px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-family:Georgia,serif;font-weight:600;border-radius:4px;">
      🖨️ Print Invoice
    </button>
    <button onclick="window.close()" style="background:transparent;color:#d4a853;border:1px solid #d4a853;padding:10px 24px;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-family:Georgia,serif;border-radius:4px;">
      ✕ Close
    </button>
  </div>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="brand-block">
        <div class="brand-name">ETHURA</div>
        <div class="brand-tagline">18k Gold Plated · Anti-Tarnish Jewelry</div>
        <div class="brand-details">
          ethura.store · contact@ethura.store<br />
          GST: 24XXXXX0000X1Z5 · India
        </div>
      </div>
      <div class="invoice-title-block">
        <div class="invoice-title">Invoice</div>
        <div class="invoice-id">${order.id}</div>
        <div class="invoice-date">${orderDate} · ${orderTime}</div>
      </div>
    </div>

    <div class="gold-bar"></div>

    ${order.status === "cancelled" ? `
    <div class="cancelled-banner">
      <div class="cancelled-title">✕ Order Cancelled</div>
      <div class="cancelled-detail">
        This order was cancelled${order.cancelledBy ? ` by ${order.cancelledBy}` : ""}${order.statusUpdatedAt ? ` on ${new Date(order.statusUpdatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} at ${new Date(order.statusUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}
      </div>
    </div>` : ""}

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-box">
        <div class="info-box-label">Billed To</div>
        <p class="name">${order.guestName || "—"}</p>
        <p>${order.guestEmail || "—"}</p>
        ${order.guestPhone ? `<p>${order.guestPhone}</p>` : ""}
        <p style="margin-top:6px;">${order.address}</p>
      </div>
      <div class="info-box">
        <div class="info-box-label">Payment Information</div>
        <p style="margin-bottom:6px;">
          Status: <span class="badge ${order.paymentStatus === "paid" ? "badge-paid" : "badge-pending"}">
            ${order.paymentStatus === "paid" ? "✓ Paid" : "Pending"}
          </span>
        </p>
        <p style="margin-bottom:6px;">
          Method: <span class="badge ${order.paymentMethod === "razorpay" ? "badge-razorpay" : "badge-cod"}">
            ${order.paymentMethod === "razorpay" ? "Razorpay · Online" : "Cash on Delivery"}
          </span>
        </p>
        ${order.paymentId ? `<p style="font-size:10px;color:#999;margin-top:8px;word-break:break-all;">Ref: ${order.paymentId}</p>` : ""}
      </div>
    </div>

    <!-- Items Table -->
    <div class="section-title">Order Items</div>
    <table>
      <thead>
        <tr>
          <th style="width:50%;">Product</th>
          <th style="text-align:center;">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Totals -->
    <table class="totals">
      <tr>
        <td class="label" style="width:50%;"></td>
        <td colspan="2" class="label">Subtotal</td>
        <td class="value">${inr(order.total)}</td>
      </tr>
      <tr>
        <td></td>
        <td colspan="2" class="label">Shipping</td>
        <td class="value free">FREE</td>
      </tr>
      <tr>
        <td></td>
        <td colspan="2" class="label">Tax (Incl.)</td>
        <td class="value">—</td>
      </tr>
      <tr class="total-row">
        <td></td>
        <td colspan="2" class="label">TOTAL PAID</td>
        <td class="value">${inr(order.total)}</td>
      </tr>
    </table>

    ${order.isGift && order.giftMessage ? `
    <div class="gift-box">
      <div class="gift-label">🎁 Gift Order</div>
      <p style="font-style:italic;">"${order.giftMessage}"</p>
    </div>` : ""}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        <p>Thank you for choosing Ethura.</p>
        <p>All products are quality checked before dispatch.</p>
        <p>Cancel within 24hrs: 100% refund · After 24hrs: 60% refund</p>
      </div>
      <div class="footer-right">
        <div class="footer-brand">ETHURA</div>
        <div class="footer-copy">© ${new Date().getFullYear()} Ethura Jewelry. All rights reserved.</div>
      </div>
    </div>

    <div class="thank-you">✦ Thank You For Your Purchase ✦</div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=820,height=900,scrollbars=yes");
  if (!win) {
    alert("Please allow pop-ups to print the invoice.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
